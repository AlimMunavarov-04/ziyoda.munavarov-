// Каркас данных курса. Каждый модуль (m1.js … m4.js) добавляет уроки через L(...).
// Слово: "немецкий|русский|таджикский". Повторы убираются автоматически в app.js:
// если слово уже было в одном из прошлых заданий, в новом задании оно не показывается.
window.COURSE = [];
// S(минуты, ссылка на книгу, тип, что делаем, как вести, [слова], id правила)
window.S = function (min, ref, type, task, how, words, rule) {
  return { min: min, ref: ref, type: type, task: task, how: how || "", words: words || [], rule: rule || null };
};
// L(номер урока книги или "M1", название, перевод, модуль, [занятия])
window.L = function (lesson, title, ru, module, sessions) {
  window.COURSE.push({ lesson: lesson, title: title, ru: ru, module: module, sessions: sessions });
};
