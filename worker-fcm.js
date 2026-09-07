import baseWorker from "./worker.js";
import { handlePushRegistration, notifyNewOrder } from "./push.js";

const DEFAULT_ROBOT_SETTINGS = {
  enabled: false,
  greeting: "Olá! 👋 Sou o atendimento automático da lanchonete. Como posso ajudar?",
  fallback: "Não consegui entender sua mensagem. Digite menu para ver as opções ou aguarde um atendente.",
  humanHandoff: true,
  businessHoursOnly: false,
  openTime: "18:00",
  closeTime: "23:59",
  menuText: "1 - Ver cardápio\n2 - Fazer pedido\n3 - Acompanhar pedido\n4 - Falar com atendente",
  updatedAt: null
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function safeText(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function safeTime(value, fallback) {
  const text = String(value || "");
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
}

async function authorizeWithBaseWorker(request, env, ctx) {
  const authUrl = new URL("/api/auth", request.url);
  const authRequest = new Request(authUrl, {
    method: "GET",
    headers: request.headers
  });
  return baseWorker.fetch(authRequest, env, ctx);
}

async function handleRobotSettings(request, env, ctx) {
  if (request.method === "GET") {
    if (!env.PROMOTIONS) return json({ ...DEFAULT_ROBOT_SETTINGS, storageConfigured: false });
    const raw = await env.PROMOTIONS.get("robot-settings");
    if (!raw) return json({ ...DEFAULT_ROBOT_SETTINGS, storageConfigured: true });
    try {
      return json({ ...DEFAULT_ROBOT_SETTINGS, ...JSON.parse(raw), storageConfigured: true });
    } catch {
      return json({ ...DEFAULT_ROBOT_SETTINGS, storageConfigured: true });
    }
  }

  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const authResponse = await authorizeWithBaseWorker(request, env, ctx);
  if (!authResponse.ok) return authResponse;
  if (!env.PROMOTIONS) return json({ error: "Armazenamento ainda não configurado no Cloudflare." }, 500);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }

  const settings = {
    enabled: Boolean(data.enabled),
    greeting: safeText(data.greeting, 500) || DEFAULT_ROBOT_SETTINGS.greeting,
    fallback: safeText(data.fallback, 500) || DEFAULT_ROBOT_SETTINGS.fallback,
    humanHandoff: data.humanHandoff !== false,
    businessHoursOnly: Boolean(data.businessHoursOnly),
    openTime: safeTime(data.openTime, DEFAULT_ROBOT_SETTINGS.openTime),
    closeTime: safeTime(data.closeTime, DEFAULT_ROBOT_SETTINGS.closeTime),
    menuText: safeText(data.menuText, 1200) || DEFAULT_ROBOT_SETTINGS.menuText,
    updatedAt: new Date().toISOString()
  };

  await env.PROMOTIONS.put("robot-settings", JSON.stringify(settings));
  const setCookie = authResponse.headers.get("set-cookie");
  return json({ ok: true, settings, storageConfigured: true }, 200, setCookie ? { "set-cookie": setCookie } : {});
}

function publicFirebaseConfig(env) {
  const config = {
    apiKey: String(env.FCM_ANDROID_API_KEY || ""),
    appId: String(env.FCM_ANDROID_APP_ID || ""),
    projectId: String(env.FCM_PROJECT_ID || ""),
    senderId: String(env.FCM_SENDER_ID || "")
  };
  return new Response(JSON.stringify({
    ...config,
    configured: Boolean(config.apiKey && config.appId && config.projectId && config.senderId)
  }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/robot") {
      return handleRobotSettings(request, env, ctx);
    }

    if (url.pathname === "/api/push/config" && request.method === "GET") {
      return publicFirebaseConfig(env);
    }

    if (url.pathname === "/api/push/register") {
      const authResponse = await authorizeWithBaseWorker(request, env, ctx);
      if (!authResponse.ok) return authResponse;
      return handlePushRegistration(request, env);
    }

    if (url.pathname === "/api/orders" && request.method === "POST") {
      const response = await baseWorker.fetch(request, env, ctx);

      if (response.ok) {
        const data = await response.clone().json().catch(() => ({}));
        if (data?.order && !data?.duplicate) {
          const task = notifyNewOrder(env, data.order).catch(() => null);
          if (ctx?.waitUntil) ctx.waitUntil(task);
          else await task;
        }
      }

      return response;
    }

    return baseWorker.fetch(request, env, ctx);
  }
};
