async function render() {
  const path = location.hash.replace("#", "") || "/";
  if (path === "/logout") {
    await petavuData.auth.signOut();
    location.hash = "#/login";
    return;
  }
  const user = await petavuData.auth.user();
  if (!user || path === "/login") return viewLogin();
  const me = await petavuData.profile.me();
  if (!me || !["admin", "shop_admin"].includes(me.role)) {
    petavuShell("دسترسی نیست", `<a href="#/logout">خروج</a>`, `<p>این سطح فقط برای مدیر پلتفرم است.</p>`);
    return;
  }
  const { data } = await petavuData.businesses.all();
  const rows = (data || [])
    .map(
      (b) => `<tr>
        <td>${b.name}</td><td>${b.city || ""}</td>
        <td>${b.published ? "منتشر" : "پیش‌نویس"}</td>
        <td><button class="btn ghost" data-id="${b.id}" data-p="${b.published ? "0" : "1"}">${b.published ? "برداشتن" : "انتشار"}</button></td>
      </tr>`
    )
    .join("");
  petavuShell(
    "کنترل پلتفرم",
    `<a href="#/logout">خروج</a>`,
    `<p class="muted">نسخهٔ ۱: انتشار پروفایل. moderation کامل در نسخهٔ بعد.</p>
     <table><thead><tr><th>کسب‌وکار</th><th>شهر</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
  );
  document.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.onclick = async () => {
      await petavuData.businesses.setPublished(btn.dataset.id, btn.dataset.p === "1");
      render();
    };
  });
}
function viewLogin() {
  petavuShell(
    "ورود مدیر",
    `<a href="${PETAVU_ENV.origins.website}">سایت</a>`,
    `<form id="f">
      <input name="email" type="email" required dir="ltr" placeholder="ایمیل">
      <input name="password" type="password" required placeholder="رمز">
      <button class="btn">ورود</button><p id="m"></p>
    </form>`
  );
  qs("#f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await petavuData.auth.signIn(String(fd.get("email")), String(fd.get("password")));
    if (error) qs("#m").innerHTML = `<span class="err">${error.message}</span>`;
    else {
      location.hash = "#/";
      render();
    }
  };
}
window.addEventListener("hashchange", render);
render();
