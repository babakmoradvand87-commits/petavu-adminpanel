async function render() {
  const path = (location.hash.replace(/^#/, "") || "/");
  if (path === "/logout") {
    await petavuData.auth.signOut();
    location.hash = "#/login";
    return;
  }
  let user = null;
  try {
    user = await petavuData.auth.user();
  } catch (e) {
    viewLogin("خواندن نشست ناموفق بود. دوباره وارد شوید.");
    return;
  }
  if (!user || path === "/login") return viewLogin();
  let me = null;
  try {
    me = await petavuData.profile.me();
  } catch (e) {
    petavuShell("خطا", `<a href="#/logout">خروج</a>`, `<p class="err">${e.message || e}</p>`);
    return;
  }
  if (!me || !["admin", "shop_admin"].includes(me.role)) {
    petavuShell(
      "دسترسی نیست",
      `<a href="#/logout">خروج</a>`,
      `<p>این حساب عضو است، نه مدیر. برای کنترل پلتفرم با <b dir="ltr">admin@petavu.ir</b> وارد شوید.</p>`
    );
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
function viewLogin(pre) {
  petavuGate({
    lock: true,
    image: "assets/login.jpg",
    kicker: "دروازهٔ کنترل پلتفرم",
    title: "احراز هویت سطح مدیریت",
    lead: "این صفحه در هیچ منوی عمومی لینک نشده و فقط با نشانی مستقیم در دسترس است. مسیر امن — جدا از ورود اعضای شبکه.",
    captionTitle: "سامانهٔ کنترل یکپارچهٔ پتاوو",
    caption: "انتشار، عضویت و امنیت صنعت پت و اسب — برای هر بخش جداگانه، فرمان در دست شما.",
    form: `<form id="f">
      <label>نام کاربری</label>
      <input name="email" type="email" required dir="ltr" placeholder="admin@petavu.ir" autocomplete="username">
      <label>رمز عبور</label>
      <input name="password" type="password" required placeholder="رمز عبور" autocomplete="current-password">
      <button class="btn" type="submit">تأیید هویت و ورود</button>
      <p id="m" class="${pre ? "err" : "muted"}">${pre || ""}</p>
    </form>`,
    extra: `<p class="gate-extra"><a href="${PETAVU_ENV.origins.website}">بازگشت به سایت</a></p>`,
  });
  qs("#f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    qs("#m").textContent = "در حال ورود…";
    const { data, error } = await petavuData.auth.signIn(String(fd.get("email")).trim(), String(fd.get("password")));
    if (error || !data?.session) {
      btn.disabled = false;
      qs("#m").className = "err";
      qs("#m").textContent = error?.message || "ورود انجام نشد.";
      return;
    }
    location.hash = "#/app";
    render();
  };
}
window.addEventListener("hashchange", render);
render();
