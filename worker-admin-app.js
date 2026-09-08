import worker from "./worker-fcm.js";

const ADMIN_APP_MARKER = "LanchoneteAdminApp/";

function authorizeAdminAppRequest(request, env) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent.includes(ADMIN_APP_MARKER) || !env.ADMIN_PASSWORD) return request;

  const headers = new Headers(request.headers);
  // A senha permanece somente no Cloudflare. O APK apenas se identifica pelo User-Agent próprio.
  headers.set("x-admin-password", env.ADMIN_PASSWORD);
  return new Request(request, { headers });
}

export default {
  async fetch(request, env, ctx) {
    return worker.fetch(authorizeAdminAppRequest(request, env), env, ctx);
  }
};
