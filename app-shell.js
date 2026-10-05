window.petavuGate = function petavuGate(opts) {
  document.body.classList.add("is-gate");
  const lock = opts.lock
    ? `<span class="gate-lock" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/></svg></span>`
    : "";
  document.getElementById("app").innerHTML = `
    <section class="gate">
      <aside class="gate-form">
        <div class="gate-form-inner">
          <b class="gate-mark">PETAVU</b>
          <p class="gate-k">${lock}${opts.kicker}</p>
          <h1>${opts.title}</h1>
          <p class="gate-lead">${opts.lead}</p>
          ${opts.form}
          ${opts.extra || ""}
        </div>
      </aside>
      <figure class="gate-visual">
        <img src="${opts.image}" alt="" width="1920" height="1080">
        <figcaption>
          <strong>${opts.captionTitle}</strong>
          <span>${opts.caption}</span>
        </figcaption>
      </figure>
    </section>`;
};

window.petavuShell = function petavuShell(title, navHtml, body) {
  document.body.classList.remove("is-gate");
  document.getElementById("app").innerHTML = `
    <header class="top"><div class="wrap top-inner">
      <div class="mark">PETAVU</div>
      <nav class="nav">${navHtml}</nav>
    </div></header>
    <main class="wrap" style="padding:48px 0 80px">
      <p class="eyebrow">نسخهٔ ۱</p>
      <h1 class="display" style="font-size:clamp(1.6rem,4vw,2.4rem)">${title}</h1>
      ${body}
    </main>
    <footer class="footer"><div class="wrap">${location.hostname}</div></footer>`;
};
window.money = (n) => new Intl.NumberFormat("fa-IR").format(n) + " ریال";
window.qs = (s, r = document) => r.querySelector(s);
