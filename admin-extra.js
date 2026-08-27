// Complementos do painel administrativo.
// Este arquivo roda depois de admin.js e adiciona ações rápidas sem duplicar a lógica principal.

renderProductList = function () {
  $("#productCount").textContent = products.length === 1 ? "1 produto" : `${products.length} produtos`;
  $("#productList").innerHTML = products.length ? products.map((product) => `
    <article class="admin-product">
      <div class="admin-product-image">${product.image ? `<img src="${product.image}" alt="${esc(product.name)}">` : "Sem foto"}</div>
      <div class="admin-product-main">
        <strong>${esc(product.name)}</strong>
        <small>${product.category === "bebida" ? "Bebida" : "Lanche"} · ${money(product.price)}</small>
        <span class="availability ${product.available === false ? "off" : "on"}">${product.available === false ? "INDISPONÍVEL" : "DISPONÍVEL"}</span>
      </div>
      <div class="product-actions">
        <button type="button" data-photo-product="${esc(product.id)}">Trocar foto</button>
        <button type="button" data-toggle-product="${esc(product.id)}">${product.available === false ? "Disponibilizar" : "Indisponibilizar"}</button>
        <button type="button" data-edit-product="${esc(product.id)}">Editar</button>
        <button type="button" class="danger" data-delete-product="${esc(product.id)}">Excluir</button>
      </div>
    </article>`).join("") : '<p class="empty-admin">Nenhum produto cadastrado.</p>';
};

$("#productList").addEventListener("click", (event) => {
  const photoButton = event.target.closest("[data-photo-product]");
  if (!photoButton) return;

  const id = photoButton.dataset.photoProduct;
  const product = products.find((item) => String(item.id) === id);
  if (!product) return;

  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.style.display = "none";
  document.body.appendChild(picker);

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file) {
      picker.remove();
      return;
    }

    setStatus("#productStatus", `Preparando nova foto de ${product.name}...`);
    const previousImage = product.image || "";

    try {
      const image = await compressImage(file, 800, 0.66);
      products = products.map((item) => String(item.id) === id ? { ...item, image } : item);
      const saved = await saveProducts("Foto do produto atualizada.");
      if (!saved) {
        products = products.map((item) => String(item.id) === id ? { ...item, image: previousImage } : item);
        renderProductList();
      }
    } catch (error) {
      setStatus("#productStatus", error.message || "Não foi possível trocar a foto.", "error");
    } finally {
      picker.remove();
    }
  }, { once: true });

  picker.click();
});
