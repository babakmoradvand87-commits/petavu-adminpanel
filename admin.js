const O = PETAVU_ENV.origins;
const items = [
  { id: "home", href: "#/home", label: "خانه" },
  { id: "biz", href: "#/biz", label: "کسب‌وکارها" },
  { id: "publish", href: "#/publish", label: "انتشار" },
  { id: "members", href: "#/members", label: "اعضا" },
  { id: "sms", href: "#/sms", label: "پیامک" },
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
  if (path === "/members-new") return viewMemberForm(null);
  const ed = path.match(/^\/members-edit\/(.+)$/);
  if (ed) return viewMemberForm(ed[1]);
  if (path === "/members") return viewMembers();
  if (path === "/sms-new") return viewSmsForm(null);
  const se = path.match(/^\/sms-edit\/(.+)$/);
  if (se) return viewSmsForm(se[1]);
  if (path === "/sms-routes") return viewSmsRoutes();
  if (path === "/sms") return viewSms();
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

async function saveIdentity(id, row) {
  const full = { id, ...row };
  let { error } = await petavuData.profile.upsert(full);
  if (error && /schema cache|column/i.test(error.message || "")) {
    const { error: e2 } = await petavuData.profile.upsert({
      id,
      display_name: row.display_name,
      email: row.email,
      role: row.role,
    });
    return e2 || new Error("ستون هویت روی دیتابیس نیست. مهاجرت 0002 باید اجرا شود.");
  }
  return error;
}

function genPass() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(12));
  let s = "Pv";
  for (const x of b) s += a[x % a.length];
  return s;
}
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadMemberRows() {
  const [{ data: people, error }, { data: biz }] = await Promise.all([
    petavuData.profile.all(),
    petavuData.businesses.all(),
  ]);
  if (error) throw error;
  const byOwner = {};
  (biz || []).forEach((b) => {
    (byOwner[b.owner_id] ||= []).push(b);
  });
  return (people || []).map((p) => ({
    ...p,
    company: p.company_name || (byOwner[p.id] || []).map((b) => b.name).join("، "),
  }));
}

async function viewMembers() {
  let all = [];
  let err = "";
  try {
    all = await loadMemberRows();
  } catch (e) {
    err = e.message || String(e);
  }
  const body = err
    ? `<p class="err">${esc(err)}</p>`
    : `<div class="toolbar">
        <input type="search" id="q" placeholder="جستجو: نام، شرکت، فروشگاه، گروه، موبایل">
        <a class="btn" href="#/members-new">عضو جدید</a>
      </div>
      <p class="muted">ورود فعلی با ایمیل و رمز است. موبایل برای فعال‌سازی بعدی پیامک ذخیره می‌شود.</p>
      <table>
        <thead><tr><th>نام</th><th>شرکت / فروشگاه</th><th>گروه</th><th>موبایل</th><th>کاربری</th><th></th></tr></thead>
        <tbody id="tb">${memberRows(all)}</tbody>
      </table>`;
  petavuChrome({
    items, active: "members", still: "assets/still-members.jpg",
    kicker: "اعضا",
    title: "دفتر هویت شبکه",
    lead: "ساخت عضو با هویت کامل. رمز پیش‌فرض را عضو در اولین ورود عوض می‌کند.",
    body,
  });
  const q = qs("#q");
  const tb = qs("#tb");
  if (q && tb) {
    q.oninput = () => {
      const s = q.value.trim();
      tb.innerHTML = memberRows(all, s);
    };
  }
}

function memberRows(all, s) {
  const q = (s || "").toLowerCase();
  const rows = all.filter((p) => {
    if (!q) return true;
    const blob = [p.display_name, p.company, p.group_name, p.phone, p.username, p.email].join(" ").toLowerCase();
    return blob.includes(q);
  });
  if (!rows.length) return `<tr><td colspan="6" class="muted">موردی نیست.</td></tr>`;
  return rows
    .map(
      (p) => `<tr>
        <td>${esc(p.display_name || "—")} ${p.must_change_password ? '<span class="badge">رمز اولیه</span>' : ""}</td>
        <td>${esc(p.company || "—")}</td>
        <td>${esc(p.group_name || "—")}</td>
        <td dir="ltr">${esc(p.phone || "—")}</td>
        <td dir="ltr">${esc(p.username || p.email || "")}</td>
        <td><a class="btn" href="#/members-edit/${p.id}">ویرایش</a></td>
      </tr>`
    )
    .join("");
}

