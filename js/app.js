/* Menschen A1.1 — программа уроков для учителя.
   Без сервера: открывается двойным щелчком по index.html. */
(function () {
  "use strict";

  // ---------------------------------------------------------------- data model
  var SESSIONS = [];   // все занятия по порядку
  var ALL_WORDS = [];  // все уникальные слова курса

  function wordKey(de) {
    // Существительное (со строчным артиклем) сравниваем с учётом регистра,
    // чтобы «der Morgen» (утро) и «morgen» (завтра) считались разными словами.
    var s = de.split(" / ")[0].trim();
    var m = s.match(/^(der|die|das) (.+)$/);
    s = m ? m[2] : s.toLowerCase();
    return s.replace(/[…?!.,]/g, "").replace(/\s+/g, " ").trim();
  }
  function parseWord(str) {
    var p = str.split("|");
    return { de: (p[0] || "").trim(), ru: (p[1] || "").trim(), tj: (p[2] || "").trim() };
  }

  function build() {
    var seen = {};
    var n = 0;
    window.COURSE.forEach(function (les) {
      les.sessions.forEach(function (ses, i) {
        n++;
        var s = {
          num: n, lesson: les.lesson, lessonTitle: les.title, lessonRu: les.ru, module: les.module,
          part: i + 1, parts: les.sessions.length, pages: ses.pages, title: ses.title,
          steps: [], home: ses.home || [], words: []
        };
        ses.steps.forEach(function (st, j) {
          var step = Object.assign({}, st, { id: n + "-" + j, newWords: [], repeats: [] });
          st.words.forEach(function (w) {
            var word = parseWord(w);
            var k = wordKey(word.de);
            if (seen[k]) { step.repeats.push({ w: word, from: seen[k] }); return; }
            word.session = n; word.ref = st.ref; word.lesson = les.lesson; word.module = les.module;
            seen[k] = word;
            step.newWords.push(word);
            s.words.push(word);
            ALL_WORDS.push(word);
          });
          s.steps.push(step);
        });
        SESSIONS.push(s);
      });
    });
  }

  // ---------------------------------------------------------------- storage
  function load(key, def) { try { var v = localStorage.getItem("menschen." + key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function save(key, val) { try { localStorage.setItem("menschen." + key, JSON.stringify(val)); } catch (e) { /* ignore */ } }
  var done = load("done", {});
  var prefs = load("prefs", { slow: false, big: false });

  // ---------------------------------------------------------------- helpers
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }
  function lessonLabel(s) {
    return typeof s.lesson === "number" ? "Lektion " + s.lesson + (s.parts > 1 ? " · часть " + s.part + "/" + s.parts : "") : "Модуль " + s.module;
  }
  function colorArticle(de) {
    return esc(de).replace(/(^|\/ )(der|das|die) /g, function (m, pre, art) { return pre + '<span class="art-' + art + '">' + art + "</span> "; });
  }

  // ---------------------------------------------------------------- speech
  var voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^de/i.test(v.lang); });
    var pref = vs.filter(function (v) { return /natural|online|google/i.test(v.name); });
    voice = pref[0] || vs[0] || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speakText(t) {
    return t.replace(/\(.*?\)/g, "").replace(/…/g, "").replace(/ \/ /g, ", ").replace(/[↗↘]/g, "").trim();
  }
  function speak(list, cancel) {
    if (!("speechSynthesis" in window)) { toast("Браузер не умеет озвучивать текст"); return; }
    if (cancel !== false) speechSynthesis.cancel();
    if (!voice) pickVoice();
    (Array.isArray(list) ? list : [list]).forEach(function (t) {
      var u = new SpeechSynthesisUtterance(speakText(t));
      u.lang = "de-DE"; if (voice) u.voice = voice;
      u.rate = prefs.slow ? 0.6 : 0.9;
      speechSynthesis.speak(u);
    });
  }

  // ---------------------------------------------------------------- word table → text / image
  function wordsToText(title, words) {
    var lines = [title, "", "Deutsch\tРусский\tТоҷикӣ"];
    words.forEach(function (w, i) { lines.push((i + 1) + ". " + w.de + "\t" + w.ru + "\t" + w.tj); });
    return lines.join("\n");
  }
  function wrapLines(ctx, text, maxW) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function wordsToCanvas(title, subtitle, words) {
    var scale = 2, W = 1000, pad = 28, cols = [44, 330, 290, 290], lh = 28, font = "18px " + getComputedStyle(document.body).fontFamily;
    var c = document.createElement("canvas"), ctx = c.getContext("2d");
    ctx.font = font;
    var rows = words.map(function (w, i) {
      var cells = [String(i + 1), w.de, w.ru, w.tj];
      var wrapped = cells.map(function (t, ci) { return wrapLines(ctx, t, cols[ci] - 16); });
      var h = Math.max.apply(null, wrapped.map(function (l) { return l.length; })) * lh + 14;
      return { cells: wrapped, h: h };
    });
    var head = 96, thead = 40;
    var H = head + thead + rows.reduce(function (a, r) { return a + r.h; }, 0) + pad + 24;
    c.width = W * scale; c.height = H * scale; ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2f6fdf"; ctx.fillRect(0, 0, W, 6);
    ctx.fillStyle = "#1d2433"; ctx.font = "bold 24px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText(title, pad, 46);
    ctx.fillStyle = "#5a6475"; ctx.font = "16px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText(subtitle, pad, 74);
    var y = head;
    ctx.fillStyle = "#f0f2f5"; ctx.fillRect(pad, y, W - pad * 2, thead);
    ctx.fillStyle = "#5a6475"; ctx.font = "bold 14px " + getComputedStyle(document.body).fontFamily;
    var x = pad;
    ["#", "DEUTSCH", "РУССКИЙ", "ТОҶИКӢ"].forEach(function (h, i) { ctx.fillText(h, x + 8, y + 26); x += cols[i]; });
    y += thead;
    ctx.font = font;
    rows.forEach(function (r, ri) {
      if (ri % 2 === 1) { ctx.fillStyle = "#f8f9fb"; ctx.fillRect(pad, y, W - pad * 2, r.h); }
      x = pad;
      r.cells.forEach(function (lines, ci) {
        ctx.fillStyle = ci === 0 ? "#8a93a3" : ci === 1 ? "#1d2433" : "#3a4354";
        ctx.font = (ci === 1 ? "bold " : "") + font;
        lines.forEach(function (ln, li) {
          if (ci === 1 && li === 0) {
            var m = ln.match(/^(der|das|die) (.*)$/);
            if (m) {
              ctx.fillStyle = { der: "#2f6fdf", das: "#1f9d55", die: "#d64545" }[m[1]];
              ctx.fillText(m[1], x + 8, y + 26);
              var aw = ctx.measureText(m[1] + " ").width;
              ctx.fillStyle = "#1d2433"; ctx.fillText(m[2], x + 8 + aw, y + 26);
              return;
            }
          }
          ctx.fillText(ln, x + 8, y + 26 + li * lh);
        });
        x += cols[ci];
      });
      ctx.strokeStyle = "#e3e6eb"; ctx.beginPath(); ctx.moveTo(pad, y + r.h); ctx.lineTo(W - pad, y + r.h); ctx.stroke();
      y += r.h;
    });
    ctx.fillStyle = "#8a93a3"; ctx.font = "13px " + getComputedStyle(document.body).fontFamily;
    ctx.fillText("Menschen A1.1 · слова к уроку", pad, H - 16);
    return c;
  }
  function canvasBlob(c) { return new Promise(function (res) { c.toBlob(res, "image/png"); }); }
  function fileName(title) { return title.replace(/[^\p{L}\p{N}\-]+/gu, "_").replace(/^_|_$/g, "").slice(0, 60) + ".png"; }

  var TABLES = {}; // id -> {title, subtitle, words}
  var tableSeq = 0;
  function wordTable(title, subtitle, words, opts) {
    opts = opts || {};
    if (!words.length) return "";
    var id = "t" + (++tableSeq);
    TABLES[id] = { title: title, subtitle: subtitle, words: words };
    var canShare = !!(navigator.canShare && window.File && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] }));
    var h = '<div class="wt-wrap" data-table="' + id + '"><div class="wt-bar">' +
      '<span class="cnt">' + (opts.label || "Новые слова") + ": " + words.length + "</span>" +
      '<button class="btn sm" data-act="say-all">🔊 Все</button>' +
      (opts.quiz !== false ? '<button class="btn sm" data-act="quiz">🎴 Опрос</button>' : "") +
      '<button class="btn sm" data-act="copy-text">📋 Текст</button>' +
      '<button class="btn sm" data-act="copy-img">🖼 Копировать картинку</button>' +
      '<button class="btn sm" data-act="png">⬇ PNG</button>' +
      (canShare ? '<button class="btn sm" data-act="share">📤 Отправить</button>' : "") +
      '</div><div class="wt-scroll"><table class="wt"><thead><tr><th>#</th><th>Deutsch</th><th>Русский</th><th>Тоҷикӣ</th>' +
      (opts.src ? "<th>Где</th>" : "") + "</tr></thead><tbody>";
    words.forEach(function (w, i) {
      h += '<tr><td class="num">' + (i + 1) + '</td><td class="de">' + colorArticle(w.de) +
        ' <button class="icon-btn say" title="Послушать" data-say="' + esc(w.de) + '">🔊</button></td><td>' + esc(w.ru) + "</td><td>" + esc(w.tj) + "</td>" +
        (opts.src ? '<td class="src"><a href="#/s/' + w.session + '">Зан. ' + w.session + "</a></td>" : "") + "</tr>";
    });
    return h + "</tbody></table></div></div>";
  }

  async function tableAction(act, id) {
    var t = TABLES[id]; if (!t) return;
    if (act === "say-all") { speak(t.words.map(function (w) { return w.de; })); return; }
    if (act === "quiz") { openQuiz(t.words, t.title); return; }
    if (act === "copy-text") {
      try { await navigator.clipboard.writeText(wordsToText(t.title + " — " + t.subtitle, t.words)); toast("Таблица скопирована текстом (вставляется в Excel/Word/Telegram)"); }
      catch (e) { toast("Не удалось скопировать: браузер не дал доступ к буферу"); }
      return;
    }
    var canvas = wordsToCanvas(t.title, t.subtitle, t.words);
    var blob = await canvasBlob(canvas);
    if (act === "png") {
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(t.title + " " + t.subtitle); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return;
    }
    if (act === "copy-img") {
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast("Картинка скопирована — вставьте её в Telegram/WhatsApp (Ctrl+V)"); }
      catch (e) { toast("Браузер не дал скопировать картинку — нажмите «⬇ PNG»"); }
      return;
    }
    if (act === "share") {
      var file = new File([blob], fileName(t.title + " " + t.subtitle), { type: "image/png" });
      try { await navigator.share({ files: [file], title: t.title, text: t.subtitle }); } catch (e) { /* cancelled */ }
    }
  }

  // ---------------------------------------------------------------- rule block
  function ruleBlock(id) {
    var r = window.RULES[id]; if (!r) return "";
    return '<div class="rule"><div class="rule-title">📘 Правило: ' + esc(r.t) + '</div><div class="rule-grid">' +
      '<div><div class="lang">Deutsch</div>' + esc(r.de) + "</div>" +
      '<div><div class="lang">Русский</div>' + esc(r.ru) + "</div></div>" +
      (r.ex && r.ex.length ? '<div class="rule-ex">' + r.ex.map(function (e) { return '<button data-say="' + esc(e) + '">🔊 ' + esc(e) + "</button>"; }).join("") + "</div>" : "") +
      "</div>";
  }

  // ---------------------------------------------------------------- views
  function sideNav(active) {
    var h = '<div class="nav-top">' +
      '<a href="#/" class="' + (active === "home" ? "on" : "") + '">🏠 О программе</a>' +
      '<a href="#/words" class="' + (active === "words" ? "on" : "") + '">📚 Все слова (' + ALL_WORDS.length + ")</a>" +
      '<a href="#/rules" class="' + (active === "rules" ? "on" : "") + '">📘 Все правила</a></div><div class="nav">';
    var mod = 0;
    SESSIONS.forEach(function (s) {
      if (s.module !== mod) { mod = s.module; h += '<div class="mod-title">Модуль ' + mod + "</div>"; }
      var isDone = done["s" + s.num];
      h += '<a href="#/s/' + s.num + '" class="' + (active === s.num ? "on" : "") + '"><span class="n">' + s.num + "</span><span>" +
        esc(typeof s.lesson === "number" ? "L" + s.lesson + (s.parts > 1 ? "." + s.part : "") + " · " + s.title : "Повторение модуля " + s.module) +
        "</span>" + (isDone ? '<span class="tick">✓</span>' : "") + "</a>";
    });
    return h + "</div>";
  }

  function viewHome() {
    var mins = SESSIONS.length * 90;
    return '<h1>Menschen A1.1 — программа уроков</h1><p class="sub">По рабочей тетради Menschen A1.1 Arbeitsbuch (Hueber). Урок 90 минут: 30 минут — проверка домашнего задания, 60 минут — новая тема.</p>' +
      '<div class="grid-2">' +
      '<div class="card"><div class="stat">' + SESSIONS.length + '</div><div class="muted">занятий по 90 минут (' + Math.round(mins / 60) + " часов)</div></div>" +
      '<div class="card"><div class="stat">' + ALL_WORDS.length + '</div><div class="muted">слов без повторов — с переводом на русский и таджикский</div></div>' +
      '<div class="card"><div class="stat">' + Object.keys(window.RULES).length + '</div><div class="muted">правил грамматики и произношения (DE + RU)</div></div></div>' +
      '<div class="card"><h2>Как устроено занятие</h2><ol class="hw-list">' +
      "<li><b>Проверка ДЗ — 30 мин.</b> 10 мин опрос слов прошлого занятия (кнопка «🎴 Опрос»), 15 мин проверка упражнений, 5 мин произношение.</li>" +
      "<li><b>Новая тема — 60 мин.</b> Упражнения строго в порядке книги: страница, номер, что делаем, как вести, время.</li>" +
      "<li><b>Слова к каждому упражнению</b> — только новые. Если слово уже было раньше, оно не повторяется (под заданием видно, какие слова уже изучали).</li>" +
      "<li><b>🔊</b> — послушать слово по-немецки (кнопка «🐢» вверху — медленно). <b>🖼 / 📤</b> — отправить таблицу слов картинкой ученикам.</li>" +
      "<li><b>Правила</b> — в отдельном жёлтом блоке на немецком и русском, с примерами для прослушивания.</li></ol></div>" +
      '<div class="card"><h2>Что нужно учителю</h2><p>Книга Menschen A1.1 Arbeitsbuch (печатная или PDF для показа экрана). Тексты упражнений берутся из книги — программа указывает страницу и номер, порядок и способ работы. Аудио: CD к рабочей тетради; если его нет, учитель читает тексты сам (это указано в задании).</p>' +
      '<div class="warn-box">В скане книги нет страниц <b>S. 56</b> (урок 7) и <b>S. 87</b> (урок 11). Для этих мест в программе даны замены — их стоит сверить с оригиналом книги.</div></div>' +
      '<div class="nav-foot"><span></span><a class="btn primary" href="#/s/1">Начать с занятия 1 →</a></div>';
  }

  function hwBlock(s) {
    var prev = SESSIONS[s.num - 2];
    if (!prev) {
      return '<div class="card"><div class="hw-row"><span class="chip time">30 мин</span><div><b>Первое занятие — проверки ДЗ нет.</b> Вместо неё: знакомство, цели курса, как устроена книга (Basistraining, Training, Test, Lernwortschatz), немецкий алфавит.' +
        '<div class="say-list">' + "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Ä Ö Ü ß".split(" ").map(function (l) { return '<button data-say="' + l + '">' + l + "</button>"; }).join("") + "</div></div></div></div>";
    }
    var hard = prev.words.slice().sort(function (a, b) { return b.de.length - a.de.length; }).slice(0, 6);
    return '<div class="card">' +
      '<div class="hw-row"><span class="chip time">10 мин</span><div><b>Словарный опрос</b> — слова занятия ' + prev.num + " (" + prev.words.length + ' шт.). Учитель показывает перевод, ученик называет немецкое слово с артиклем.' +
      (prev.words.length ? '<div style="margin-top:8px"><button class="btn sm primary" data-quiz-session="' + prev.num + '">🎴 Начать опрос</button></div>' : "") + "</div></div>" +
      '<div class="hw-row"><span class="chip time">15 мин</span><div><b>Проверка домашнего задания</b> (из занятия ' + prev.num + '):<ul class="hw-list">' +
      prev.home.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul></div></div>" +
      '<div class="hw-row"><span class="chip time">5 мин</span><div><b>Произношение</b> — повторить за диктором самые длинные слова прошлого занятия:' +
      '<div class="say-list">' + hard.map(function (w) { return '<button data-say="' + esc(w.de) + '">🔊 ' + esc(w.de) + "</button>"; }).join("") + "</div></div></div></div>";
  }

  function viewSession(num) {
    var s = SESSIONS[num - 1];
    if (!s) return viewHome();
    var sum = s.steps.reduce(function (a, st) { return a + st.min; }, 0);
    var h = '<div class="muted">Занятие ' + s.num + " из " + SESSIONS.length + " · Модуль " + s.module + "</div>" +
      "<h1>" + esc(lessonLabel(s)) + ": " + esc(s.title) + "</h1>" +
      '<p class="sub">' + esc(typeof s.lesson === "number" ? s.lessonTitle + " — " + s.lessonRu : s.lessonRu) + "</p>" +
      '<div class="meta"><span class="chip">📖 ' + esc(s.pages) + '</span><span class="chip">⏱ 90 мин = 30 ДЗ + ' + sum + ' новая тема</span><span class="chip">🆕 ' + s.words.length + " новых слов</span>" +
      '<label class="check"><input type="checkbox" data-done-session="' + s.num + '" ' + (done["s" + s.num] ? "checked" : "") + "> Занятие проведено</label></div>";

    // timeline
    h += '<div class="timeline"><div class="hw" style="flex:30" data-jump="hw">ДЗ 30</div>' +
      s.steps.map(function (st) { return '<div class="st ' + (done[st.id] ? "done" : "") + '" style="flex:' + st.min + '" data-jump="' + st.id + '" title="' + esc(st.ref) + '">' + st.min + "</div>"; }).join("") + "</div>";

    h += '<div class="part-head" id="hw"><h2>Часть 1. Проверка домашнего задания</h2><span class="chip time">30 мин</span><button class="btn sm" data-timer="30" data-timer-name="Проверка ДЗ">▶ Таймер</button></div>' + hwBlock(s);

    h += '<div class="part-head"><h2>Часть 2. Новая тема</h2><span class="chip time">' + sum + " мин</span></div>";
    s.steps.forEach(function (st) {
      h += '<div class="card step ' + (done[st.id] ? "done" : "") + '" id="' + st.id + '"><div class="step-head">' +
        '<span class="chip time">' + st.min + " мин</span><span class=\"ref\">" + esc(st.ref) + '</span><span class="type ' + esc(st.type) + '">' + esc(st.type) + "</span>" +
        '<span class="right"><button class="btn sm" data-timer="' + st.min + '" data-timer-name="' + esc(st.ref) + '">▶ Таймер</button>' +
        '<label class="check"><input type="checkbox" data-done-step="' + st.id + '" ' + (done[st.id] ? "checked" : "") + "> Готово</label></span></div>" +
        '<p class="task">' + esc(st.task) + "</p>" + (st.how ? '<p class="how"><b>Как вести:</b> ' + esc(st.how) + "</p>" : "") +
        wordTable("Занятие " + s.num + " · " + st.ref, lessonLabel(s) + " · " + s.title, st.newWords) +
        (st.repeats.length ? '<div class="repeat-note">Уже изучали раньше (не повторяем): ' + st.repeats.map(function (r) { return esc(r.w.de) + " — зан. " + r.from.session; }).join(", ") + "</div>" : "") +
        (st.rule ? ruleBlock(st.rule) : "") + "</div>";
    });

    h += '<div class="part-head"><h2>Все новые слова занятия</h2></div><div class="card">' +
      (s.words.length ? wordTable("Занятие " + s.num + " · все слова", lessonLabel(s) + " · " + s.title, s.words, { label: "Слов за занятие" }) : '<span class="muted">На этом занятии новых слов нет — только повторение.</span>') + "</div>";

    h += '<div class="part-head"><h2>Домашнее задание</h2><button class="btn sm" data-copy-home="' + s.num + '">📋 Скопировать для учеников</button></div><div class="card"><ul class="hw-list">' +
      s.home.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>";

    h += '<div class="nav-foot">' + (s.num > 1 ? '<a class="btn" href="#/s/' + (s.num - 1) + '">← Занятие ' + (s.num - 1) + "</a>" : "<span></span>") +
      (s.num < SESSIONS.length ? '<a class="btn primary" href="#/s/' + (s.num + 1) + '">Занятие ' + (s.num + 1) + " →</a>" : "") + "</div>";
    return h;
  }

  var wordFilter = { q: "", mod: "all" };
  function filteredWords() {
    var q = wordFilter.q.toLowerCase();
    return ALL_WORDS.filter(function (w) {
      if (wordFilter.mod !== "all" && String(w.module) !== wordFilter.mod) return false;
      if (!q) return true;
      return (w.de + " " + w.ru + " " + w.tj).toLowerCase().indexOf(q) >= 0;
    });
  }
  function viewWords() {
    var list = filteredWords();
    return '<h1>Все слова курса</h1><p class="sub">Каждое слово один раз — там, где оно впервые появляется. Поиск работает по немецкому, русскому и таджикскому.</p>' +
      '<div class="meta"><input type="search" id="wq" placeholder="Поиск слова…" value="' + esc(wordFilter.q) + '">' +
      '<select id="wm"><option value="all">Все модули</option>' + [1, 2, 3, 4].map(function (m) { return '<option value="' + m + '" ' + (wordFilter.mod === String(m) ? "selected" : "") + ">Модуль " + m + "</option>"; }).join("") + "</select></div>" +
      '<div class="card" id="wlist">' + wordTable("Слова · " + (wordFilter.mod === "all" ? "весь курс" : "Модуль " + wordFilter.mod), "Menschen A1.1", list, { src: true, label: "Слов" }) + "</div>";
  }
  function viewRules() {
    var used = {};
    SESSIONS.forEach(function (s) { s.steps.forEach(function (st) { if (st.rule && !used[st.rule]) used[st.rule] = s.num; }); });
    return '<h1>Все правила</h1><p class="sub">Грамматика и произношение по порядку курса — на немецком и русском.</p>' +
      Object.keys(used).map(function (id) {
        return '<div class="card"><div class="muted" style="margin-bottom:4px"><a href="#/s/' + used[id] + '">Занятие ' + used[id] + "</a></div>" + ruleBlock(id) + "</div>";
      }).join("");
  }

  // ---------------------------------------------------------------- quiz
  var quiz = null;
  function openQuiz(words, title) {
    if (!words.length) return;
    var deck = words.slice().sort(function () { return Math.random() - 0.5; });
    quiz = { deck: deck, i: 0, shown: false, ok: 0, bad: [], title: title, dir: "to-de" };
    renderQuiz();
  }
  function renderQuiz() {
    var m = $("#modal"); if (!quiz) { m.innerHTML = ""; m.hidden = true; return; }
    m.hidden = false;
    var body;
    if (quiz.i >= quiz.deck.length) {
      body = '<h2>Результат: ' + quiz.ok + " из " + quiz.deck.length + "</h2>" +
        (quiz.bad.length ? '<p class="sub">Повторить:</p>' + wordTable("Повторить", quiz.title, quiz.bad, { quiz: false, label: "Ошибки" }) : '<p class="sub">Отлично — все слова знакомы! 🎉</p>') +
        '<div class="quiz-actions"><button class="btn" data-q="again">Ещё раз</button><button class="btn primary" data-q="close">Закрыть</button></div>';
    } else {
      var w = quiz.deck[quiz.i];
      var toDe = quiz.dir === "to-de";
      body = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>🎴 ' + esc(quiz.title) + '</b><button class="icon-btn" data-q="close" title="Закрыть">✕</button></div>' +
        '<div class="progress" style="margin-top:10px"><div style="width:' + (quiz.i / quiz.deck.length * 100) + '%"></div></div>' +
        '<div class="quiz-card"><div class="muted">' + (quiz.i + 1) + " / " + quiz.deck.length + "</div>" +
        (toDe ? '<div class="quiz-q">' + esc(w.ru) + '</div><div class="quiz-q2">' + esc(w.tj) + "</div>" : '<div class="quiz-q">' + colorArticle(w.de) + "</div>") +
        '<div class="quiz-a">' + (quiz.shown ? (toDe ? colorArticle(w.de) : esc(w.ru) + '<div class="quiz-q2">' + esc(w.tj) + "</div>") : "") + "</div></div>" +
        '<div class="quiz-actions">' +
        (quiz.shown ? '<button class="btn" data-say="' + esc(w.de) + '">🔊</button><button class="btn" data-q="bad">✗ Не знал</button><button class="btn primary" data-q="ok">✓ Знал</button>'
          : '<button class="btn" data-q="dir">⇄ ' + (toDe ? "RU→DE" : "DE→RU") + '</button><button class="btn primary" data-q="show">Показать ответ</button>') + "</div>";
    }
    m.innerHTML = '<div class="modal-box">' + body + "</div>";
  }
  function quizAction(a) {
    if (a === "close") { quiz = null; return renderQuiz(); }
    if (a === "again") { return openQuiz(quiz.deck, quiz.title); }
    if (a === "dir") { quiz.dir = quiz.dir === "to-de" ? "to-ru" : "to-de"; return renderQuiz(); }
    var w = quiz.deck[quiz.i];
    if (a === "show") { quiz.shown = true; speak(w.de); return renderQuiz(); }
    if (a === "ok") quiz.ok++;
    if (a === "bad") quiz.bad.push(w);
    quiz.i++; quiz.shown = false; renderQuiz();
  }

  // ---------------------------------------------------------------- timer
  var timer = { left: 0, total: 0, name: "", run: false, h: null };
  function beep() {
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(function (t) {
        var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.2, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.3);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.3);
      });
    } catch (e) { /* ignore */ }
  }
  function fmt(sec) { var m = Math.floor(Math.abs(sec) / 60), s = Math.abs(sec) % 60; return (sec < 0 ? "-" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function renderTimer() {
    var el = $("#timer"); if (!el) return;
    if (!timer.total) { el.innerHTML = '<span class="phase">Таймер</span><b>—:—</b>'; el.classList.remove("alarm"); return; }
    el.classList.toggle("alarm", timer.left <= 0);
    el.innerHTML = '<span class="phase">' + esc(timer.name) + "</span><b>" + fmt(timer.left) + "</b>" +
      '<button class="icon-btn" data-tm="toggle">' + (timer.run ? "⏸" : "▶") + '</button><button class="icon-btn" data-tm="stop">■</button>';
  }
  function startTimer(min, name) {
    clearInterval(timer.h);
    timer = { left: min * 60, total: min * 60, name: name, run: true, h: null };
    timer.h = setInterval(tick, 1000); renderTimer();
  }
  function tick() {
    if (!timer.run) return;
    timer.left--;
    if (timer.left === 0) { beep(); toast("Время: " + timer.name); }
    renderTimer();
  }

  // ---------------------------------------------------------------- render & events
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/");
    var active, html;
    tableSeq = 0; TABLES = {};
    if (parts[0] === "s") { active = parseInt(parts[1], 10) || 1; html = viewSession(active); }
    else if (parts[0] === "words") { active = "words"; html = viewWords(); }
    else if (parts[0] === "rules") { active = "rules"; html = viewRules(); }
    else { active = "home"; html = viewHome(); }
    $("#nav").innerHTML = sideNav(active);
    $("#content").innerHTML = html;
    document.body.classList.remove("nav-open");
    var on = $("#nav .nav a.on"); if (on) on.scrollIntoView({ block: "nearest" });
    window.scrollTo(0, 0);
  }

  function applyPrefs() {
    document.body.classList.toggle("big", !!prefs.big);
    $("#btn-slow").classList.toggle("on", !!prefs.slow);
    $("#btn-big").classList.toggle("on", !!prefs.big);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-say],[data-act],[data-q],[data-timer],[data-tm],[data-jump],[data-quiz-session],[data-copy-home],#btn-slow,#btn-big,#btn-menu,#btn-print");
    if (!t) { if (e.target.id === "modal") { quiz = null; renderQuiz(); } return; }
    if (t.dataset.say) return speak(t.dataset.say);
    if (t.dataset.act) return tableAction(t.dataset.act, t.closest("[data-table]").dataset.table);
    if (t.dataset.q) return quizAction(t.dataset.q);
    if (t.dataset.timer) return startTimer(parseInt(t.dataset.timer, 10), t.dataset.timerName);
    if (t.dataset.tm === "toggle") { timer.run = !timer.run; return renderTimer(); }
    if (t.dataset.tm === "stop") { clearInterval(timer.h); timer = { left: 0, total: 0, name: "", run: false }; return renderTimer(); }
    if (t.dataset.jump) { var el = document.getElementById(t.dataset.jump); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (t.dataset.quizSession) { var ps = SESSIONS[+t.dataset.quizSession - 1]; return openQuiz(ps.words, "Слова занятия " + ps.num); }
    if (t.dataset.copyHome) {
      var s = SESSIONS[+t.dataset.copyHome - 1];
      var txt = "Домашнее задание (занятие " + s.num + ", " + lessonLabel(s) + "):\n" + s.home.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n");
      navigator.clipboard.writeText(txt).then(function () { toast("Задание скопировано — вставьте в чат учеников"); }, function () { toast("Не удалось скопировать"); });
      return;
    }
    if (t.id === "btn-slow") { prefs.slow = !prefs.slow; save("prefs", prefs); applyPrefs(); toast(prefs.slow ? "Озвучка: медленно" : "Озвучка: обычная скорость"); return; }
    if (t.id === "btn-big") { prefs.big = !prefs.big; save("prefs", prefs); applyPrefs(); return; }
    if (t.id === "btn-menu") { document.body.classList.toggle("nav-open"); return; }
    if (t.id === "btn-print") { window.print(); return; }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.doneStep) {
      if (t.checked) done[t.dataset.doneStep] = 1; else delete done[t.dataset.doneStep];
      save("done", done);
      var card = document.getElementById(t.dataset.doneStep); if (card) card.classList.toggle("done", t.checked);
      var seg = document.querySelector('[data-jump="' + t.dataset.doneStep + '"]'); if (seg) seg.classList.toggle("done", t.checked);
    }
    if (t.dataset.doneSession) {
      if (t.checked) done["s" + t.dataset.doneSession] = 1; else delete done["s" + t.dataset.doneSession];
      save("done", done); $("#nav").innerHTML = sideNav(+t.dataset.doneSession);
    }
    if (t.id === "wm") { wordFilter.mod = t.value; rerenderWords(); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "wq") { wordFilter.q = e.target.value; rerenderWords(); }
  });
  function rerenderWords() {
    tableSeq = 0; TABLES = {};
    var list = filteredWords();
    $("#wlist").innerHTML = wordTable("Слова · " + (wordFilter.mod === "all" ? "весь курс" : "Модуль " + wordFilter.mod), "Menschen A1.1", list, { src: true, label: "Слов" }) || '<span class="muted">Ничего не найдено</span>';
  }
  document.addEventListener("keydown", function (e) {
    if (!quiz) return;
    if (e.key === "Escape") quizAction("close");
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); quizAction(quiz.shown ? "ok" : "show"); }
    else if (e.key === "ArrowLeft" && quiz.shown) quizAction("bad");
    else if (e.key === "ArrowRight" && quiz.shown) quizAction("ok");
  });

  build();
  window.addEventListener("hashchange", route);
  applyPrefs();
  renderTimer();
  route();
  window.__course = { SESSIONS: SESSIONS, ALL_WORDS: ALL_WORDS };
})();
