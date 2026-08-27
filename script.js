const products = [
  { id: 1, name: "X-Tudo", price: 15, description: "O mais completo da casa." },
  { id: 2, name: "X-Calabresa", price: 12, description: "Lanche com sabor marcante de calabresa." },
  { id: 3, name: "X-Bacon", price: 12, description: "Clássico com bacon." },
  { id: 4, name: "X-Salsicha", price: 12, description: "Lanche reforçado com salsicha." },
  { id: 5, name: "X-Banana", price: 12, description: "Uma combinação diferente e saborosa." },
  { id: 6, name: "X-Salada", price: 9, description: "Clássico, leve e bem montado." },
  { id: 7, name: "X-Burguer", price: 7, description: "Hambúrguer simples e direto ao ponto." },
  { id: 8, name: "X-Egg / X-Pio", price: 7, description: "Opção com ovo." },
  { id: 9, name: "Misto Duplo", price: 7, description: "Misto em versão dupla." },
  { id: 10, name: "Queijo Duplo", price: 6, description: "Para quem gosta de muito queijo." },
  { id: 11, name: "Hambúrguer", price: 5, description: "Hambúrguer tradicional." },
  { id: 12, name: "Misto Quente", price: 5, description: "O clássico misto quente." },
  { id: 13, name: "Misto Simples", price: 5, description: "Simples, rápido e saboroso." }
];

const WHATSAPP_NUMBER = "5592995159975";
const cart = new Map();

const $ = (selector) => document.querySelector(selector);
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const productsEl = $("#products");
const cartItemsEl = $("#cartItems");
const cartCountEl = $("#cartCount");
const cartTotalEl = $("#cartTotal");
const sheetTotalEl = $("#sheetTotal");
const checkoutTotalEl = $("#checkoutTotal");
const openCartBtn = $("#openCart");
const cartSheet = $("#cartSheet");
const sheetBackdrop = $("#sheetBackdrop");
const cartEmptyEl = $("#cartEmpty");
const goCheckoutBtn = $("#goCheckout");
const checkoutModal = $("#checkoutModal");
const checkoutBackdrop = $("#checkoutBackdrop");
const checkoutForm = $("#checkoutForm");
const paymentEl = $("#payment");
const changeWrap = $("#changeWrap");
const changeFor = $("#changeFor");
const addressFields = $("#addressFields");
const addressInput = $("#address");

