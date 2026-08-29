// Campos extras da promoção usados pelo site para pedido direto.
(() => {
  const promoPrice = $("#promoPrice");
  const promoOrderEnabled = $("#promoOrderEnabled");
  const previewPromoPrice = $("#previewPromoPrice");
  const previewPromoHint = $("#previewPromoHint");

  function numericPromoPrice() {
    const value = Number(promoPrice.value);
    return Number.isFinite(value) ? value : 0;
  }

  const previousUpdatePromoPreview = updatePromoPreview;
  updatePromoPreview = function () {
    previousUpdatePromoPreview();
    const price = numericPromoPrice();
    const clickable = promoOrderEnabled.checked && price > 0;
    previewPromoPrice.textContent = price > 0 ? money(price) : "";
    previewPromoPrice.hidden = price <= 0;
    previewPromoHint.textContent = clickable
      ? "No site, o cliente poderá tocar na promoção e ir direto para finalizar o pedido."
      : "Ative o pedido direto e informe um valor para tornar a promoção clicável.";
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
      updatePromoPreview();
    } catch {}
  };

  savePromotion = async function (activeOverride = null) {
    const active = activeOverride === null ? $("#promoActive").checked : activeOverride;
    const title = $("#promoTitle").value.trim();
    const price = numericPromoPrice();
    const orderEnabled = promoOrderEnabled.checked;

    if (active && !title) {
      setStatus("#promoStatus", "Digite o título da promoção.", "error");
      return;
    }
    if (orderEnabled && (!Number.isFinite(price) || price <= 0)) {
      setStatus("#promoStatus", "Informe um valor maior que zero para o pedido direto.", "error");
      return;
    }

    setStatus("#promoStatus", "Salvando...");
    try {
      await api("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          active,
          title,
          description: $("#promoDescription").value.trim(),
          image: promoImageData,
          price,
          orderEnabled
        })
      });
      $("#promoActive").checked = active;
      setStatus("#promoStatus", active ? "Promoção publicada." : "Promoção ocultada.", "ok");
      updatePromoPreview();
    } catch (error) {
      setStatus("#promoStatus", error.message, "error");
    }
  };

  [promoPrice, promoOrderEnabled, $("#promoTitle"), $("#promoDescription")].forEach((control) => {
    control.addEventListener("input", updatePromoPreview);
    control.addEventListener("change", updatePromoPreview);
  });

  const promoStatus = $("#promoStatus");
  const deleteObserver = new MutationObserver(() => {
    if (!promoStatus.textContent.includes("excluída definitivamente")) return;
    promoPrice.value = "";
    promoOrderEnabled.checked = false;
    updatePromoPreview();
  });
  deleteObserver.observe(promoStatus, { childList: true, characterData: true, subtree: true });
})();