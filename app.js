const { createClient } = supabase;
const db = createClient(PETAVU.supabaseUrl, PETAVU.supabaseAnonKey);

const KINDS = {
  clinic: "کلینیک",
  petshop: "پت‌شاپ",
  stable: "باشگاه سوارکاری",
  vet: "دامپزشک",
  school: "آموزشگاه",
};

function surface() {
  const h = location.hostname;
  if (h.startsWith("panel.")) return "panel";
  if (h.startsWith("adminpanel.")) return "admin";
  if (h.startsWith("adminshop.")) return "adminshop";
  if (h.startsWith("shop.")) return "shop";
  return "public";
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function html(strings, ...vals) {
  return strings.reduce((a, s, i) => a + s + (vals[i] ?? ""), "");
}

function route() {
  const raw = (location.hash.replace(/^#/, "") || "/").split("?")[0];
  return raw.startsWith("/") ? raw : "/" + raw;
}

async function sessionUser() {
  const { data } = await db.auth.getUser();
  return data.user || null;
}

async function profile() {
  const user = await sessionUser();
  if (!user) return null;
  const { data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
}

function money(n) {
  return new Intl.NumberFormat("fa-IR").format(n) + " ریال";
}

function nav(surf, user) {
  const common = `<a href="#/">خانه</a>`;
  if (surf === "public") {
    return `${common}<a href="#/businesses">کسب‌وکارها</a><a href="https://panel.petavu.ir/#/login">ورود پنل</a><a href="https://shop.petavu.ir/#/">فروشگاه</a>`;
  }
  if (surf === "shop") {
    return `${common}<a href="#/">کاتالوگ</a><a href="https://petavu.ir/">سایت</a>`;
  }
  if (surf === "panel") {
    return user
      ? `${common}<a href="#/app">میز کار</a><a href="#/logout">خروج</a>`
      : `${common}<a href="#/login">ورود</a><a href="#/signup">ثبت‌نام</a>`;
  }
  if (surf === "admin" || surf === "adminshop") {
    return user
      ? `${common}<a href="#/app">مدیریت</a><a href="#/logout">خروج</a>`
      : `${common}<a href="#/login">ورود</a>`;
  }
  return common;
}

function shell(surf, title, body, user) {
  const labels = {
    public: "سایت عمومی",
    panel: "پنل اعضا",
    admin: "پنل مدیریت",
    shop: "فروشگاه B2B",
    adminshop: "مدیریت فروشگاه",
  };
  $("#app").innerHTML = html`
    <header>
      <div>
        <div class="brand">PETAVU</div>
        <span class="pill">${labels[surf]}</span>
      </div>
      <nav>${nav(surf, user)}</nav>
    </header>
    <main>
      <h1>${title}</h1>
      ${body}
    </main>
    <footer>پتاوو — ${location.hostname}</footer>
  `;
}

async function viewPublicHome() {
  const { data: businesses } = await db.from("businesses").select("*").eq("published", true).order("created_at", { ascending: false });
  const cards = (businesses || [])
    .map(
      (b) => html`<a class="card" href="#/b/${b.slug}">
        <h3>${b.name}</h3>
        <div class="muted">${KINDS[b.kind] || b.kind} · ${b.city || ""}</div>
        <p class="muted">${b.description || ""}</p>
      </a>`
    )
    .join("");
  shell(
    "public",
    "شبکهٔ کسب‌وکار پت و اسب",
    html`<p class="lead">کلینیک، پت‌شاپ، دامپزشک و باشگاه سوارکاری روی یک زیرساخت. این نسخه روی GitHub Pages و Supabase اجرا می‌شود.</p>
    <div class="grid">${cards || "<p class='muted'>هنوز کسب‌وکار منتشرشده‌ای نیست.</p>"}</div>`,
    null
  );
}

async function viewBusinesses() {
  const { data } = await db.from("businesses").select("*").eq("published", true);
  const cards = (data || [])
    .map((b) => html`<a class="card" href="#/b/${b.slug}"><h3>${b.name}</h3><div class="muted">${b.city || ""}</div></a>`)
    .join("");
  shell("public", "کسب‌وکارها", `<div class="grid">${cards}</div>`, null);
}

async function viewBusiness(slug) {
  const { data: b } = await db.from("businesses").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!b) {
    shell("public", "یافت نشد", "<p>این صفحه منتشر نشده است.</p>", null);
    return;
  }
  const { data: products } = await db.from("products").select("*").eq("business_id", b.id).eq("published", true);
  const list = (products || [])
    .map((p) => html`<div class="card"><h3>${p.name}</h3><div class="muted">${money(p.price_irr)}</div></div>`)
    .join("");
  shell(
    "public",
    b.name,
    html`<p class="lead">${b.description || ""}</p><p class="muted">${KINDS[b.kind] || ""} · ${b.city || ""}</p>
    <div class="grid">${list || "<p class='muted'>کالایی نیست.</p>"}</div>`,
    null
  );
}

function authForm(mode) {
  return html`<form id="auth-form">
    <input name="email" type="email" required placeholder="ایمیل" dir="ltr">
    <input name="password" type="password" required minlength="6" placeholder="رمز">
    <button type="submit">${mode === "signup" ? "ثبت‌نام" : "ورود"}</button>
    <p id="auth-msg" class="muted"></p>
  </form>`;
}

async function viewLogin(surf) {
  const user = await sessionUser();
  if (user) {
    location.hash = "#/app";
    return;
  }
  shell(surf, "ورود", authForm("login"), null);
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await db.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    $("#auth-msg").textContent = error ? error.message : "وارد شدید.";
    $("#auth-msg").className = error ? "err" : "ok";
    if (!error) location.hash = "#/app";
  };
}

async function viewSignup(surf) {
  shell(surf, "ثبت‌نام", authForm("signup"), null);
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await db.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    $("#auth-msg").textContent = error ? error.message : "حساب ساخته شد. وارد شوید.";
    $("#auth-msg").className = error ? "err" : "ok";
    if (!error) location.hash = "#/login";
  };
}

async function viewPanelApp() {
  const user = await sessionUser();
  if (!user) {
    location.hash = "#/login";
    return;
  }
  const me = await profile();
  const { data: mine } = await db.from("businesses").select("*").eq("owner_id", user.id);
  const cards = (mine || [])
    .map(
      (b) =>
        html`<div class="card"><h3>${b.name}</h3><div class="muted">${b.published ? "منتشر شده" : "پیش‌نویس"} · ${b.slug}</div></div>`
    )
    .join("");
  shell(
    "panel",
    "میز کار",
    html`<p class="muted">${me?.display_name || user.email}</p>
    <form id="biz-form">
      <input name="name" required placeholder="نام کسب‌وکار">
      <input name="slug" required placeholder="نامک انگلیسی مثل mehrpet" dir="ltr">
      <select name="kind">
        <option value="clinic">کلینیک</option>
        <option value="petshop">پت‌شاپ</option>
        <option value="stable">باشگاه</option>
        <option value="vet">دامپزشک</option>
      </select>
      <input name="city" placeholder="شهر">
      <textarea name="description" placeholder="معرفی"></textarea>
      <button>ثبت کسب‌وکار</button>
      <p id="biz-msg" class="muted"></p>
    </form>
    <div class="grid">${cards}</div>`,
    user
  );
  $("#biz-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await db.from("businesses").insert({
      owner_id: user.id,
      name: String(fd.get("name")),
      slug: String(fd.get("slug")).toLowerCase(),
      kind: String(fd.get("kind")),
      city: String(fd.get("city") || ""),
      description: String(fd.get("description") || ""),
      published: false,
    });
    $("#biz-msg").textContent = error ? error.message : "ثبت شد. پس از تأیید مدیر منتشر می‌شود.";
    $("#biz-msg").className = error ? "err" : "ok";
    if (!error) render();
  };
}

