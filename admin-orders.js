// Gestão dos pedidos para uso diário da lanchonete.
const ORDER_STATUS_LABELS = {
  novo: "Novo",
  confirmado: "Confirmado",
  preparando: "Preparando",
  saiu_entrega: "Saiu para entrega",
  finalizado: "Finalizado",
  cancelado: "Cancelado"
};

function orderStatusOptions(current) {
  return Object.entries(ORDER_STATUS_LABELS).map(([value, label]) =>
    `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`
  ).join("");
}

renderDashboard = function (data) {
  const stats = data?.stats || {};
  const isToday = stats.currentDate === localDateKey();
  $("#todayOrders").textContent = isToday ? Number(stats.todayOrders || 0) : 0;
  $("#totalOrders").textContent = Number(stats.totalOrders || 0);
  $("#todayValue").textContent = money(isToday ? stats.todayValue : 0);
  $("#totalValue").textContent = money(stats.totalValue || 0);

  const recent = Array.isArray(data?.recent) ? data.recent : [];
  $("#recentOrders").innerHTML = recent.length ? recent.map((order) => {
    const date = new Date(order.createdAt);
    const time = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dateText = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const status = ORDER_STATUS_LABELS[order.status] ? order.status : "novo";
    const itemText = Array.isArray(order.items) && order.items.length
      ? order.items.map((item) => `${Number(item.qty || 1)}x ${esc(item.name)}`).join(", ")
      : `${Number(order.itemCount || 0)} item(ns)`;
    const deliveryInfo = order.deliveryType === "Entrega" && order.address
      ? `<small class="order-detail"><b>Entrega:</b> ${esc(order.address)}${order.reference ? ` · Ref.: ${esc(order.reference)}` : ""}</small>`
      : `<small class="order-detail"><b>${esc(order.deliveryType || "Pedido")}</b></small>`;
    const note = order.note ? `<small class="order-detail"><b>Obs.:</b> ${esc(order.note)}</small>` : "";

    return `<article class="recent-order order-card status-${status}">
      <div class="recent-order-id">
        <strong>${esc(order.id || "Pedido")}</strong>
        <small>${esc(dateText)} · ${esc(time)}</small>
        <span class="order-status-badge status-${status}">${esc(ORDER_STATUS_LABELS[status])}</span>
      </div>
      <div class="recent-order-main">
        <strong>${esc(order.customerName || "Cliente")}</strong>
        <small>${itemText}</small>
        <small class="order-detail">${esc(order.deliveryType || "")} · ${esc(order.payment || "")}</small>
        ${deliveryInfo}
        ${note}
      </div>
      <div class="recent-order-side">
        <strong class="recent-order-total">${money(order.total)}</strong>
        <label class="order-status-control">Status
          <select data-order-status="${esc(order.id)}">${orderStatusOptions(status)}</select>
        </label>
      </div>
    </article>`;
  }).join("") : '<p class="empty-admin">Ainda não há pedidos registrados.</p>';

  const count = recent.length;
  const counter = document.querySelector(".recent-card .card-title span");
  if (counter) counter.textContent = count === 1 ? "1 pedido" : `${count} pedidos recentes`;
};

$("#recentOrders").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;

  const orderId = select.dataset.orderStatus;
  const status = select.value;
  select.disabled = true;
  setStatus("#dashboardStatus", `Atualizando ${orderId}...`);

  try {
    const data = await api(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    renderDashboard(data);
    setStatus("#dashboardStatus", `Pedido ${orderId}: ${ORDER_STATUS_LABELS[status]}.`, "ok");
  } catch (error) {
    setStatus("#dashboardStatus", error.message || "Não foi possível mudar o status.", "error");
    await refreshOrders();
  }
});

// O APK recebe uma sessão segura por cookie. Se ainda estiver válida,
// o painel abre direto sem pedir a senha novamente.
async function restoreAdminSession() {
  try {
    const response = await fetch("/api/orders", { cache: "no-store", credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    $("#loginPanel").hidden = true;
    $("#adminApp").hidden = false;
    renderDashboard(data);
    await Promise.all([loadProducts(), loadPromotion()]);
  } catch {}
}

$("#logoutButton").addEventListener("click", () => {
  fetch("/api/logout", { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
});

// Mantém a tela do dono atualizada sem precisar tocar em Atualizar toda hora.
setInterval(() => {
  if (document.visibilityState !== "visible") return;
  const app = $("#adminApp");
  if (!app || app.hidden) return;
  refreshOrders().catch(() => {});
}, 20000);

restoreAdminSession();
