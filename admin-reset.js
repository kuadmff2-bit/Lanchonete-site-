(() => {
  const refreshButton = document.querySelector("#refreshOrders");
  if (!refreshButton) return;

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.flexWrap = "wrap";

  refreshButton.parentNode.insertBefore(actions, refreshButton);
  actions.appendChild(refreshButton);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.id = "clearOrdersButton";
  clearButton.className = "secondary-small danger-outline";
  clearButton.textContent = "Limpar pedidos e valores";
  actions.appendChild(clearButton);

  clearButton.addEventListener("click", async () => {
    const first = confirm("Isso vai zerar TODOS os pedidos, valores acumulados e o histórico de pedidos. Produtos e promoções não serão apagados. Continuar?");
    if (!first) return;

    const second = confirm("Tem certeza? Essa ação não pode ser desfeita.");
    if (!second) return;

    clearButton.disabled = true;
    setStatus("#dashboardStatus", "Limpando pedidos e valores...");

    try {
      const data = await api("/api/orders", { method: "DELETE" });
      renderDashboard(data);
      setStatus("#dashboardStatus", "Pedidos, valores e histórico foram zerados.", "ok");
    } catch (error) {
      setStatus("#dashboardStatus", error.message || "Não foi possível limpar os dados.", "error");
    } finally {
      clearButton.disabled = false;
    }
  });
})();