function renderProducts() {
  productsEl.innerHTML = products.map((product, index) => `
    <article class="product-card">
      <div class="product-image" role="img" aria-label="Foto ilustrativa de lanche"></div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <span class="price">${money(product.price)}</span>
          <button class="add-button" type="button" data-add="${product.id}" aria-label="Adicionar ${product.name}">
            + Adicionar
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function cartDetails() {
  let count = 0;
  let total = 0;

  cart.forEach((qty, id) => {
    const product = products.find(item => item.id === id);
    if (!product) return;
    count += qty;
    total += product.price * qty;
  });

  return { count, total };
}

function renderCart() {
  const { count, total } = cartDetails();

  cartCountEl.textContent = count === 1 ? "1 item" : `${count} itens`;
  cartTotalEl.textContent = money(total);
  sheetTotalEl.textContent = money(total);
  checkoutTotalEl.textContent = money(total);
  goCheckoutBtn.disabled = count === 0;

  const entries = [...cart.entries()];

  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const product = products.find(item => item.id === id);
    return `
      <div class="cart-item">
        <div>
          <strong>${product.name}</strong>
          <small>${money(product.price)} cada</small>
          <div class="qty-control">
            <button type="button" data-minus="${id}" aria-label="Diminuir ${product.name}">−</button>
            <span>${qty}</span>
            <button type="button" data-plus="${id}" aria-label="Aumentar ${product.name}">+</button>
          </div>
        </div>
        <strong>${money(product.price * qty)}</strong>
      </div>
    `;
  }).join("");

  cartEmptyEl.hidden = count > 0;
}

function addItem(id) {
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
}

function changeQty(id, delta) {
  const next = (cart.get(id) || 0) + delta;
  if (next <= 0) cart.delete(id);
  else cart.set(id, next);
  renderCart();
}

function openCart() {
  cartSheet.classList.add("open");
  cartSheet.setAttribute("aria-hidden", "false");
  sheetBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartSheet.classList.remove("open");
  cartSheet.setAttribute("aria-hidden", "true");
  sheetBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function openCheckout() {
  closeCart();
  checkoutBackdrop.hidden = false;
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#customerName").focus();
}

function closeCheckout() {
  checkoutBackdrop.hidden = true;
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function getDeliveryType() {
  return document.querySelector('input[name="deliveryType"]:checked').value;
}

function syncDeliveryFields() {
  const isDelivery = getDeliveryType() === "Entrega";
  addressFields.hidden = !isDelivery;
  addressInput.required = isDelivery;
}

function syncPaymentFields() {
  const isCash = paymentEl.value === "Dinheiro";
  changeWrap.hidden = !isCash;
  if (!isCash) changeFor.value = "";
}

function buildWhatsAppMessage(formData) {
  const { total } = cartDetails();
  const deliveryType = formData.get("deliveryType");
  const payment = formData.get("payment");
  const lines = [];

  lines.push("🍔 *NOVO PEDIDO - LENDÁRIOS*");
  lines.push("");
  lines.push(`👤 *Cliente:* ${formData.get("customerName").trim()}`);
  lines.push(`🛵 *Recebimento:* ${deliveryType}`);

  if (deliveryType === "Entrega") {
    lines.push(`📍 *Endereço:* ${formData.get("address").trim()}`);
    const reference = formData.get("reference").trim();
    if (reference) lines.push(`📌 *Referência:* ${reference}`);
  }

  lines.push("");
  lines.push("*PEDIDO*");

  [...cart.entries()].forEach(([id, qty]) => {
    const product = products.find(item => item.id === id);
    lines.push(`${qty}x ${product.name} — ${money(product.price * qty)}`);
  });

  lines.push("");
  lines.push(`💰 *Total:* ${money(total)}`);
  lines.push(`💳 *Pagamento:* ${payment}`);

  if (payment === "Dinheiro") {
    const change = formData.get("changeFor").trim();
    lines.push(`💵 *Troco para:* ${change ? `R$ ${change}` : "não informado"}`);
  }

  const note = formData.get("orderNote").trim();
  if (note) {
    lines.push("");
    lines.push(`📝 *Observação:* ${note}`);
  }

  lines.push("");
  lines.push("Pedido feito pelo cardápio digital.");

  return lines.join("\n");
}

productsEl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  addItem(Number(button.dataset.add));
  button.textContent = "Adicionado ✓";
  window.setTimeout(() => {
    button.textContent = "+ Adicionar";
  }, 900);
});

cartItemsEl.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-plus]");
  const minus = event.target.closest("[data-minus]");
  if (plus) changeQty(Number(plus.dataset.plus), 1);
  if (minus) changeQty(Number(minus.dataset.minus), -1);
});

openCartBtn.addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
sheetBackdrop.addEventListener("click", closeCart);
goCheckoutBtn.addEventListener("click", openCheckout);
$("#closeCheckout").addEventListener("click", closeCheckout);
checkoutBackdrop.addEventListener("click", closeCheckout);

document.querySelectorAll('input[name="deliveryType"]').forEach((input) => {
  input.addEventListener("change", syncDeliveryFields);
});

paymentEl.addEventListener("change", syncPaymentFields);

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (cart.size === 0) {
    closeCheckout();
    openCart();
    return;
  }

  syncDeliveryFields();

  if (!checkoutForm.reportValidity()) return;

  const formData = new FormData(checkoutForm);
  const message = buildWhatsAppMessage(formData);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
});

renderProducts();
renderCart();
syncDeliveryFields();
syncPaymentFields();
