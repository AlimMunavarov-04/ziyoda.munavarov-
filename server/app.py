"""Menschen A1.1 — сервер: вход по логину и паролю, группы, прогресс учеников.

Весь сайт закрыт: без входа открывается только страница входа.
Учитель видит программу уроков и кабинет учителя, ученик — свои открытые уроки.
Данные — SQLite в ZIYODA_DATA (по умолчанию ~/ziyoda-data).
"""
import os
import re
import secrets
import sqlite3
import time
from datetime import date, timedelta
from functools import wraps

from flask import Flask, abort, g, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.environ.get("ZIYODA_DATA") or os.path.expanduser("~/ziyoda-data")
DB_PATH = os.path.join(DATA_DIR, "ziyoda.db")
DEV = os.environ.get("ZIYODA_DEV") == "1"

# Ящики интервального повторения: через сколько дней слово вернётся.
BOX_DAYS = [0, 1, 3, 7, 14, 30]
LOGIN_RE = re.compile(r"^[a-z0-9._-]{3,32}$")
PW_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
PW_METHOD = "pbkdf2:sha256:600000"
MAX_FAILS, FAIL_WINDOW = 8, 15 * 60

SCHEMA = """
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, login TEXT NOT NULL UNIQUE, pw_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher','student')), name TEXT NOT NULL DEFAULT '',
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL, last_seen INTEGER
);
CREATE TABLE IF NOT EXISTS group_sessions (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_num INTEGER NOT NULL, opened_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, session_num)
);
CREATE TABLE IF NOT EXISTS word_stats (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_key TEXT NOT NULL, box INTEGER NOT NULL DEFAULT 0, due TEXT NOT NULL,
  right_n INTEGER NOT NULL DEFAULT 0, wrong_n INTEGER NOT NULL DEFAULT 0, last_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, word_key)
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_num INTEGER, kind TEXT NOT NULL, total INTEGER NOT NULL, correct INTEGER NOT NULL, at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_fail (key TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ix_activity_user ON activity(user_id, at);
CREATE INDEX IF NOT EXISTS ix_login_fail ON login_fail(key, at);
"""


def secret_key():
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, "secret.key")
    if not os.path.exists(path):
        with open(path, "w") as f:
            f.write(secrets.token_hex(32))
        os.chmod(path, 0o600)
    with open(path) as f:
        return f.read().strip()


app = Flask(__name__, static_folder=None)
app.config.update(
    SECRET_KEY=secret_key(),
    SESSION_COOKIE_NAME="ziyoda",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=not DEV,
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    MAX_CONTENT_LENGTH=256 * 1024,
)


# ------------------------------------------------------------------ db
def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    con = g.pop("db", None)
    if con is not None:
        con.close()


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    con.execute("PRAGMA journal_mode = WAL")
    con.commit()
    con.close()


init_db()


def now():
    return int(time.time())


def gen_password():
    return "".join(secrets.choice(PW_ALPHABET) for _ in range(8))


# ------------------------------------------------------------------ auth
def current_user():
    if "u" not in g:
        g.u = None
        uid = session.get("uid")
        if uid:
            row = db().execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
            # пароль сменили — старые входы больше не действуют
            if row and session.get("pw") == row["pw_hash"][-12:]:
                g.u = row
    return g.u


def login_required(role=None):
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **kw):
            u = current_user()
            if not u:
                return jsonify(error="Нужно войти"), 401
            if role and u["role"] != role:
                return jsonify(error="Нет доступа"), 403
            return fn(*a, **kw)
        return wrapper
    return deco


@app.before_request
def guard_json_posts():
    # Запросы, меняющие данные, принимаем только как JSON: обычная форма
    # с чужого сайта так не отправится (защита от подделки запросов).
    if request.method in ("POST", "PUT", "DELETE") and not request.is_json:
        abort(415)


def body():
    return request.get_json(silent=True) or {}


def too_many_fails(key):
    cut = now() - FAIL_WINDOW
    con = db()
    con.execute("DELETE FROM login_fail WHERE at < ?", (cut,))
    n = con.execute("SELECT COUNT(*) FROM login_fail WHERE key = ?", (key,)).fetchone()[0]
    return n >= MAX_FAILS


