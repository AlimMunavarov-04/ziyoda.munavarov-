/* Упражнения на сайте: разметка → ячейки, проверка, книга PDF рядом с редактором.
   Разметка (вносит учитель):
     [ответ]             — ячейка для ввода; несколько верных ответов через «/»: [heißt/heisst]
     {вар1|*верный|вар3} — выбор из списка (* — правильный)
     Слова: a | b | c    — рамка со словами над упражнением
     левое = правое      — «соедините» (строки подряд — одна группа)
     # строка            — «расставьте по порядку» (пишем в правильном порядке)
     ## текст            — подзаголовок (a, b …)
*/
window.EX = (function () {
  "use strict";
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function norm(s) {
    return String(s).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[…?!.,;:'"«»]/g, "").replace(/\s+/g, " ").trim();
  }

  function parseInline(line) {
    var parts = [], re = /\[([^\]]+)\]|\{([^}]+)\}/g, last = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push({ t: "text", v: line.slice(last, m.index) });
      if (m[1] !== undefined) {
        parts.push({ t: "gap", a: m[1].split("/").map(function (x) { return x.trim(); }).filter(Boolean) });
      } else {
        var ok = null;
        var opts = m[2].split("|").map(function (o) {
          o = o.trim();
          if (o.charAt(0) === "*") { o = o.slice(1).trim(); ok = o; }
          return o;
        }).filter(Boolean);
        parts.push({ t: "choice", opts: opts, ok: ok === null ? opts[0] : ok });
      }
      last = re.lastIndex;
    }
    if (last < line.length) parts.push({ t: "text", v: line.slice(last) });
    return parts;
  }

  function parse(text) {
    var blocks = [], lines = String(text || "").replace(/\r/g, "").split("\n");
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, ""), prev = blocks[blocks.length - 1];
      var bank = line.match(/^\s*(Слова|Wörter|Рамка)\s*:\s*(.+)$/i);
      if (bank) { blocks.push({ type: "bank", words: bank[2].split("|").map(function (w) { return w.trim(); }).filter(Boolean) }); return; }
      if (/^\s*##\s+/.test(line)) { blocks.push({ type: "h", v: line.replace(/^\s*##\s+/, "") }); return; }
      if (/^\s*#\s+/.test(line)) {
        var it = line.replace(/^\s*#\s+/, "");
        if (prev && prev.type === "order") prev.items.push(it); else blocks.push({ type: "order", items: [it] });
        return;
      }
      var mm = line.match(/^(.+?)\s+=\s+(.+)$/);
      if (mm && line.indexOf("[") < 0 && line.indexOf("{") < 0) {
        var pair = [mm[1].trim(), mm[2].trim()];
        if (prev && prev.type === "match") prev.pairs.push(pair); else blocks.push({ type: "match", pairs: [pair] });
        return;
      }
      if (!line.trim()) { if (prev && prev.type !== "br") blocks.push({ type: "br" }); return; }
      blocks.push({ type: "line", parts: parseInline(line) });
    });
    return blocks;
  }

  function countItems(blocks) {
    var n = 0;
    blocks.forEach(function (b) {
      if (b.type === "line") b.parts.forEach(function (p) { if (p.t !== "text") n++; });
      if (b.type === "order") n += b.items.length;
      if (b.type === "match") n += b.pairs.length;
    });
    return n;
  }

  function opt(v, label) { return '<option value="' + esc(v) + '">' + esc(label === undefined ? v : label) + "</option>"; }

  function render(text, key, opts) {
    opts = opts || {};
    if (!String(text || "").trim()) return "";
    var blocks = parse(text), total = countItems(blocks);
    var h = '<div class="ex" data-ex="' + esc(key) + '" data-total="' + total + '">';
    blocks.forEach(function (b) {
      if (b.type === "bank") h += '<div class="ex-bank">' + b.words.map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + "</div>";
      else if (b.type === "h") h += '<div class="ex-h">' + esc(b.v) + "</div>";
      else if (b.type === "br") h += '<div class="ex-br"></div>';
      else if (b.type === "line") {
        h += '<div class="ex-line">' + b.parts.map(function (p) {
          if (p.t === "text") return esc(p.v);
          if (p.t === "gap") {
            var w = Math.max.apply(null, p.a.map(function (x) { return x.length; }));
            return '<input class="ex-gap" data-a="' + esc(p.a.join("||")) + '" style="width:' + (Math.max(w, 3) + 3) + 'ch" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Ответ">';
          }
          return '<select class="ex-sel" data-a="' + esc(p.ok) + '" aria-label="Выбор">' + opt("", "…") + p.opts.map(function (o) { return opt(o); }).join("") + "</select>";
        }).join("") + "</div>";
      } else if (b.type === "match") {
        var rights = shuffle(b.pairs.map(function (p) { return p[1]; }));
        h += '<div class="ex-match">' + b.pairs.map(function (p) {
          return '<div class="ex-row"><span class="ex-left">' + esc(p[0]) + '</span><span class="ex-arrow">→</span><select class="ex-sel" data-a="' + esc(p[1]) + '" aria-label="Пара">' +
            opt("", "…") + rights.map(function (r) { return opt(r); }).join("") + "</select></div>";
        }).join("") + "</div>";
      } else if (b.type === "order") {
        var idx = shuffle(b.items.map(function (_, i) { return i; }));
        h += '<div class="ex-order">' + idx.map(function (i) {
          return '<div class="ex-row"><select class="ex-sel ex-num" data-a="' + (i + 1) + '" aria-label="Номер">' + opt("", "№") +
            b.items.map(function (_, k) { return opt(String(k + 1)); }).join("") + '</select><span>' + esc(b.items[i]) + "</span></div>";
        }).join("") + "</div>";
      }
    });
    if (total) {
      h += '<div class="ex-actions"><button type="button" class="btn sm primary" data-ex-check="1">Проверить</button>' +
        '<button type="button" class="btn sm" data-ex-reset="1">Очистить</button>' +
        '<button type="button" class="btn sm" data-ex-show="1"' + (opts.student ? " hidden" : "") + '>Показать ответы</button>' +
        '<span class="ex-score" aria-live="polite">' + (opts.last ? "Прошлый результат: " + opts.last.c + " из " + opts.last.t : "") + "</span></div>";
    }
    return h + "</div>";
  }

  function fields(box) { return Array.prototype.slice.call(box.querySelectorAll("[data-a]")); }
  function isRight(el) {
    var v = el.value;
    if (el.tagName === "SELECT") return v !== "" && v === el.dataset.a;
    return v.trim() !== "" && el.dataset.a.split("||").some(function (a) { return norm(a) === norm(v); });
  }
  function check(box) {
    var f = fields(box), ok = 0;
    f.forEach(function (el) { var r = isRight(el); if (r) ok++; el.classList.toggle("ok", r); el.classList.toggle("bad", !r); });
    var sc = box.querySelector(".ex-score");
    if (sc) sc.textContent = "Верно: " + ok + " из " + f.length + (ok === f.length ? " 🎉" : "");
    var sh = box.querySelector("[data-ex-show]"); if (sh) sh.hidden = false;
    return { total: f.length, correct: ok };
  }
  function show(box) {
    fields(box).forEach(function (el) {
      el.value = el.tagName === "SELECT" ? el.dataset.a : el.dataset.a.split("||")[0];
      el.classList.add("ok"); el.classList.remove("bad");
    });
  }
  function reset(box) {
    fields(box).forEach(function (el) { el.value = ""; el.classList.remove("ok", "bad"); });
    var sc = box.querySelector(".ex-score"); if (sc) sc.textContent = "";
  }

  // ---------------------------------------------------------------- книга PDF: только в этом браузере, на сервер не уходит
  var DB = "menschen-book", bookUrl = null;
  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      try {
        var rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore("files"); };
        rq.onerror = function () { rej(rq.error); };
        rq.onsuccess = function () {
          try {
            var tx = rq.result.transaction("files", mode), r = fn(tx.objectStore("files"));
            tx.oncomplete = function () { res(r && r.result); };
            tx.onerror = function () { rej(tx.error); };
          } catch (e) { rej(e); }
        };
      } catch (e) { rej(e); }
    });
  }
  function getBook() {
    if (bookUrl) return Promise.resolve(bookUrl);
    return idb("readonly", function (st) { return st.get("book"); }).then(function (blob) {
      if (blob) bookUrl = URL.createObjectURL(blob);
      return bookUrl;
    }).catch(function () { return null; });
  }
  function setBook(file) {
    if (bookUrl) URL.revokeObjectURL(bookUrl);
    bookUrl = URL.createObjectURL(file);
    return idb("readwrite", function (st) { return st.put(file, "book"); })
      .catch(function () { /* не сохранилось — книга работает до перезагрузки страницы */ })
      .then(function () { return bookUrl; });
  }
  function forgetBook() {
    if (bookUrl) URL.revokeObjectURL(bookUrl);
    bookUrl = null;
    return idb("readwrite", function (st) { return st.delete("book"); }).catch(function () { /* ignore */ });
  }
  function offset() { try { var v = parseInt(localStorage.getItem("menschen.bookOffset"), 10); return isNaN(v) ? 1 : v; } catch (e) { return 1; } }
  function setOffset(v) { try { localStorage.setItem("menschen.bookOffset", String(v)); } catch (e) { /* ignore */ } }
  function bookPage(ref) { var m = String(ref).match(/S\.\s*(\d+)/); return m ? +m[1] : 1; }

  return {
    parse: parse, render: render, check: check, show: show, reset: reset, countItems: countItems,
    getBook: getBook, setBook: setBook, forgetBook: forgetBook, offset: offset, setOffset: setOffset, bookPage: bookPage
  };
})();
