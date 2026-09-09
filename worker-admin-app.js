import worker from "./worker-fcm.js";

// O APK usa o mesmo login seguro do painel web. Não há senha embutida no
// aplicativo nem autorização baseada apenas no User-Agent.
export default {
  fetch(request, env, ctx) {
    return worker.fetch(request, env, ctx);
  }
};