@app.post("/api/login")
def api_login():
    b = body()
    login = str(b.get("login", "")).strip().lower()
    pw = str(b.get("password", ""))
    ip = request.headers.get("X-Real-IP") or request.remote_addr or "?"
    keys = ["ip:" + ip, "login:" + login]
    con = db()
    if any(too_many_fails(k) for k in keys):
        con.commit()
        return jsonify(error="Слишком много попыток. Подождите 15 минут."), 429
    row = con.execute("SELECT * FROM users WHERE login = ?", (login,)).fetchone()
    if not row or not check_password_hash(row["pw_hash"], pw):
        for k in keys:
            con.execute("INSERT INTO login_fail(key, at) VALUES (?, ?)", (k, now()))
        con.commit()
        return jsonify(error="Неверный логин или пароль"), 401
    con.execute("DELETE FROM login_fail WHERE key = ?", ("login:" + login,))
    con.execute("UPDATE users SET last_seen = ? WHERE id = ?", (now(), row["id"]))
    con.commit()
    session.clear()
    session.permanent = True
    session["uid"] = row["id"]
    session["pw"] = row["pw_hash"][-12:]
    return jsonify(ok=True, role=row["role"])


@app.post("/api/logout")
def api_logout():
    session.clear()
    return jsonify(ok=True)


@app.post("/api/password")
@login_required()
def api_password():
    b = body()
    u = current_user()
    if not check_password_hash(u["pw_hash"], str(b.get("old", ""))):
        return jsonify(error="Старый пароль неверный"), 400
    new = str(b.get("new", ""))
    if len(new) < 6:
        return jsonify(error="Новый пароль — не короче 6 символов"), 400
    h = generate_password_hash(new, method=PW_METHOD)
    db().execute("UPDATE users SET pw_hash = ? WHERE id = ?", (h, u["id"]))
    db().commit()
    session["pw"] = h[-12:]
    return jsonify(ok=True)


# ------------------------------------------------------------------ student / me
def opened_sessions(group_id):
    if not group_id:
        return []
    rows = db().execute("SELECT session_num FROM group_sessions WHERE group_id = ? ORDER BY session_num", (group_id,))
    return [r[0] for r in rows]


@app.get("/api/me")
@login_required()
def api_me():
    u = current_user()
    con = db()
    if not u["last_seen"] or now() - u["last_seen"] > 300:
        con.execute("UPDATE users SET last_seen = ? WHERE id = ?", (now(), u["id"]))
        con.commit()
    out = {"id": u["id"], "login": u["login"], "name": u["name"], "role": u["role"], "today": date.today().isoformat()}
    if u["role"] == "student":
        grp = con.execute("SELECT id, name FROM groups WHERE id = ?", (u["group_id"],)).fetchone() if u["group_id"] else None
        out["group"] = dict(grp) if grp else None
        out["opened"] = opened_sessions(u["group_id"])
        out["stats"] = {
            r["word_key"]: {"b": r["box"], "d": r["due"], "r": r["right_n"], "w": r["wrong_n"]}
            for r in con.execute("SELECT * FROM word_stats WHERE user_id = ?", (u["id"],))
        }
        week = now() - 7 * 86400
        out["week"] = con.execute(
            "SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS total, COALESCE(SUM(correct),0) AS correct FROM activity WHERE user_id = ? AND at > ?",
            (u["id"], week)).fetchone()[0]
    return jsonify(out)


@app.post("/api/practice")
@login_required("student")
def api_practice():
    """Итог тренировки: обновляем ящики слов и пишем запись в журнал."""
    b = body()
    answers = b.get("answers") or []
    if not isinstance(answers, list) or len(answers) > 500:
        return jsonify(error="Неверные данные"), 400
    u = current_user()
    con = db()
    today = date.today()
    correct = 0
    for a in answers:
        key = str((a or {}).get("k", ""))[:120]
        if not key:
            continue
        ok = bool(a.get("ok"))
        correct += ok
        row = con.execute("SELECT box FROM word_stats WHERE user_id = ? AND word_key = ?", (u["id"], key)).fetchone()
        box = row["box"] if row else 0
        box = min(box + 1, len(BOX_DAYS) - 1) if ok else 0
        due = (today + timedelta(days=BOX_DAYS[box])).isoformat()
        con.execute(
            """INSERT INTO word_stats(user_id, word_key, box, due, right_n, wrong_n, last_at) VALUES (?,?,?,?,?,?,?)
               ON CONFLICT(user_id, word_key) DO UPDATE SET box = excluded.box, due = excluded.due,
               right_n = right_n + excluded.right_n, wrong_n = wrong_n + excluded.wrong_n, last_at = excluded.last_at""",
            (u["id"], key, box, due, 1 if ok else 0, 0 if ok else 1, now()))
    kind = str(b.get("kind", ""))[:20] or "cards"
    ses = b.get("session")
    ses = int(ses) if isinstance(ses, int) else None
    con.execute("INSERT INTO activity(user_id, session_num, kind, total, correct, at) VALUES (?,?,?,?,?,?)",
                (u["id"], ses, kind, len(answers), correct, now()))
    con.commit()
    return jsonify(ok=True)