async function viewMemberForm(id) {
  let p = {
    display_name: "",
    national_id: "",
    phone: "",
    email: "",
    company_name: "",
    group_name: "",
    username: "",
    role: "member",
  };
  if (id) {
    const { data } = await petavuData.profile.all();
    p = (data || []).find((x) => x.id === id) || p;
  }
  const creating = !id;
  petavuChrome({
    items, active: "members", still: "assets/still-members.jpg",
    kicker: creating ? "عضو جدید" : "ویرایش عضو",
    title: creating ? "ثبت هویت و دسترسی" : p.display_name || "ویرایش",
    lead: "هویت اجباری است. کاربری و رمز ساخته می‌شوند. بعداً ورود با موبایل و پیامک روی همین پرونده فعال می‌شود.",
    body: `<form class="stack" id="mf" style="max-width:640px">
      <p class="sec">هویت</p>
      <div class="row-2">
        <input name="display_name" required placeholder="نام و نام خانوادگی" value="${esc(p.display_name)}">
        <input name="national_id" required placeholder="کد ملی" value="${esc(p.national_id)}">
      </div>
      <div class="row-2">
        <input name="phone" required placeholder="موبایل — کلید ورود پیامک" dir="ltr" value="${esc(p.phone)}">
        <input name="email" type="email" required placeholder="ایمیل ورود فعلی" dir="ltr" value="${esc(p.email)}">
      </div>
      <p class="sec">سازمان</p>
      <div class="row-2">
        <input name="company_name" placeholder="نام شرکت / فروشگاه" value="${esc(p.company_name)}">
        <input name="group_name" placeholder="نام گروه" value="${esc(p.group_name)}">
      </div>
      <p class="sec">دسترسی</p>
      <div class="gen">
        <input name="username" required placeholder="نام کاربری" dir="ltr" value="${esc(p.username)}">
        <button type="button" class="btn" id="u">ساخت کاربری</button>
      </div>
      ${
        creating
          ? `<div class="gen">
        <input name="password" required minlength="8" placeholder="رمز پیش‌فرض" dir="ltr">
        <button type="button" class="btn" id="g">ساخت رمز</button>
      </div>`
          : `<p class="muted">رمز از پنل عضو عوض می‌شود. اینجا رمز دیده نمی‌شود.</p>`
      }
      <select name="role">
        <option value="member" ${p.role === "member" ? "selected" : ""}>عضو</option>
        <option value="admin" ${p.role === "admin" ? "selected" : ""}>مدیر</option>
      </select>
      <button class="btn" type="submit">${creating ? "ساخت عضو" : "ذخیره"}</button>
      <p id="m" class="muted"></p>
      <div id="cred"></div>
      <p><a href="#/members">بازگشت به فهرست</a></p>
    </form>`,
  });
  const f = qs("#mf");
  const uBtn = qs("#u");
  const gBtn = qs("#g");
  if (uBtn) {
    uBtn.onclick = () => {
      const phone = f.phone.value.trim();
      f.username.value = phone || f.email.value.trim().split("@")[0];
    };
  }
  if (gBtn) {
    gBtn.onclick = () => {
      f.password.value = genPass();
    };
    f.password.value = genPass();
  }
  if (!f.username.value) {
    f.username.value = (p.phone || p.email || "").split("@")[0];
  }
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const row = {
      display_name: String(fd.get("display_name")).trim(),
      national_id: String(fd.get("national_id")).trim(),
      phone: String(fd.get("phone")).trim(),
      email: String(fd.get("email")).trim(),
      company_name: String(fd.get("company_name") || "").trim(),
      group_name: String(fd.get("group_name") || "").trim(),
      username: String(fd.get("username")).trim(),
      role: String(fd.get("role") || "member"),
    };
    qs("#m").textContent = "در حال ذخیره…";
    try {
      if (creating) {
        const password = String(fd.get("password"));
        const { data, error } = await petavuData.auth.createMemberAccount({
          email: row.email,
          password,
          meta: { must_change_password: true, phone: row.phone, username: row.username, full_name: row.display_name },
        });
        if (error || !data?.user) throw error || new Error("حساب ساخته نشد.");
        const pe = await saveIdentity(data.user.id, { ...row, must_change_password: true });
        if (pe) throw pe;
        if (row.company_name) {
          await petavuData.businesses.create({
            owner_id: data.user.id,
            name: row.company_name,
            slug: (row.username || data.user.id.slice(0, 8)).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            kind: "petshop",
            published: false,
          });
        }
        qs("#m").className = "ok";
        qs("#m").textContent = "عضو ساخته شد. این رمز را یک‌بار به عضو بدهید.";
        qs("#cred").innerHTML = `<div class="cred"><b>یک‌بار نمایش</b><p dir="ltr">user: ${esc(row.email)}</p><p dir="ltr">pass: ${esc(password)}</p></div>`;
      } else {
        const error = await saveIdentity(id, row);
        if (error) throw error;
        qs("#m").className = "ok";
        qs("#m").textContent = "ذخیره شد.";
      }
    } catch (err) {
      qs("#m").className = "err";
      qs("#m").textContent = err.message || String(err);
    }
  };
}

