const DEFAULT_STATE = {
  settings: {
    name: "MC BAE",
    subtitle: "Restaurante e Hamburgueria",
    heroTitle: "Artesanal de verdade. Pedido sem complicação.",
    heroText: "Hambúrgueres, sanduíches, hot dogs, batatas e bebidas.",
    whatsapp: "5592993555582",
    instagram: "",
    facebook: "",
    address: "",
    paymentText: "Pix, cartão de crédito, débito ou dinheiro",
    deliveryText: "Delivery disponível"
  },
  products: [
    { id: "mc-artesanal-especial", category: "Hambúrgueres artesanais", name: "MC Burguer Artesanal Especial", description: "Pão brioche, 1 blend de carne artesanal, cebola caramelizada, duplo queijo mussarela, salada e molho da casa.", price: 18, available: true, hasImage: false },
    { id: "mc-turbinado", category: "Hambúrgueres artesanais", name: "MC Burguer Turbinado", description: "Pão brioche, 2 blends de carne artesanal, bacon, duplo queijo mussarela, salada e molho da casa.", price: 20, available: true, hasImage: false },
    { id: "mc-tropical", category: "Hambúrgueres artesanais", name: "MC Burguer Tropical", description: "Pão brioche, 1 blend de carne artesanal, abacaxi, queijo mussarela, cebola caramelizada, bacon e molho da casa.", price: 20, available: true, hasImage: false },
    { id: "mc-salada", category: "Hambúrgueres artesanais", name: "MC Burguer Salada", description: "Pão brioche, 1 blend de carne artesanal, queijo mussarela, ovo, cebola caramelizada, salada e molho da casa.", price: 18, available: true, hasImage: false },
    { id: "batata-simples", category: "Batata frita", name: "Batata simples", description: "1 porção de batata simples com molho da casa.", price: 12, available: true, hasImage: false },
    { id: "batata-bacon", category: "Batata frita", name: "Batata com bacon", description: "1 porção de batata frita com bacon e molho da casa.", price: 15, available: true, hasImage: false },
    { id: "batata-calabresa", category: "Batata frita", name: "Batata com calabresa", description: "1 porção de batata frita com calabresa e molho da casa.", price: 15, available: true, hasImage: false },
    { id: "x-salada", category: "Sanduíches tradicionais", name: "X-Salada", description: "", price: 12, available: true, hasImage: false },
    { id: "x-salsicha", category: "Sanduíches tradicionais", name: "X-Salsicha", description: "", price: 12, available: true, hasImage: false },
    { id: "x-banana", category: "Sanduíches tradicionais", name: "X-Banana", description: "", price: 12, available: true, hasImage: false },
    { id: "x-file", category: "Sanduíches tradicionais", name: "X-Filé", description: "", price: 18, available: true, hasImage: false },
    { id: "x-bacon", category: "Sanduíches tradicionais", name: "X-Bacon", description: "", price: 12, available: true, hasImage: false },
    { id: "x-salada-artesanal", category: "Sanduíches tradicionais", name: "X-Salada com carne artesanal", description: "", price: 14, available: true, hasImage: false },
    { id: "x-pio", category: "Sanduíches tradicionais", name: "X Pio", description: "", price: 10, available: true, hasImage: false },
    { id: "misto-quente", category: "Sanduíches tradicionais", name: "Misto quente", description: "", price: 6, available: true, hasImage: false },
    { id: "queijo-quente", category: "Sanduíches tradicionais", name: "Queijo quente", description: "", price: 6, available: true, hasImage: false },
    { id: "hotdog-simples", category: "Hot dog", name: "Hot Dog simples", description: "", price: 6, available: true, hasImage: false },
    { id: "hotdog-bacon", category: "Hot dog", name: "Hot Dog com bacon", description: "Com bacon e molho da casa.", price: 10, available: true, hasImage: false },
    { id: "hotdog-calabresa", category: "Hot dog", name: "Hot Dog com calabresa", description: "Com calabresa e molho da casa.", price: 10, available: true, hasImage: false },
    { id: "suco-300", category: "Bebidas", name: "Suco 300 ml", description: "Consultar sabores disponíveis.", price: 6, available: true, hasImage: false },
    { id: "coca-lata", category: "Bebidas", name: "Coca-Cola lata", description: "", price: 6, available: true, hasImage: false },
    { id: "coca-1l", category: "Bebidas", name: "Coca-Cola 1 L", description: "", price: 11, available: true, hasImage: false },
    { id: "agua", category: "Bebidas", name: "Água mineral", description: "", price: 5, available: true, hasImage: false }
  ],
  promotions: []
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cleanText(value, max = 160) {
  return String(value ?? "").trim().replace(/[<>]/g, "").slice(0, max);
}

function money(value) {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value) * 100) / 100) : 0;
}

