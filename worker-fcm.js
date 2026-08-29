import baseWorker from "./worker.js";
import { handlePushRegistration, notifyNewOrder } from "./push.js";

async function authorizeWithBaseWorker(request, env, ctx) {
  const authUrl = new URL("/api/auth", request.url);
  const authRequest = new Request(authUrl, {
    method: "GET",
    headers: request.headers
  });
  return baseWorker.fetch(authRequest, env, ctx);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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
