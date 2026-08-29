// Controle simples da promoção: sempre aparece no site; disponível = clicável para pedir.
(() => {
  const promoPrice = $("#promoPrice");
  const promoOrderEnabled = $("#promoOrderEnabled");
  const promoActive = $("#promoActive");
  const previewPromoPrice = $("#previewPromoPrice");
  const previewPromoHint = $("#previewPromoHint");
  const hidePromoButton = $("#hidePromoButton");

  // Os antigos checkboxes continuam só como estado interno para manter compatibilidade
  // com o restante do painel, mas não aparecem mais para o usuário.
  if (promoOrderEnabled?.closest("label")) promoOrderEnabled.closest("label").hidden = true;
  if (promoActive?.closest("label")) promoActive.closest("label").hidden = true;
  if (promoActive) promoActive.checked = true;

  const settingsText = document.querySelector(".promo-order-settings > p");
  if (settingsText) {
    settingsText.textContent = "Defina o valor final. Quando a promoção estiver disponível, o cliente toca nela e vai direto para preencher os dados do pedido.";
  }

  const availableButton = document.createElement("button");
  availableButton.type = "button";
  availableButton.id = "promoAvailableButton";
  availableButton.className = "promo-availability-button available";
  availableButton.textContent = "Disponibilizar";

  hidePromoButton.textContent = "Indisponibilizar";
  hidePromoButton.className = "promo-availability-button unavailable";

  const availabilityActions = document.createElement("div");
  availabilityActions.className = "promo-availability-actions";
  hidePromoButton.parentNode.insertBefore(availabilityActions, hidePromoButton);
  availabilityActions.append(availableButton, hidePromoButton);

  function numericPromoPrice() {
    const value = Number(promoPrice.value);
    return Number.isFinite(value) ? value : 0;
  }

  function syncAvailabilityButtons() {
    const available = promoOrderEnabled.checked;
    availableButton.classList.toggle("is-active", available);
    hidePromoButton.classList.toggle("is-active", !available);
    availableButton.setAttribute("aria-pressed", available ? "true" : "false");
    hidePromoButton.setAttribute("aria-pressed", !available ? "true" : "false");
  }

  const previousUpdatePromoPreview = updatePromoPreview;
  updatePromoPreview = function () {
    previousUpdatePromoPreview();
    const price = numericPromoPrice();
    const available = promoOrderEnabled.checked && price > 0;
    previewPromoPrice.textContent = price > 0 ? money(price) : "";
    previewPromoPrice.hidden = price <= 0;
    previewPromoHint.textContent = available
      ? "Disponível: no site, o cliente pode tocar na promoção e ir direto para finalizar o pedido."
      : "Indisponível: a promoção continua visível no site, mas não aceita pedido até ser disponibilizada.";
    syncAvailabilityButtons();
  };

  const previousLoadPromotion = loadPromotion;
  loadPromotion = async function () {
    await previousLoadPromotion();
    try {
      const response = await fetch("/api/promo", { cache: "no-store" });
      if (!response.ok) return;
      const promo = await response.json();
      promoPrice.value = Number(promo.price || 0) > 0 ? Number(promo.price) : "";
      promoOrderEnabled.checked = Boolean(promo.orderEnabled);
      promoActive.checked = true;
      updatePromoPreview();
    } catch {}
  };

  // O parâmetro booleano é usado pelo botão antigo de ocultar, agora convertido
  // em Indisponibilizar. A promoção é sempre salva como visível no site.
  savePromotion = async function (availabilityOverride = null) {
    if (typeof availabilityOverride === "boolean") {
      promoOrderEnabled.checked = availabilityOverride;
    }

    const title = $("#promoTitle").value.trim();
    const price = numericPromoPrice();
    const available = promoOrderEnabled.checked;

    if (!title) {
      setStatus("#promoStatus", "Digite o título da promoção.", "error");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setStatus("#promoStatus", "Informe um valor maior que zero para a promoção.", "error");
      return;
    }

    setStatus("#promoStatus", available ? "Salvando promoção disponível..." : "Salvando promoção indisponível...");
    try {
      await api("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          active: true,
          title,
          description: $("#promoDescription").value.trim(),
          image: promoImageData,
          price,
          orderEnabled: available
        })
      });
      promoActive.checked = true;
      setStatus(
        "#promoStatus",
        available ? "Promoção disponível no site e pronta para receber pedidos." : "Promoção indisponível para pedidos, mas continua visível no site.",
        "ok"
      );
      updatePromoPreview();
    } catch (error) {
      setStatus("#promoStatus", error.message, "error");
    }
  };

  availableButton.addEventListener("click", () => savePromotion(true));

  [promoPrice, $("#promoTitle"), $("#promoDescription")].forEach((control) => {
    control.addEventListener("input", updatePromoPreview);
    control.addEventListener("change", updatePromoPreview);
  });

  const promoStatus = $("#promoStatus");
  const deleteObserver = new MutationObserver(() => {
    if (!promoStatus.textContent.includes("excluída definitivamente")) return;
    promoPrice.value = "";
    promoOrderEnabled.checked = true;
    promoActive.checked = true;
    updatePromoPreview();
  });
  deleteObserver.observe(promoStatus, { childList: true, characterData: true, subtree: true });

  promoOrderEnabled.checked = true;
  syncAvailabilityButtons();
})();