async function viewAdmin() {
  const user = await sessionUser();
  const me = user ? await profile() : null;
  if (!user) {
    location.hash = "#/login";
    return;
  }
  if (!me || !["admin", "shop_admin"].includes(me.role)) {
    shell("admin", "دسترسی نیست", "<p>این سطح فقط برای مدیر است.</p>", user);
    return;
  }
  const { data: all } = await db.from("businesses").select("*").order("created_at", { ascending: false });
  const rows = (all || [])
    .map(
      (b) => html`<tr>
        <td>${b.name}</td>
        <td>${b.city || ""}</td>
        <td>${b.published ? "بله" : "خیر"}</td>
        <td><button data-id="${b.id}" data-pub="${b.published ? "0" : "1"}">${b.published ? "عدم انتشار" : "انتشار"}</button></td>
      </tr>`
    )
    .join("");
  shell(
    "admin",
    "مدیریت کسب‌وکارها",
    html`<table><thead><tr><th>نام</th><th>شهر</th><th>انتشار</th><th></th></tr></thead><tbody>${rows}</tbody></table>`,
    user
  );
  document.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.onclick = async () => {
      await db.from("businesses").update({ published: btn.dataset.pub === "1" }).eq("id", btn.dataset.id);
      render();
    };
  });
}

async function viewShop() {
  const { data } = await db
    .from("products")
    .select("id,name,price_irr,businesses(name,slug)")
    .eq("published", true);
  const cards = (data || [])
    .map(
      (p) =>
        html`<div class="card"><h3>${p.name}</h3><div class="muted">${p.businesses?.name || ""}</div><div>${money(p.price_irr)}</div></div>`
    )
    .join("");
  shell("shop", "فروشگاه B2B", `<div class="grid">${cards || "<p class='muted'>کالایی نیست.</p>"}</div>`, null);
}

