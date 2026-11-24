"""Команды для сервера.

  python server/manage.py teacher <логин> ["Имя"]   — создать учителя или сменить ему пароль
  python server/manage.py users                     — список всех учётных записей
"""
import getpass
import sys
import time

from app import DB_PATH, LOGIN_RE, PW_METHOD, init_db
from werkzeug.security import generate_password_hash
import sqlite3


def main(argv):
    init_db()
    con = sqlite3.connect(DB_PATH)
    if len(argv) >= 2 and argv[0] == "teacher":
        login = argv[1].strip().lower()
        if not LOGIN_RE.match(login):
            sys.exit("Логин: 3–32 символа, латинские буквы, цифры, точка, дефис")
        name = argv[2] if len(argv) > 2 else login
        pw = getpass.getpass("Пароль для " + login + ": ")
        if len(pw) < 6 or pw != getpass.getpass("Ещё раз: "):
            sys.exit("Пароли не совпадают или короче 6 символов")
        h = generate_password_hash(pw, method=PW_METHOD)
        row = con.execute("SELECT id, role FROM users WHERE login = ?", (login,)).fetchone()
        if row:
            con.execute("UPDATE users SET pw_hash = ?, role = 'teacher' WHERE id = ?", (h, row[0]))
            print("Пароль учителя", login, "обновлён")
        else:
            con.execute("INSERT INTO users(login, pw_hash, role, name, created_at) VALUES (?,?,?,?,?)",
                        (login, h, "teacher", name, int(time.time())))
            print("Учитель", login, "создан")
        con.commit()
    elif argv[:1] == ["users"]:
        for r in con.execute("SELECT login, role, name FROM users ORDER BY role, login"):
            print("{:<20} {:<8} {}".format(*r))
    else:
        print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
