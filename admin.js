const O = PETAVU_ENV.origins;
const items = [
  { id: "home", href: "#/home", label: "خانه" },
  { id: "biz", href: "#/biz", label: "کسب‌وکارها" },
  { id: "publish", href: "#/publish", label: "انتشار" },
  { id: "members", href: "#/members", label: "اعضا" },
  { id: "out", href: "#/logout", label: "خروج", out: true },
];

async function render() {
  const path = location.hash.replace(/^#/, "") || "/";
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
    petavuChrome({
      items: [{ id: "out", href: "#/logout", label: "خروج", out: true }],
      active: "out",
      still: "assets/still-home.jpg",
      kicker: "خطا",
      title: "نشست",
      body: `<p class="err">${e.message || e}</p>`,
    });
    return;
  }
  if (!me || !["admin", "shop_admin"].includes(me.role)) {
    petavuChrome({
      items: [{ id: "out", href: "#/logout", label: "خروج", out: true }],
      active: "out",
      still: "assets/still-home.jpg",
      kicker: "دسترسی",
      title: "این حساب عضو است",
      body: `<p>برای کنترل پلتفرم با حساب مدیر وارد شوید.</p>`,
    });
    return;
  }
  const { data } = await petavuData.businesses.all();
  const list = data || [];
  if (path === "/biz") return viewBiz(list);
  if (path === "/publish") return viewPublish(list);
  if (path === "/members") return viewMembers();
  return viewHome(me, list);
}

function viewLogin(pre) {
  petavuGate({
    lock: true,
    image: "assets/login.jpg",
    kicker: "کنترل شبکه",
    title: "ورود مدیران",
    lead: "جدا از پنل اعضا. فقط با نشانی مستقیم.",
    captionTitle: "سامانهٔ کنترل پتاوو",
    caption: "انتشار و عضویت صنعت پت و اسب — فرمان در دست شما.",
    form: `<form id="f">
      <label>ایمیل</label>
      <input name="email" type="email" required dir="ltr" placeholder="admin@petavu.ir" autocomplete="username">
      <label>رمز عبور</label>
      <input name="password" type="password" required placeholder="رمز عبور" autocomplete="current-password">
      <button class="btn" type="submit">ورود</button>
      <p id="m" class="${pre ? "err" : "muted"}">${pre || ""}</p>
    </form>`,
    extra: `<p class="gate-extra"><a href="${O.website}">بازگشت به سایت</a></p>`,
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
    location.hash = "#/home";
    render();
  };
}

function viewHome(me, list) {
  const pending = list.filter((b) => !b.published).length;
  petavuChrome({
    items, active: "home", still: "assets/still-home.jpg",
    kicker: "کنترل شبکه",
    title: "ادارهٔ پتاوو",
    lead: "انتشار، کسب‌وکارها و اعضا از همین‌جا.",
    body: `<div class="grid">
      <article class="card"><h3>${list.length}</h3><p class="muted">کسب‌وکار ثبت‌شده</p></article>
      <article class="card"><h3>${pending}</h3><p class="muted">در انتظار انتشار</p></article>
    </div>`,
  });
}

function viewBiz(list) {
  const rows = list
    .map((b) => `<tr><td>${b.name}</td><td>${b.kind}</td><td>${b.city || ""}</td><td>${b.published ? "منتشر" : "پیش‌نویس"}</td></tr>`)
    .join("");
  petavuChrome({
    items, active: "biz", still: "assets/still-biz.jpg",
    kicker: "کسب‌وکارها",
    title: "صنف در شبکه",
    lead: "همهٔ واحدهایی که برای دیده شدن آمده‌اند.",
    body: `<table><thead><tr><th>نام</th><th>صنف</th><th>شهر</th><th>وضعیت</th></tr></thead><tbody>${rows || ""}</tbody></table>`,
  });
}

function viewPublish(list) {
  const rows = list
    .map(
      (b) => `<tr>
        <td>${b.name}</td><td>${b.city || ""}</td>
        <td>${b.published ? "منتشر" : "پیش‌نویس"}</td>
        <td><button class="btn" data-id="${b.id}" data-p="${b.published ? "0" : "1"}">${b.published ? "برداشتن" : "انتشار"}</button></td>
      </tr>`
    )
    .join("");
  petavuChrome({
    items, active: "publish", still: "assets/still-publish.jpg",
    kicker: "انتشار",
    title: "ویترین عمومی",
    lead: "آنچه تأیید شود روی سایت دیده می‌شود.",
    body: `<table><thead><tr><th>کسب‌وکار</th><th>شهر</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table>`,
  });
  document.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.onclick = async () => {
      await petavuData.businesses.setPublished(btn.dataset.id, btn.dataset.p === "1");
      render();
    };
  });
}

async function viewMembers() {
  let rows = `<p class="muted">فهرست اعضا در دسترس نیست.</p>`;
  try {
    const { data, error } = await petavuData.profile.all();
    if (!error && data) {
      rows = `<table><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th></tr></thead><tbody>${data
        .map((p) => `<tr><td>${p.display_name || "—"}</td><td dir="ltr">${p.email || ""}</td><td>${p.role}</td></tr>`)
        .join("")}</tbody></table>`;
    }
  } catch (e) {
    rows = `<p class="err">${e.message || e}</p>`;
  }
  petavuChrome({
    items, active: "members", still: "assets/still-members.jpg",
    kicker: "اعضا",
    title: "حساب‌های شبکه",
    lead: "ورود اعضا از پنل کاربری است؛ اینجا فقط دید مدیریت است.",
    body: rows,
  });
}

window.addEventListener("hashchange", render);
render();
