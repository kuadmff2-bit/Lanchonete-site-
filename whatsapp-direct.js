// Abre o WhatsApp diretamente no app quando possível, evitando a página intermediária do WhatsApp Web.
(() => {
  if (!checkoutForm) return;

  function whatsappDirectUrl(number, message) {
    const encoded = encodeURIComponent(message);
    const isAndroid = /Android/i.test(navigator.userAgent || "");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");

    if (isAndroid) {
      return `intent://send?phone=${number}&text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
    }

    if (isMobile) {
      return `whatsapp://send?phone=${number}&text=${encoded}`;
    }

    return `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`;
  }

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (cart.size === 0) {
      closeCheckout();
      openCart();
      return;
    }

    syncDeliveryFields();
    if (!checkoutForm.reportValidity()) return;

    const formData = new FormData(checkoutForm);
    const originalText = checkoutButton.textContent;
    checkoutButton.disabled = true;
    checkoutButton.textContent = "Registrando pedido...";

    try {
      const registeredOrder = await registerOrder(formData);
      const message = buildWhatsAppMessage(formData, registeredOrder);
      const whatsappUrl = whatsappDirectUrl(WHATSAPP_NUMBER, message);

      checkoutButton.textContent = `Pedido ${registeredOrder.id} registrado`;

      cart.clear();
      checkoutForm.reset();
      renderCart();
      syncDeliveryFields();
      syncPaymentFields();
      closeCheckout();

      // Navega direto para o esquema do aplicativo. Em alguns navegadores Android
      // pode aparecer apenas a confirmação de abrir o WhatsApp, mas não a página web intermediária.
      window.location.href = whatsappUrl;
    } catch (error) {
      alert(error.message || "Não foi possível registrar o pedido.");
    } finally {
      checkoutButton.disabled = false;
      checkoutButton.textContent = originalText;
    }
  }, true);
})();