async function viewAdminShop() {
  const user = await sessionUser();
  const me = user ? await profile() : null;
  if (!user) {
    location.hash = "#/login";
    return;
  }
  if (!me || !["admin", "shop_admin"].includes(me.role)) {
    shell("adminshop", "دسترسی نیست", "<p>فقط مدیر فروشگاه.</p>", user);
    return;
  }
  const { data } = await db.from("products").select("id,name,price_irr,published,businesses(name)");
  const rows = (data || [])
    .map(
      (p) =>
        html`<tr><td>${p.name}</td><td>${p.businesses?.name || ""}</td><td>${money(p.price_irr)}</td><td>${p.published ? "بله" : "خیر"}</td></tr>`
    )
    .join("");
  shell("adminshop", "کاتالوگ", `<table><thead><tr><th>کالا</th><th>کسب‌وکار</th><th>قیمت</th><th>انتشار</th></tr></thead><tbody>${rows}</tbody></table>`, user);
}

async function render() {
  const surf = surface();
  const path = route();
  if (path === "/logout") {
    await db.auth.signOut();
    location.hash = "#/login";
    return;
  }
  try {
    if (surf === "public") {
      if (path.startsWith("/b/")) return viewBusiness(path.slice(3));
      if (path === "/businesses") return viewBusinesses();
      return viewPublicHome();
    }
    if (surf === "shop") return viewShop();
    if (surf === "panel") {
      if (path === "/signup") return viewSignup("panel");
      if (path === "/login") return viewLogin("panel");
      if (path === "/app" || path === "/") return viewPanelApp();
      return viewPanelApp();
    }
    if (surf === "admin") {
      if (path === "/login") return viewLogin("admin");
      return viewAdmin();
    }
    if (surf === "adminshop") {
      if (path === "/login") return viewLogin("adminshop");
      return viewAdminShop();
    }
  } catch (err) {
    $("#app").innerHTML = `<main><h1>خطا</h1><p class="err">${err.message}</p></main>`;
  }
}

window.addEventListener("hashchange", render);
render();
