window.petavuGate = function petavuGate(opts) {
  document.body.classList.add("is-gate");
  document.body.classList.remove("is-app");
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
        <img src="${opts.image}" alt="">
        <figcaption>
          <strong>${opts.captionTitle}</strong>
          <span>${opts.caption}</span>
        </figcaption>
      </figure>
    </section>`;
};

window.petavuChrome = function petavuChrome(opts) {
  document.body.classList.remove("is-gate");
  document.body.classList.add("is-app");
  const items = (opts.items || [])
    .map((i) => `<a class="${i.id === opts.active ? "on" : ""} ${i.out ? "out" : ""}" href="${i.href}">${i.label}</a>`)
    .join("");
  document.getElementById("app").innerHTML = `
    <div class="shell">
      <aside class="side">
        <div class="side-brand">پتاوو <span>|</span> PETAVU</div>
        <nav>${items}</nav>
      </aside>
      <div class="main">
        <header class="page-hero">
          <img src="${opts.still}" alt="">
          <div class="page-hero-copy">
            <p class="k">${opts.kicker || ""}</p>
            <h1>${opts.title}</h1>
            ${opts.lead ? `<p class="lead">${opts.lead}</p>` : ""}
          </div>
        </header>
        <section class="page-body">${opts.body}</section>
      </div>
    </div>`;
};

window.petavuShell = function petavuShell(title, navHtml, body) {
  petavuChrome({
    items: [{ id: "x", href: "#/home", label: "خانه" }],
    active: "x",
    still: "assets/still-home.jpg",
    kicker: "پتاوو",
    title,
    body: `${navHtml}${body}`,
  });
};
window.money = (n) => new Intl.NumberFormat("fa-IR").format(n) + " ریال";
window.qs = (s, r = document) => r.querySelector(s);