const SMS_VENDORS = [
  { id: "kavenegar", label: "کاوه نگار", hint: "از پنل: کلید API و شماره خط." },
  { id: "melipayamak", label: "ملی پیامک", hint: "از پنل: نام کاربری، رمز، شماره خط. برای رمز یک‌بارمصرف کد پترن." },
  { id: "smsir", label: "SMS.ir", hint: "از پنل: کلید API و شماره خط. قالب تأیید اختیاری است." },
  { id: "farazsms", label: "فراز اس‌ام‌اس", hint: "از پنل: نام کاربری، رمز، خط، کد پترن." },
  { id: "ghasedak", label: "قاصدک", hint: "از پنل: کلید API و شماره خط." },
  { id: "magfa", label: "مگفا", hint: "از پنل: نام کاربری، رمز، خط و آدرس وب‌سرویس." },
  { id: "payamresan", label: "پیام‌رسان", hint: "از پنل: نام کاربری، رمز و شماره خط." },
  { id: "custom", label: "سایر سامانه‌ها", hint: "هر پنل دیگری: آدرس وب‌سرویس و همان چیزهایی که پنل به شما داده." },
];
const SMS_FIELDS = {
  kavenegar: ["api_key", "sender"],
  melipayamak: ["username", "password", "sender", "pattern_id"],
  smsir: ["api_key", "sender", "pattern_id"],
  farazsms: ["username", "password", "sender", "pattern_id"],
  ghasedak: ["api_key", "sender"],
  magfa: ["username", "password", "sender", "api_url"],
  payamresan: ["username", "password", "sender"],
  custom: ["api_url", "username", "password", "api_key", "sender", "pattern_id"],
};
const FIELD_LABEL = {
  api_key: "کلید API",
  username: "نام کاربری پنل",
  password: "رمز پنل",
  sender: "شماره خط ارسال",
  pattern_id: "کد پترن / قالب (برای رمز یک‌بارمصرف)",
  api_url: "آدرس وب‌سرویس",
};
const SMS_USES = [
  { id: "otp_login", title: "ورود با موبایل", desc: "کد تأیید به شماره عضو" },
  { id: "member_welcome", title: "عضو جدید", desc: "ارسال کاربری و رمز ساخته‌شده" },
  { id: "password_reset", title: "بازیابی رمز", desc: "کد یا لینک بازیابی" },
  { id: "shop_notify", title: "فروشگاه", desc: "اطلاع سفارش و موجودی" },
  { id: "admin_alert", title: "هشدار مدیریت", desc: "پیام به مدیران شبکه" },
];