# ------------------------------------------------------------------ teacher
def clean_login(s):
    return str(s or "").strip().lower()


@app.get("/api/groups")
@login_required("teacher")
def api_groups():
    con = db()
    groups = []
    for gr in con.execute("SELECT * FROM groups ORDER BY name"):
        n = con.execute("SELECT COUNT(*) FROM users WHERE group_id = ? AND role = 'student'", (gr["id"],)).fetchone()[0]
        groups.append({"id": gr["id"], "name": gr["name"], "students": n, "opened": opened_sessions(gr["id"])})
    return jsonify(groups)


@app.post("/api/groups")
@login_required("teacher")
def api_group_create():
    name = str(body().get("name", "")).strip()[:60]
    if not name:
        return jsonify(error="Введите название группы"), 400
    cur = db().execute("INSERT INTO groups(name, created_at) VALUES (?, ?)", (name, now()))
    db().commit()
    return jsonify(id=cur.lastrowid)


@app.delete("/api/groups/<int:gid>")
@login_required("teacher")
def api_group_delete(gid):
    con = db()
    if con.execute("SELECT COUNT(*) FROM users WHERE group_id = ?", (gid,)).fetchone()[0]:
        return jsonify(error="Сначала удалите или переведите учеников группы"), 400
    con.execute("DELETE FROM groups WHERE id = ?", (gid,))
    con.commit()
    return jsonify(ok=True)


@app.post("/api/groups/<int:gid>/sessions")
@login_required("teacher")
def api_group_session(gid):
    b = body()
    num = b.get("session")
    if not isinstance(num, int) or not 1 <= num <= 200:
        return jsonify(error="Неверный номер занятия"), 400
    con = db()
    if not con.execute("SELECT 1 FROM groups WHERE id = ?", (gid,)).fetchone():
        return jsonify(error="Группа не найдена"), 404
    if b.get("open"):
        con.execute("INSERT OR IGNORE INTO group_sessions(group_id, session_num, opened_at) VALUES (?,?,?)", (gid, num, now()))
    else:
        con.execute("DELETE FROM group_sessions WHERE group_id = ? AND session_num = ?", (gid, num))
    con.commit()
    return jsonify(opened=opened_sessions(gid))


@app.get("/api/groups/<int:gid>/report")
@login_required("teacher")
def api_group_report(gid):
    con = db()
    gr = con.execute("SELECT * FROM groups WHERE id = ?", (gid,)).fetchone()
    if not gr:
        return jsonify(error="Группа не найдена"), 404
    week = now() - 7 * 86400
    students = []
    for s in con.execute("SELECT * FROM users WHERE group_id = ? AND role = 'student' ORDER BY name, login", (gid,)):
        st = con.execute(
            "SELECT COUNT(*) AS words, COALESCE(SUM(box >= 3),0) AS strong, COALESCE(SUM(right_n),0) AS r, COALESCE(SUM(wrong_n),0) AS w FROM word_stats WHERE user_id = ?",
            (s["id"],)).fetchone()
        wk = con.execute("SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS total FROM activity WHERE user_id = ? AND at > ?", (s["id"], week)).fetchone()
        last = con.execute("SELECT MAX(at) FROM activity WHERE user_id = ?", (s["id"],)).fetchone()[0]
        students.append({
            "id": s["id"], "login": s["login"], "name": s["name"], "last_seen": s["last_seen"], "last_practice": last,
            "words": st["words"], "strong": st["strong"], "right": st["r"], "wrong": st["w"],
            "week_sessions": wk["n"], "week_answers": wk["total"],
        })
    hard = [dict(r) for r in con.execute(
        """SELECT word_key AS k, SUM(wrong_n) AS wrong, SUM(right_n) AS right FROM word_stats
           WHERE user_id IN (SELECT id FROM users WHERE group_id = ?) GROUP BY word_key
           HAVING SUM(wrong_n) > 0 ORDER BY SUM(wrong_n) * 1.0 / (SUM(wrong_n) + SUM(right_n)) DESC, SUM(wrong_n) DESC LIMIT 20""",
        (gid,))]
    return jsonify(group={"id": gr["id"], "name": gr["name"]}, opened=opened_sessions(gid), students=students, hard=hard)


