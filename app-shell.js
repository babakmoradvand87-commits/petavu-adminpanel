window.petavuShell = function petavuShell(title, navHtml, body) {
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
