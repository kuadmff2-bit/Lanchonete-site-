// Múltiplas promoções clicáveis com valor fixo definido pelo administrador.
(() => {
  const PROMO_CART_KEY = "__promotion_order__";
  const promoSection = $("#promoSection");
  const selectedPromoBox = $("#selectedPromoBox");
  const selectedPromoTitle = $("#selectedPromoTitle");
  const selectedPromoPrice = $("#selectedPromoPrice");

  let promotions = [];
  let selectedPromotion = null;

  function promotionSelected() {
    return Boolean(selectedPromotion?.id && selectedPromotion?.orderEnabled && cart.has(PROMO_CART_KEY));
  }

  function syncSelectedPromoBox() {
    const selected = promotionSelected();
    if (!selectedPromoBox) return;
    selectedPromoBox.hidden = !selected;
    if (!selected) return;
    selectedPromoTitle.textContent = selectedPromotion.title || "Promoção";
    selectedPromoPrice.textContent = money(selectedPromotion.price);
  }

  const originalCartDetails = cartDetails;
  cartDetails = function () {
    const details = originalCartDetails();
    if (promotionSelected()) {
      details.count += 1;
      details.total = Number((details.total + Number(selectedPromotion.price || 0)).toFixed(2));
    }
    return details;
  };

  const originalOrderItems = orderItems;
  orderItems = function () {
    const items = originalOrderItems();
    if (promotionSelected()) {
      items.unshift({
        id: PROMO_CART_KEY,
        name: `Promoção: ${selectedPromotion.title}`,
        qty: 1,
        price: Number(selectedPromotion.price || 0),
        isPromotion: true,
        promotionId: selectedPromotion.id
      });
    }
    return items;
  };

  const originalRenderCart = renderCart;
  renderCart = function () {
    originalRenderCart();
    if (promotionSelected()) {
      cartItemsEl.insertAdjacentHTML("afterbegin", `
        <div class="cart-item promo-cart-item">
          <div>
            <span class="promo-cart-label">PROMOÇÃO</span>
            <strong>${esc(selectedPromotion.title || "Promoção")}</strong>
            <small>Valor promocional fixo</small>
            <button class="remove-promo-button" type="button" data-remove-promo>Remover promoção</button>
          </div>
          <strong>${money(selectedPromotion.price)}</strong>
        </div>`);
    }
    syncSelectedPromoBox();
  };

  registerOrder = async function (formData) {
    const regularItems = [...cart.entries()].map(([id, qty]) => {
      if (String(id) === PROMO_CART_KEY) return null;
      const product = products.find((item) => String(item.id) === String(id));
      return product ? { id: String(product.id), name: product.name, qty } : null;
    }).filter(Boolean);

    const payload = {
      clientOrderId: clientOrderId(),
      localDate: localDateKey(),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      payment: formData.get("payment"),
      deliveryType: formData.get("deliveryType"),
      address: formData.get("address") || "",
      reference: formData.get("reference") || "",
      changeFor: formData.get("changeFor") || "",
      note: formData.get("orderNote") || "",
      promoId: promotionSelected() ? String(selectedPromotion.id) : "",
      items: regularItems
    };

    const data = await submitOrderPayload(payload);
    return Object.assign(data.order, { _messaging: data.messaging || null });
  };

  function normalizedPromotions(data) {
    const list = Array.isArray(data?.promotions) ? data.promotions : [];
    return list.filter((promo) => promo?.active && (promo.image || promo.title || promo.description)).map((promo) => ({
      ...promo,
      id: String(promo.id || ""),
      price: Number(promo.price || 0),
      orderEnabled: Boolean(promo.orderEnabled && Number(promo.price || 0) > 0)
    }));
  }

  function renderPromotions() {
    if (!promoSection) return;
    if (!promotions.length) {
      promoSection.hidden = true;
      selectedPromotion = null;
      cart.delete(PROMO_CART_KEY);
      renderCart();
      return;
    }

    promoSection.innerHTML = `<div class="promo-list">${promotions.map((promo) => {
      const price = Number(promo.price || 0);
      const hasPrice = Number.isFinite(price) && price > 0;
      const orderable = Boolean(promo.orderEnabled && hasPrice);
      return `
        <article class="promo-card ${orderable ? "promo-orderable" : "promo-unavailable"}" data-promo-id="${esc(promo.id)}" ${orderable ? `role="button" tabindex="0" aria-label="Pedir ${esc(promo.title || "promoção")} por ${esc(money(price))}"` : ""}>
          ${promo.image ? `<img class="promo-image" src="${promo.image}" alt="${esc(promo.title || "Imagem da promoção")}">` : `<div class="promo-image promo-image-empty">PROMOÇÃO</div>`}
          <div class="promo-content">
            <span class="promo-label">PROMOÇÃO</span>
            <h2>${esc(promo.title || "Promoção")}</h2>
            <p>${esc(promo.description || "")}</p>
            <div class="promo-order-meta">
              ${hasPrice ? `<strong class="promo-order-price">${money(price)}</strong>` : ""}
              <button class="promo-order-button" type="button" data-promo-order="${esc(promo.id)}" ${orderable ? "" : "disabled"}>${orderable ? `Pedir esta promoção · ${money(price)}` : "Promoção indisponível"}</button>
              <small class="promo-order-hint">${orderable ? "Toque na promoção para ir direto ao pedido." : "Esta promoção está visível, mas indisponível para pedidos no momento."}</small>
            </div>
          </div>
        </article>`;
    }).join("")}</div>`;
    promoSection.hidden = false;
  }

  loadPromotion = async function () {
    try {
      let response = await fetch("/api/promos", { cache: "no-store" });
      if (!response.ok) throw new Error("promos");
      const data = await response.json();
      promotions = normalizedPromotions(data);

      if (selectedPromotion) {
        const fresh = promotions.find((promo) => promo.id === selectedPromotion.id && promo.orderEnabled);
        if (fresh) selectedPromotion = fresh;
        else {
          selectedPromotion = null;
          cart.delete(PROMO_CART_KEY);
        }
      }

      renderPromotions();
      renderCart();
    } catch {
      // Compatibilidade com instalações ainda em migração.
      try {
        const response = await fetch("/api/promo", { cache: "no-store" });
        const promo = response.ok ? await response.json() : null;
        promotions = promo?.active ? normalizedPromotions({ promotions: [promo] }) : [];
        renderPromotions();
        renderCart();
      } catch {
        promotions = [];
        renderPromotions();
      }
    }
  };

  function choosePromotion(id) {
    const promo = promotions.find((item) => item.id === String(id));
    if (!promo?.orderEnabled) return;
    selectedPromotion = promo;
    cart.set(PROMO_CART_KEY, 1);
    renderCart();
    openCheckout();
  }

  promoSection?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-promo-order]");
    const card = event.target.closest("[data-promo-id]");
    const id = button?.dataset.promoOrder || card?.dataset.promoId;
    if (!id) return;
    event.preventDefault();
    choosePromotion(id);
  });

  promoSection?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-promo-id]");
    if (!card) return;
    event.preventDefault();
    choosePromotion(card.dataset.promoId);
  });

  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-promo]");
    if (!remove) return;
    event.preventDefault();
    event.stopPropagation();
    selectedPromotion = null;
    cart.delete(PROMO_CART_KEY);
    renderCart();
  });

  loadPromotion();
})();
