(function () {
  "use strict";
  var form = document.getElementById("login-form");
  var err = document.getElementById("err");
  var btn = document.getElementById("submit");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.hidden = true;
    btn.disabled = true;
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ login: form.login.value.trim(), password: form.password.value })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
    }).then(function (res) {
      if (res.ok) { location.replace("/"); return; }
      err.textContent = res.d.error || "Не удалось войти";
      err.hidden = false;
      btn.disabled = false;
    }).catch(function () {
      err.textContent = "Нет связи с сервером";
      err.hidden = false;
      btn.disabled = false;
    });
  });
})();
