import appWorker from "./worker-admin-app.js";
import { handlePushRelay, notifyNewOrderViaRelay } from "./push-relay.js";
import { notifyNewOrder } from "./push.js";
import { sendNewOrderMessages } from "./whatsapp-messages.js";
import { createOrderWithPromotion, handlePromotionsApi } from "./multi-promos-worker.js";
export { AppStorage } from "./durable-storage.js";

function withRobotControlToken(env) {
  if (!env?.ADMIN_PASSWORD) return env;
  return new Proxy(env, {
    get(target, property, receiver) {
      if (property === "ROBOT_CONTROL_TOKEN") return target.ADMIN_PASSWORD;
      return Reflect.get(target, property, receiver);
    }
  });
}

function replaceJsonBody(response, data) {
  const headers = new Headers(response.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function directPushConfigured(env) {
  return Boolean(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY);
}

async function notifyCustomOrder(env, order) {
  if (directPushConfigured(env)) return notifyNewOrder(env, order);
  return notifyNewOrderViaRelay(env, order);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const runtimeEnv = withRobotControlToken(env);

    if (url.pathname === "/api/push/relay") {
      return handlePushRelay(request, runtimeEnv);
    }

    if (url.pathname === "/api/promos") {
      return handlePromotionsApi(request, runtimeEnv, ctx, appWorker);
    }

    if (url.pathname === "/api/orders" && request.method === "POST") {
      const body = await request.clone().json().catch(() => null);
      if (body?.promoId) {
        const response = await createOrderWithPromotion(request, runtimeEnv, ctx, appWorker, body);
        if (!response.ok) return response;
        const data = await response.clone().json().catch(() => ({}));
        if (!data?.order || data?.duplicate) return response;

        const pushTask = notifyCustomOrder(runtimeEnv, data.order).catch(() => null);
        if (ctx?.waitUntil) ctx.waitUntil(pushTask);
        else await pushTask;

        const messaging = await sendNewOrderMessages(runtimeEnv, data.order);
        return replaceJsonBody(response, { ...data, messaging });
      }
    }

    const response = await appWorker.fetch(request, runtimeEnv, ctx);

    if (url.pathname === "/api/orders" && request.method === "POST" && response.ok) {
      const data = await response.clone().json().catch(() => ({}));
      if (data?.order && !data?.duplicate) {
        const task = notifyNewOrderViaRelay(runtimeEnv, data.order).catch(() => null);
        if (ctx?.waitUntil) ctx.waitUntil(task);
        else await task;
      }
    }

    return response;
  }
};
