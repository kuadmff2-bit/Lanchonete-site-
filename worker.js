const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...extraHeaders
  }
});

const DEFAULT_PRODUCTS = [
  { id: "1", name: "X-Tudo", price: 15, description: "O mais completo da casa.", category: "lanche", available: true, image: "" },
  { id: "2", name: "X-Calabresa", price: 12, description: "Lanche com sabor marcante de calabresa.", category: "lanche", available: true, image: "" },
  { id: "3", name: "X-Bacon", price: 12, description: "Clássico com bacon.", category: "lanche", available: true, image: "" },
  { id: "4", name: "X-Salsicha", price: 12, description: "Lanche reforçado com salsicha.", category: "lanche", available: true, image: "" },
  { id: "5", name: "X-Banana", price: 12, description: "Uma combinação diferente e saborosa.", category: "lanche", available: true, image: "" },
  { id: "6", name: "X-Salada", price: 9, description: "Clássico, leve e bem montado.", category: "lanche", available: true, image: "" },
  { id: "7", name: "X-Burguer", price: 7, description: "Hambúrguer simples e direto ao ponto.", category: "lanche", available: true, image: "" },
  { id: "8", name: "X-Egg / X-Pio", price: 7, description: "Opção com ovo.", category: "lanche", available: true, image: "" },
  { id: "9", name: "Misto Duplo", price: 7, description: "Misto em versão dupla.", category: "lanche", available: true, image: "" },
  { id: "10", name: "Queijo Duplo", price: 6, description: "Para quem gosta de muito queijo.", category: "lanche", available: true, image: "" },
  { id: "11", name: "Hambúrguer", price: 5, description: "Hambúrguer tradicional.", category: "lanche", available: true, image: "" },
  { id: "12", name: "Misto Quente", price: 5, description: "O clássico misto quente.", category: "lanche", available: true, image: "" },
  { id: "13", name: "Misto Simples", price: 5, description: "Simples, rápido e saboroso.", category: "lanche", available: true, image: "" }
];

const ADMIN_SESSION_COOKIE = "lanchonete_admin_session";
const ADMIN_SESSION_TTL = 60 * 60 * 24 * 30;
const ADMIN_APP_MARKER = "LanchoneteAdminApp/";

function readCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const prefix = `${name}=`;
  for (const part of cookie.split(";")) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return "";
}

function isAdminAppRequest(request) {
  return (request.headers.get("user-agent") || "").includes(ADMIN_APP_MARKER);
}

function sessionCookie(token) {
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${ADMIN_SESSION_TTL}; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

async function createAdminSession(env) {
  if (!env.PROMOTIONS) return "";
  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  await env.PROMOTIONS.put(`admin-session:${token}`, "1", { expirationTtl: ADMIN_SESSION_TTL });
  return token;
}

async function authorized(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return { ok: false, response: json({ error: "Senha de administrador não configurada no Cloudflare." }, 500) };
  }

  const sessionToken = readCookie(request, ADMIN_SESSION_COOKIE);
  if (sessionToken && env.PROMOTIONS) {
    const validSession = await env.PROMOTIONS.get(`admin-session:${sessionToken}`);
    if (validSession === "1") {
      return { ok: true, sessionToken, fromSession: true };
    }
  }

  const password = request.headers.get("x-admin-password") || "";
  if (password !== env.ADMIN_PASSWORD) {
    return { ok: false, response: json({ error: "Senha incorreta." }, 401) };
  }

  let setCookie = "";
  if (isAdminAppRequest(request) && env.PROMOTIONS) {
    const token = await createAdminSession(env);
    if (token) setCookie = sessionCookie(token);
  }

  return { ok: true, setCookie, fromSession: false };
}

function authJson(data, auth, status = 200) {
  return json(data, status, auth?.setCookie ? { "set-cookie": auth.setCookie } : {});
}