function normalizePhone(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return /^55\d{10,11}$/.test(digits) ? digits : "";
}

function productId(value) {
  return String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function normalizeState(input, previous = DEFAULT_STATE) {
  const settings = input?.settings || {};
  const products = Array.isArray(input?.products) ? input.products : previous.products;
  const promotions = Array.isArray(input?.promotions) ? input.promotions : previous.promotions;
  const seen = new Set();
  return {
    settings: {
      name: cleanText(settings.name || previous.settings.name, 60),
      subtitle: cleanText(settings.subtitle || previous.settings.subtitle, 90),
      heroTitle: cleanText(settings.heroTitle || previous.settings.heroTitle, 100),
      heroText: cleanText(settings.heroText || previous.settings.heroText, 180),
      whatsapp: normalizePhone(settings.whatsapp || previous.settings.whatsapp) || previous.settings.whatsapp,
      instagram: cleanText(settings.instagram, 120),
      facebook: cleanText(settings.facebook, 120),
      address: cleanText(settings.address, 180),
      paymentText: cleanText(settings.paymentText || previous.settings.paymentText, 120),
      deliveryText: cleanText(settings.deliveryText || previous.settings.deliveryText, 120)
    },
    products: products.slice(0, 120).map((item, index) => {
      let id = productId(item.id || item.name || `produto-${index + 1}`) || `produto-${index + 1}`;
      if (seen.has(id)) id = `${id}-${index + 1}`;
      seen.add(id);
      return {
        id,
        category: cleanText(item.category || "Outros", 60),
        name: cleanText(item.name || "Produto", 80),
        description: cleanText(item.description, 260),
        price: money(item.price),
        available: item.available !== false,
        hasImage: item.hasImage === true
      };
    }),
    promotions: promotions.slice(0, 20).map((item, index) => ({
      id: productId(item.id || item.title || `promo-${index + 1}`) || `promo-${index + 1}`,
      title: cleanText(item.title || "Promoção", 80),
      description: cleanText(item.description, 220),
      price: money(item.price),
      active: item.active !== false,
      hasImage: item.hasImage === true
    }))
  };
}

function orderMessage(order, settings) {
  const lines = [
    `*Novo pedido #${order.id}*`,
    "",
    ...order.items.map(item => `${item.qty}x ${item.name} — R$ ${(item.subtotal).toFixed(2).replace(".", ",")}`),
    "",
    `*Total: R$ ${order.total.toFixed(2).replace(".", ",")}*`,
    `Cliente: ${order.customer.name}`,
    order.customer.phone ? `Telefone: ${order.customer.phone}` : "",
    `Entrega/retirada: ${order.customer.fulfillment}`,
    order.customer.address ? `Endereço: ${order.customer.address}` : "",
    order.customer.payment ? `Pagamento: ${order.customer.payment}` : "",
    order.customer.notes ? `Observação: ${order.customer.notes}` : ""
  ].filter(Boolean);
  return { text: lines.join("\n"), whatsapp: settings.whatsapp };
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function isAdmin(request, env) {
  const appToken = request.headers.get("x-admin-app-token") || "";
  if (appToken && env.ADMIN_APP_TOKEN_SHA256 && await sha256(appToken) === env.ADMIN_APP_TOKEN_SHA256) return true;
  const password = request.headers.get("x-admin-password") || "";
  if (password && env.ADMIN_PASSWORD_SHA256 && await sha256(password) === env.ADMIN_PASSWORD_SHA256) return true;
  return false;
}

export class McBaeStorage {
  constructor(state) {
    this.storage = state.storage;
  }

  async getState() {
    let state = await this.storage.get("state");
    if (!state) {
      state = structuredClone(DEFAULT_STATE);
      await this.storage.put("state", state);
    }
    return state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");

    if (request.method === "GET" && path === "/catalog") {
      return json(await this.getState());
    }

    if (request.method === "GET" && path.startsWith("/image/")) {
      const id = productId(decodeURIComponent(path.slice(7)));
      const image = await this.storage.get(`image:${id}`);
      if (!image?.bytes) return new Response("", { status: 404 });
      return new Response(image.bytes, {
        headers: {
          "content-type": image.type || "image/webp",
          "cache-control": "public, max-age=3600",
          "x-content-type-options": "nosniff"
        }
      });
    }

    if (request.method === "POST" && path === "/orders") {
      const state = await this.getState();
      const body = await request.json().catch(() => null);
      if (!body || !Array.isArray(body.items) || !body.items.length) return json({ error: "Pedido vazio." }, 400);
      const byId = new Map(state.products.map(item => [item.id, item]));
      const items = [];
      for (const raw of body.items.slice(0, 40)) {
        const product = byId.get(productId(raw.id));
        const qty = Math.min(20, Math.max(1, Math.floor(Number(raw.qty) || 1)));
        if (!product || product.available === false) return json({ error: "Um item do pedido não está disponível." }, 409);
        items.push({ id: product.id, name: product.name, qty, unitPrice: product.price, subtotal: Math.round(product.price * qty * 100) / 100 });
      }
      const customer = {
        name: cleanText(body.customer?.name, 80),
        phone: cleanText(body.customer?.phone, 24),
        fulfillment: cleanText(body.customer?.fulfillment || "Entrega", 30),
        address: cleanText(body.customer?.address, 180),
        payment: cleanText(body.customer?.payment, 60),
        notes: cleanText(body.customer?.notes, 220)
      };
      if (customer.name.length < 2) return json({ error: "Informe o nome do cliente." }, 400);
      if (customer.fulfillment === "Entrega" && customer.address.length < 5) return json({ error: "Informe o endereço para entrega." }, 400);
      const now = new Date();
      const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
      const id = `${stamp}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
      const order = {
        id,
        createdAt: now.toISOString(),
        status: "novo",
        items,
        total: Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100,
        customer
      };
      await this.storage.put(`order:${id}`, order);
      const message = orderMessage(order, state.settings);
      return json({ order, message: message.text, whatsappUrl: `https://wa.me/${message.whatsapp}?text=${encodeURIComponent(message.text)}` }, 201);
    }

    if (request.method === "GET" && path === "/admin/state") {
      const state = await this.getState();
      const listed = await this.storage.list({ prefix: "order:", reverse: true, limit: 100 });
      return json({ ...state, orders: [...listed.values()] });
    }

    if (request.method === "PUT" && path === "/admin/state") {
      const previous = await this.getState();
      const input = await request.json().catch(() => null);
      if (!input) return json({ error: "Dados inválidos." }, 400);
      const next = normalizeState(input, previous);
      await this.storage.put("state", next);
      return json(next);
    }

    if (request.method === "PATCH" && path.startsWith("/admin/orders/")) {
      const id = cleanText(decodeURIComponent(path.slice(14)), 40);
      const key = `order:${id}`;
      const order = await this.storage.get(key);
      if (!order) return json({ error: "Pedido não encontrado." }, 404);
      const body = await request.json().catch(() => ({}));
      const allowed = new Set(["novo", "preparando", "saiu", "concluido", "cancelado"]);
      const status = allowed.has(body.status) ? body.status : order.status;
      const updated = { ...order, status, updatedAt: new Date().toISOString() };
      await this.storage.put(key, updated);
      return json(updated);
    }

    if ((request.method === "POST" || request.method === "DELETE") && path.startsWith("/admin/image/")) {
      const id = productId(decodeURIComponent(path.slice(13)));
      if (!id) return json({ error: "Produto inválido." }, 400);
      if (request.method === "DELETE") {
        await this.storage.delete(`image:${id}`);
        return json({ ok: true });
      }
      const type = request.headers.get("content-type") || "";
      if (!/^image\/(webp|jpeg|png)$/i.test(type)) return json({ error: "Formato de imagem inválido." }, 415);
      const bytes = await request.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 115000) return json({ error: "Imagem muito grande. Limite: 115 KB." }, 413);
      await this.storage.put(`image:${id}`, { type, bytes });
      return json({ ok: true, bytes: bytes.byteLength });
    }

    return json({ error: "Rota não encontrada." }, 404);
  }
}

function secureAsset(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname.startsWith("/api/admin/") && !(await isAdmin(request, env))) {
        return json({ error: "Não autorizado." }, 401);
      }
      const id = env.APP_STORAGE.idFromName("mc-bae-v1");
      return env.APP_STORAGE.get(id).fetch(request);
    }
    const response = await env.ASSETS.fetch(request);
    return secureAsset(response);
  }
};
