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
    },
    profile: {
      me: async () => {
        const user = await global.petavuData.auth.user();
        if (!user) return null;
        const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (error) throw error;
        return data;
      },
      all: () => sb.from("profiles").select("id,email,display_name,role,created_at").order("created_at", { ascending: false }),
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
  };
})(window);