async function viewSms() {
  const list = await petavuData.sms.list();
  const rows = list.length
    ? list
        .map(
          (g) => `<tr>
            <td>${esc(g.name)}</td>
            <td>${esc((SMS_VENDORS.find((v) => v.id === g.vendor) || {}).label || g.vendor)}</td>
            <td>${g.enabled ? "فعال" : "خاموش"}</td>
            <td dir="ltr">${esc(g.sender || "—")}</td>
            <td><a class="btn" href="#/sms-edit/${g.id}">ویرایش</a></td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="5" class="muted">هنوز سامانه‌ای نیست. از «سامانهٔ جدید» اضافه کنید.</td></tr>`;
  petavuChrome({
    items, active: "sms", still: "assets/still-home.jpg",
    kicker: "پیامک",
    title: "سامانه‌های پیامک",
    lead: "همان چیزهایی را وارد کنید که پنل ایرانی به شما می‌دهد. بعد مشخص کنید هر بخش سایت از کدام سامانه بفرستد.",
    body: `<div class="toolbar">
        <a class="btn" href="#/sms-new">سامانهٔ جدید</a>
        <a class="btn" href="#/sms-routes">کدام بخش از کدام پنل</a>
      </div>
      <table>
        <thead><tr><th>نام</th><th>سامانه</th><th>وضعیت</th><th>خط</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="muted">چند سامانه هم‌زمان مجاز است. ارسال واقعی وقتی موبایل فعال شود از همین تنظیمات خوانده می‌شود.</p>`,
  });
}

async function viewSmsForm(id) {
  const list = await petavuData.sms.list();
  const g = (id && list.find((x) => x.id === id)) || {
    id: crypto.randomUUID(),
    name: "",
    vendor: "kavenegar",
    enabled: true,
    api_url: "",
    api_key: "",
    username: "",
    password: "",
    sender: "",
    pattern_id: "",
    notes: "",
  };
  const creating = !id;
  petavuChrome({
    items, active: "sms", still: "assets/still-home.jpg",
    kicker: creating ? "سامانهٔ جدید" : "ویرایش سامانه",
    title: creating ? "افزودن پنل پیامک" : g.name || "ویرایش",
    lead: "نوع سامانه را انتخاب کنید. فقط همان فیلدهایی که پنل‌تان داده پر شود.",
    body: `<form class="stack" id="sf" style="max-width:640px">
      <p class="sec">شناسه</p>
      <input name="name" required placeholder="یک نام ساده — مثلاً کاوه‌نگار اصلی" value="${esc(g.name)}">
      <select name="vendor" id="vendor">${SMS_VENDORS.map((v) => `<option value="${v.id}" ${v.id === g.vendor ? "selected" : ""}>${v.label}</option>`).join("")}</select>
      <p class="muted" id="hint"></p>
      <p class="sec">آنچه پنل در اختیارتان گذاشته</p>
      <div id="fields"></div>
      <label class="muted"><input type="checkbox" name="enabled" ${g.enabled ? "checked" : ""}> این سامانه روشن باشد</label>
      <textarea name="notes" placeholder="یادداشت داخلی — اختیاری">${esc(g.notes || "")}</textarea>
      <button class="btn" type="submit">ذخیره</button>
      ${creating ? "" : `<button class="btn" type="button" id="del">حذف</button>`}
      <p id="m" class="muted"></p>
      <p><a href="#/sms">بازگشت</a></p>
    </form>`,
  });
  const f = qs("#sf");
  const fields = qs("#fields");
  const hint = qs("#hint");
  const draw = () => {
    const v = f.vendor.value;
    const spec = SMS_VENDORS.find((x) => x.id === v);
    hint.textContent = spec ? spec.hint : "";
    fields.innerHTML = SMS_FIELDS[v]
      .map((k) => {
        const type = k === "password" ? "password" : "text";
        return `<input name="${k}" type="${type}" placeholder="${FIELD_LABEL[k]}" dir="ltr" value="${esc(g[k] || "")}">`;
      })
      .join("");
  };
  f.vendor.onchange = draw;
  draw();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const row = {
      ...g,
      name: String(fd.get("name")).trim(),
      vendor: String(fd.get("vendor")),
      enabled: !!f.enabled.checked,
      notes: String(fd.get("notes") || ""),
      api_url: String(fd.get("api_url") || ""),
      api_key: String(fd.get("api_key") || ""),
      username: String(fd.get("username") || ""),
      password: String(fd.get("password") || ""),
      sender: String(fd.get("sender") || ""),
      pattern_id: String(fd.get("pattern_id") || ""),
      created_at: g.created_at || new Date().toISOString(),
    };
    await petavuData.sms.put(row);
    qs("#m").className = "ok";
    qs("#m").textContent = "ذخیره شد. از «کدام بخش از کدام پنل» مسیر ارسال را مشخص کنید.";
  };
  const del = qs("#del");
  if (del) {
    del.onclick = async () => {
      await petavuData.sms.remove(g.id);
      location.hash = "#/sms";
    };
  }
}

async function viewSmsRoutes() {
  const [list, routes] = await Promise.all([petavuData.sms.list(), petavuData.sms.routes()]);
  const opts = `<option value="">— انتخاب سامانه —</option>` + list.filter((g) => g.enabled).map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join("");
  petavuChrome({
    items, active: "sms", still: "assets/still-home.jpg",
    kicker: "مسیر ارسال",
    title: "هر بخش از کدام پنل",
    lead: "اگر چند سامانه دارید، برای هر کار یکی را انتخاب کنید. خالی یعنی هنوز پیامک نرود.",
    body: `<form class="stack" id="rf" style="max-width:640px">
      ${SMS_USES.map(
        (u) => `<div class="card">
          <b>${u.title}</b>
          <p class="muted">${u.desc}</p>
          <select name="${u.id}">${opts}</select>
        </div>`
      ).join("")}
      <button class="btn" type="submit">ذخیرهٔ مسیرها</button>
      <p id="m" class="muted"></p>
      <p><a href="#/sms">بازگشت به سامانه‌ها</a></p>
    </form>`,
  });
  const f = qs("#rf");
  SMS_USES.forEach((u) => {
    if (routes[u.id] && f[u.id]) f[u.id].value = routes[u.id];
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const obj = {};
    SMS_USES.forEach((u) => {
      obj[u.id] = f[u.id].value;
    });
    await petavuData.sms.setRoutes(obj);
    qs("#m").className = "ok";
    qs("#m").textContent = "مسیرها ذخیره شد.";
  };
}

window.addEventListener("hashchange", render);
render();