function normalizeProduct(item, index) {
  const price = Number(item?.price);
  const image = String(item?.image || "");
  return {
    id: String(item?.id || `p-${Date.now()}-${index}`).slice(0, 80),
    name: String(item?.name || "").trim().slice(0, 80),
    price: Number.isFinite(price) ? Math.max(0, Math.min(price, 10000)) : 0,
    description: String(item?.description || "").trim().slice(0, 220),
    category: item?.category === "bebida" ? "bebida" : "lanche",
    available: item?.available !== false,
    image: image.startsWith("data:image/") && image.length <= 700000 ? image : ""
  };
}

function safeDate(value) {
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
}

async function handleProducts(request, env) {
  if (request.method === "GET") {
    if (!env.PROMOTIONS) return json({ products: DEFAULT_PRODUCTS, storageConfigured: false });
    const raw = await env.PROMOTIONS.get("products");
    if (!raw) return json({ products: DEFAULT_PRODUCTS, storageConfigured: true });
    try {
      const parsed = JSON.parse(raw);
      return json({ products: Array.isArray(parsed) ? parsed : DEFAULT_PRODUCTS, storageConfigured: true });
    } catch {
      return json({ products: DEFAULT_PRODUCTS, storageConfigured: true });
    }
  }

  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const auth = await authorized(request, env);
  if (!auth.ok) return auth.response;
  if (!env.PROMOTIONS) return json({ error: "Armazenamento ainda não configurado no Cloudflare." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  if (!Array.isArray(body?.products)) return json({ error: "Lista de produtos inválida." }, 400);
  if (body.products.length > 60) return json({ error: "Limite de 60 produtos." }, 400);

  const products = body.products.map(normalizeProduct).filter((p) => p.name);
  await env.PROMOTIONS.put("products", JSON.stringify(products));
  return authJson({ ok: true, products, storageConfigured: true }, auth);
}

async function handlePromo(request, env) {
  if (request.method === "GET") {
    if (!env.PROMOTIONS) return json({ active: false, storageConfigured: false });
    const raw = await env.PROMOTIONS.get("current-promotion");
    if (!raw) return json({ active: false, storageConfigured: true });
    try { return json({ ...JSON.parse(raw), storageConfigured: true }); }
    catch { return json({ active: false, storageConfigured: true }); }
  }

  if (request.method === "DELETE") {
    const auth = await authorized(request, env);
    if (!auth.ok) return auth.response;
    if (!env.PROMOTIONS) return json({ error: "Armazenamento ainda não configurado no Cloudflare." }, 500);
    await env.PROMOTIONS.delete("current-promotion");
    return authJson({ ok: true, deleted: true, storageConfigured: true }, auth);
  }

  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const auth = await authorized(request, env);
  if (!auth.ok) return auth.response;
  if (!env.PROMOTIONS) return json({ error: "Armazenamento ainda não configurado no Cloudflare." }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  const promo = {
    active: Boolean(data.active),
    title: String(data.title || "").trim().slice(0, 80),
    description: String(data.description || "").trim().slice(0, 240),
    image: String(data.image || ""),
    updatedAt: new Date().toISOString()
  };
  if (promo.active && !promo.title) return json({ error: "Informe o título da promoção." }, 400);
  if (promo.image && !promo.image.startsWith("data:image/")) return json({ error: "Formato de imagem inválido." }, 400);
  if (promo.image.length > 1500000) return json({ error: "A imagem ficou muito grande." }, 413);
  await env.PROMOTIONS.put("current-promotion", JSON.stringify(promo));
  return authJson({ ok: true, promotion: promo, storageConfigured: true }, auth);
}

async function handleOrders(request, env) {
  if (request.method === "GET") {
    const auth = await authorized(request, env);
    if (!auth.ok) return auth.response;

    if (!env.PROMOTIONS) {
      return authJson({
        stats: { totalOrders: 0, totalValue: 0, todayOrders: 0, todayValue: 0, currentDate: "" },
        recent: [],
        storageConfigured: false
      }, auth);
    }

    const [statsRaw, recentRaw] = await Promise.all([
      env.PROMOTIONS.get("order-stats"),
      env.PROMOTIONS.get("recent-orders")
    ]);
    let stats = { totalOrders: 0, totalValue: 0, todayOrders: 0, todayValue: 0, currentDate: "" };
    let recent = [];
    try { if (statsRaw) stats = { ...stats, ...JSON.parse(statsRaw) }; } catch {}
    try { if (recentRaw) recent = JSON.parse(recentRaw); } catch {}
    return authJson({ stats, recent: Array.isArray(recent) ? recent : [], storageConfigured: true }, auth);
  }

  if (request.method === "DELETE") {
    const auth = await authorized(request, env);
    if (!auth.ok) return auth.response;
    if (!env.PROMOTIONS) return json({ error: "Armazenamento ainda não configurado no Cloudflare." }, 500);

    await Promise.all([
      env.PROMOTIONS.delete("order-stats"),
      env.PROMOTIONS.delete("recent-orders")
    ]);

    return authJson({
      ok: true,
      cleared: true,
      stats: { totalOrders: 0, totalValue: 0, todayOrders: 0, todayValue: 0, currentDate: localDateKeyForWorker() },
      recent: [],
      storageConfigured: true
    }, auth);
  }

  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!env.PROMOTIONS) return json({ ok: false, storageConfigured: false }, 202);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const total = Math.max(0, Math.min(Number(body?.total) || 0, 10000));
  const itemCount = Math.max(0, Math.min(Number(body?.itemCount) || 0, 100));
  const localDate = safeDate(body?.localDate);
  const items = Array.isArray(body?.items) ? body.items.slice(0, 30).map((item) => ({
    name: String(item?.name || "").slice(0, 80),
    qty: Math.max(1, Math.min(Number(item?.qty) || 1, 30))
  })) : [];

  const statsRaw = await env.PROMOTIONS.get("order-stats");
  let stats = { totalOrders: 0, totalValue: 0, todayOrders: 0, todayValue: 0, currentDate: localDate };
  try { if (statsRaw) stats = { ...stats, ...JSON.parse(statsRaw) }; } catch {}
  if (stats.currentDate !== localDate) {
    stats.currentDate = localDate;
    stats.todayOrders = 0;
    stats.todayValue = 0;
  }
  stats.totalOrders = (Number(stats.totalOrders) || 0) + 1;
  stats.totalValue = (Number(stats.totalValue) || 0) + total;
  stats.todayOrders = (Number(stats.todayOrders) || 0) + 1;
  stats.todayValue = (Number(stats.todayValue) || 0) + total;

  const recentRaw = await env.PROMOTIONS.get("recent-orders");
  let recent = [];
  try { if (recentRaw) recent = JSON.parse(recentRaw); } catch {}
  if (!Array.isArray(recent)) recent = [];
  recent.unshift({
    id: `P${Date.now().toString().slice(-7)}`,
    createdAt: new Date().toISOString(),
    localDate,
    total,
    itemCount,
    payment: String(body?.payment || "").slice(0, 30),
    deliveryType: String(body?.deliveryType || "").slice(0, 30),
    items
  });
  recent = recent.slice(0, 40);

  await Promise.all([
    env.PROMOTIONS.put("order-stats", JSON.stringify(stats)),
    env.PROMOTIONS.put("recent-orders", JSON.stringify(recent))
  ]);
  return json({ ok: true, storageConfigured: true });
}

function localDateKeyForWorker() {
  return new Date().toISOString().slice(0, 10);
}

async function handleLogout(request, env) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return json({ error: "Método não permitido." }, 405);
  }

  const sessionToken = readCookie(request, ADMIN_SESSION_COOKIE);
  if (sessionToken && env.PROMOTIONS) {
    await env.PROMOTIONS.delete(`admin-session:${sessionToken}`);
  }

  return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth") {
      if (request.method !== "GET") return json({ error: "Método não permitido." }, 405);
      const auth = await authorized(request, env);
      if (!auth.ok) return auth.response;
      return authJson({ ok: true, storageConfigured: Boolean(env.PROMOTIONS) }, auth);
    }

    if (url.pathname === "/api/logout") return handleLogout(request, env);
    if (url.pathname === "/api/products") return handleProducts(request, env);
    if (url.pathname === "/api/promo") return handlePromo(request, env);
    if (url.pathname === "/api/orders") return handleOrders(request, env);

    return env.ASSETS.fetch(request);
  }
};