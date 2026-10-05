/**
 * لایهٔ داده. امروز: Supabase.
 * فردا روی هاست: همین توابع را به /api/v1 وصل کن؛ UI عوض نمی‌شود.
 */
(function (global) {
  const env = global.PETAVU_ENV;
  const sb = global.supabase.createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "petavu-v1" },
  });

  global.petavuData = {
    backend: "supabase",
    auth: {
      user: async () => {
        const { data } = await sb.auth.getSession();
        return data.session?.user || null;
      },
      signIn: (email, password) => sb.auth.signInWithPassword({ email, password }),
      signUp: (email, password) => sb.auth.signUp({ email, password }),
      signOut: () => sb.auth.signOut(),
      updatePassword: (password) => sb.auth.updateUser({ password }),
      setMeta: (data) => sb.auth.updateUser({ data }),
      createMemberAccount: async ({ email, password, meta }) => {
        const { data: cur } = await sb.auth.getSession();
        const saved = cur.session;
        const res = await sb.auth.signUp({
          email,
          password,
          options: { data: meta || {} },
        });
        if (saved?.access_token && saved?.refresh_token) {
          await sb.auth.setSession({
            access_token: saved.access_token,
            refresh_token: saved.refresh_token,
          });
        }
        return res;
      },
    },
    profile: {
      me: async () => {
        const user = await global.petavuData.auth.user();
        if (!user) return null;
        const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (error) throw error;
        return data;
      },
      all: () => sb.from("profiles").select("*").order("created_at", { ascending: false }),
      update: (id, row) => sb.from("profiles").update(row).eq("id", id),
      upsert: (row) => sb.from("profiles").upsert(row),
    },
    groups: {
      all: () => sb.from("member_groups").select("*").order("name"),
      add: (name) => sb.from("member_groups").insert({ name }),
    },
    businesses: {
      published: () => sb.from("businesses").select("*").eq("published", true).order("created_at", { ascending: false }),
      bySlug: (slug) => sb.from("businesses").select("*").eq("slug", slug).eq("published", true).maybeSingle(),
      mine: (ownerId) => sb.from("businesses").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      all: () => sb.from("businesses").select("*").order("created_at", { ascending: false }),
      create: (row) => sb.from("businesses").insert(row),
      setPublished: (id, published) => sb.from("businesses").update({ published }).eq("id", id),
    },
    products: {
      published: () =>
        sb.from("products").select("id,name,price_irr,published,businesses(name,slug)").eq("published", true),
      all: () => sb.from("products").select("id,name,price_irr,published,businesses(name)"),
    },
    sms: {
      async list() {
        const { data, error } = await sb.from("sms_gateways").select("*").order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          localStorage.setItem("petavu-v1-sms", JSON.stringify(data));
          return data;
        }
        try {
          return JSON.parse(localStorage.getItem("petavu-v1-sms") || "[]");
        } catch {
          return [];
        }
      },
      async put(row) {
        const list = await global.petavuData.sms.list();
        const i = list.findIndex((x) => x.id === row.id);
        if (i >= 0) list[i] = row;
        else list.unshift(row);
        localStorage.setItem("petavu-v1-sms", JSON.stringify(list));
        await sb.from("sms_gateways").upsert(row);
        return list;
      },
      async remove(id) {
        const list = (await global.petavuData.sms.list()).filter((x) => x.id !== id);
        localStorage.setItem("petavu-v1-sms", JSON.stringify(list));
        await sb.from("sms_gateways").delete().eq("id", id);
        return list;
      },
      async routes() {
        const { data, error } = await sb.from("sms_routes").select("*");
        if (!error && Array.isArray(data)) {
          const o = {};
          data.forEach((r) => {
            o[r.feature] = r.gateway_id;
          });
          localStorage.setItem("petavu-v1-sms-routes", JSON.stringify(o));
          return o;
        }
        try {
          return JSON.parse(localStorage.getItem("petavu-v1-sms-routes") || "{}");
        } catch {
          return {};
        }
      },
      async setRoutes(obj) {
        localStorage.setItem("petavu-v1-sms-routes", JSON.stringify(obj));
        const rows = Object.keys(obj).map((feature) => ({ feature, gateway_id: obj[feature] || null }));
        if (rows.length) await sb.from("sms_routes").upsert(rows);
        return obj;
      },
    },
  };
})(window);