@app.post("/api/students")
@login_required("teacher")
def api_student_create():
    b = body()
    login = clean_login(b.get("login"))
    name = str(b.get("name", "")).strip()[:80]
    gid = b.get("group_id")
    if not LOGIN_RE.match(login):
        return jsonify(error="Логин: 3–32 символа, латинские буквы, цифры, точка, дефис"), 400
    con = db()
    if not isinstance(gid, int) or not con.execute("SELECT 1 FROM groups WHERE id = ?", (gid,)).fetchone():
        return jsonify(error="Выберите группу"), 400
    if con.execute("SELECT 1 FROM users WHERE login = ?", (login,)).fetchone():
        return jsonify(error="Такой логин уже есть"), 400
    pw = gen_password()
    con.execute("INSERT INTO users(login, pw_hash, role, name, group_id, created_at) VALUES (?,?,?,?,?,?)",
                (login, generate_password_hash(pw, method=PW_METHOD), "student", name, gid, now()))
    con.commit()
    return jsonify(login=login, password=pw)


def student_or_404(sid):
    row = db().execute("SELECT * FROM users WHERE id = ? AND role = 'student'", (sid,)).fetchone()
    if not row:
        abort(404)
    return row


@app.post("/api/students/<int:sid>/reset")
@login_required("teacher")
def api_student_reset(sid):
    s = student_or_404(sid)
    pw = gen_password()
    db().execute("UPDATE users SET pw_hash = ? WHERE id = ?", (generate_password_hash(pw, method=PW_METHOD), sid))
    db().commit()
    return jsonify(login=s["login"], password=pw)


@app.post("/api/students/<int:sid>")
@login_required("teacher")
def api_student_update(sid):
    student_or_404(sid)
    b = body()
    con = db()
    if "name" in b:
        con.execute("UPDATE users SET name = ? WHERE id = ?", (str(b["name"]).strip()[:80], sid))
    if "group_id" in b:
        gid = b["group_id"]
        if not isinstance(gid, int) or not con.execute("SELECT 1 FROM groups WHERE id = ?", (gid,)).fetchone():
            return jsonify(error="Группа не найдена"), 400
        con.execute("UPDATE users SET group_id = ? WHERE id = ?", (gid, sid))
    con.commit()
    return jsonify(ok=True)


@app.delete("/api/students/<int:sid>")
@login_required("teacher")
def api_student_delete(sid):
    student_or_404(sid)
    db().execute("DELETE FROM users WHERE id = ?", (sid,))
    db().commit()
    return jsonify(ok=True)


@app.get("/api/students/<int:sid>/words")
@login_required("teacher")
def api_student_words(sid):
    s = student_or_404(sid)
    rows = db().execute("SELECT word_key AS k, box AS b, right_n AS r, wrong_n AS w, due AS d FROM word_stats WHERE user_id = ?", (sid,))
    return jsonify(student={"id": s["id"], "login": s["login"], "name": s["name"]}, words=[dict(r) for r in rows])


# ------------------------------------------------------------------ pages and files
PUBLIC = {"login.html", "css/style.css", "js/login.js"}
PRIVATE_DIRS = ("css/", "js/", "data/")


def nocache(resp):
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "same-origin"
    return resp


@app.get("/")
def index():
    if not current_user():
        return redirect("/login")
    return nocache(send_from_directory(ROOT, "index.html"))


@app.get("/login")
def login_page():
    if current_user():
        return redirect("/")
    return nocache(send_from_directory(ROOT, "login.html"))


@app.get("/<path:path>")
def files(path):
    if path in PUBLIC:
        return nocache(send_from_directory(ROOT, path))
    if not path.startswith(PRIVATE_DIRS) or not re.match(r"^[a-z]+/[A-Za-z0-9_.-]+\.(js|css)$", path):
        abort(404)
    if not current_user():
        abort(401)
    return nocache(send_from_directory(ROOT, path))


@app.get("/api/health")
def health():
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8097")), debug=DEV)
