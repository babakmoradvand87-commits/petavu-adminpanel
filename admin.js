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
    kicker: "پتاوو",
    title: "ورود به ادارهٔ شبکه",
    lead: "این دروازه فقط برای کسانی است که مسئولیت انتشار و اعتبار صنف را دارند.",
    captionTitle: "ادارهٔ یکپارچهٔ صنعت",
    caption: "عضویت، انتشار و امنیت شبکهٔ پت و اسب از اینجا هدایت می‌شود.",
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
    kicker: "ادارهٔ شبکه",
    title: "فرمان صنعت در دست شماست",
    lead: "هر واحد که به شبکه می‌آید، از اینجا دیده، سنجیده و منتشر می‌شود.",
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
    kicker: "صنف",
    title: "واحدهای حاضر در شبکه",
    lead: "پت‌شاپ، کلینیک، اصطبل، درمان و تأمین — هر کدام با جای خود.",
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
    kicker: "ویترین",
    title: "آنچه صنعت باید ببیند",
    lead: "اعتبار عمومی شبکه به دقت همین تأییدهاست.",
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
        <input type="search" id="q" placeholder="نام، شرکت، گروه">
        <a class="btn" href="#/members-new">ورود عضو به شبکه</a>
      </div>
      <p class="muted">هر عضو با هویت کامل در شبکه می‌ایستد؛ شرکت، گروه و مسیر ارتباط در یک پرونده.</p>
      <table>
        <thead><tr><th>نام</th><th>شرکت / فروشگاه</th><th>گروه</th><th>موبایل</th><th>کاربری</th><th></th></tr></thead>
        <tbody id="tb">${memberRows(all)}</tbody>
      </table>`;
  petavuChrome({
    items, active: "members", still: "assets/still-members.jpg",
    kicker: "اعضا",
    title: "کسانی که صنعت را می‌سازند",
    lead: "هویت، جایگاه و دسترسی هر عضو اینجا ثبت می‌شود.",
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
    kicker: creating ? "عضو جدید" : "پروندهٔ عضو",
    title: creating ? "ورود یک نام به صنعت" : p.display_name || "پروندهٔ عضو",
    lead: "هویت حقوقی و جایگاه صنفی، پیش از هر دسترسی.",
    body: `<form class="stack" id="mf" style="max-width:640px">
      <p class="sec">هویت</p>
      <div class="row-2">
        <input name="display_name" required placeholder="نام و نام خانوادگی" value="${esc(p.display_name)}">
        <input name="national_id" required placeholder="کد ملی" value="${esc(p.national_id)}">
      </div>
      <div class="row-2">
            <input name="phone" required placeholder="موبایل" dir="ltr" value="${esc(p.phone)}">
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
          : `<p class="muted">رمز فقط نزد عضو است و از میز کار خودش تازه می‌شود.</p>`
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
        qs("#m").textContent = "عضو در شبکه نشست. این دسترسی را یک‌بار به او بسپارید.";
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
  { id: "kavenegar", label: "کاوه نگار", hint: "ارتباط مستقیم با خط اختصاصی کاوه‌نگار." },
  { id: "melipayamak", label: "ملی پیامک", hint: "ارسال الگویی و خط اختصاصی ملی‌پیامک." },
  { id: "smsir", label: "SMS.ir", hint: "خط و قالب تأیید SMS.ir." },
  { id: "farazsms", label: "فراز اس‌ام‌اس", hint: "خط و الگوی فراز برای پیام‌های حساس." },
  { id: "ghasedak", label: "قاصدک", hint: "ارسال سریع روی خط قاصدک." },
  { id: "magfa", label: "مگفا", hint: "وب‌سرویس سازمانی مگفا." },
  { id: "payamresan", label: "پیام‌رسان", hint: "خط اختصاصی پیام‌رسان." },
  { id: "custom", label: "سامانهٔ اختصاصی", hint: "هر خط سازمانی دیگر، با مشخصات همان سامانه." },
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
  api_key: "کلید اختصاصی",
  username: "نام کاربری سامانه",
  password: "رمز سامانه",
  sender: "شمارهٔ خط",
  pattern_id: "شناسهٔ الگو",
  api_url: "نشانی وب‌سرویس",
};
const SMS_USES = [
  { id: "otp_login", title: "ورود اعضا", desc: "تأیید حضور با پیام به موبایل." },
  { id: "member_welcome", title: "خوشامد عضو", desc: "آغاز همکاری با یک پیام رسمی." },
  { id: "password_reset", title: "بازیابی دسترسی", desc: "بازگشت امن به میز کار." },
  { id: "shop_notify", title: "بازار صنف", desc: "خبر سفارش و جریان کالا." },
  { id: "admin_alert", title: "ادارهٔ شبکه", desc: "هشدار برای تصمیم‌های فوری." },
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
    : `<tr><td colspan="5" class="muted">هنوز خطی به شبکه وصل نشده است.</td></tr>`;
  petavuChrome({
    items, active: "sms", still: "assets/still-home.jpg",
    kicker: "پیامک",
    title: "صدای شبکه تا موبایل صنف",
    lead: "هر خط، یک مسیر اعتماد. چند سامانه می‌توانند کنار هم کار کنند.",
    body: `<div class="toolbar">
        <a class="btn" href="#/sms-new">خط جدید</a>
        <a class="btn" href="#/sms-routes">توزیع پیام</a>
      </div>
      <table>
        <thead><tr><th>نام</th><th>سامانه</th><th>وضعیت</th><th>خط</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`,
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
    kicker: creating ? "خط جدید" : "مشخصات خط",
    title: creating ? "وصل کردن یک سامانه" : g.name || "مشخصات خط",
    lead: "سامانه را برگزینید و مشخصات همان خط را بنویسید.",
    body: `<form class="stack" id="sf" style="max-width:640px">
      <p class="sec">نام در شبکه</p>
      <input name="name" required placeholder="مثلاً خط اصلی صنف" value="${esc(g.name)}">
      <select name="vendor" id="vendor">${SMS_VENDORS.map((v) => `<option value="${v.id}" ${v.id === g.vendor ? "selected" : ""}>${v.label}</option>`).join("")}</select>
      <p class="muted" id="hint"></p>
      <p class="sec">مشخصات سامانه</p>
      <div id="fields"></div>
      <label class="muted"><input type="checkbox" name="enabled" ${g.enabled ? "checked" : ""}> این خط فعال است</label>
      <textarea name="notes" placeholder="یادداشت برای مدیران">${esc(g.notes || "")}</textarea>
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
    qs("#m").textContent = "خط در شبکه نشست.";
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
    kicker: "توزیع پیام",
    title: "هر پیام، از مسیر خودش",
    lead: "ورود، خوشامد، بازیابی، بازار و اداره — هر کدام می‌تواند خط جدا داشته باشد.",
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
      <p><a href="#/sms">بازگشت به خطوط</a></p>
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
    qs("#m").textContent = "توزیع پیام ثبت شد.";
  };
}

window.addEventListener("hashchange", render);
render();
