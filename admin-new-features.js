(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const moneyText = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const escapeText = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

  function installStyles() {
    if (q("#adminNewFeaturesStyle")) return;
    const style = document.createElement("style");
    style.id = "adminNewFeaturesStyle";
    style.textContent = `
      .share-menu-card{margin:16px 0 18px;padding:16px 18px;border:1px solid var(--line);border-radius:18px;background:var(--card,var(--surface));display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .share-menu-copy strong,.share-menu-copy small{display:block}.share-menu-copy strong{color:var(--text);font-size:16px}.share-menu-copy small{margin-top:4px;color:var(--muted);word-break:break-all}.share-menu-button{min-height:44px;padding:0 17px;border:0;border-radius:12px;background:var(--brand-primary,var(--orange));color:var(--brand-on-primary,#fff);font-weight:900;cursor:pointer}.share-menu-feedback{width:100%;margin:0;color:var(--muted);font-size:12px}.share-menu-feedback.ok{color:#15803d}
      .promo-v2-shell{display:grid;gap:18px}.promo-v2-form-grid{display:grid;grid-template-columns:1fr 180px;gap:14px}.promo-v2-form-grid .full{grid-column:1/-1}.promo-v2-image-preview{width:min(100%,430px);aspect-ratio:1/1;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card2,var(--surface2));display:grid;place-items:center;color:var(--muted)}.promo-v2-image-preview img{width:100%;height:100%;display:block;object-fit:cover}.promo-v2-image-preview span{padding:20px;text-align:center}.promo-v2-image-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.promo-v2-toggles{display:flex;gap:18px;flex-wrap:wrap}.promo-v2-toggles label{display:flex;align-items:center;gap:8px}.promo-v2-form-actions{display:flex;gap:10px;flex-wrap:wrap}.promo-v2-list{display:grid;gap:12px}.promo-v2-item{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;padding:14px;border:1px solid var(--line);border-radius:18px;background:var(--card,var(--surface));align-items:start}.promo-v2-thumb{width:96px;aspect-ratio:1/1;border-radius:14px;overflow:hidden;background:var(--card2,var(--surface2));display:grid;place-items:center;color:var(--muted);font-size:11px;text-align:center}.promo-v2-thumb img{width:100%;height:100%;object-fit:cover}.promo-v2-main strong{display:block;color:var(--text);font-size:16px}.promo-v2-main small{display:block;margin-top:4px;color:var(--muted)}.promo-v2-price{margin-top:7px;color:var(--text);font-weight:900}.promo-v2-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.promo-v2-badge{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900}.promo-v2-badge.on{background:#dcfce7;color:#166534}.promo-v2-badge.off{background:#fee2e2;color:#991b1b}.promo-v2-actions{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.promo-v2-actions button{min-height:40px;border:1px solid var(--line);border-radius:10px;background:var(--card2,var(--surface2));color:var(--text);font-weight:800;cursor:pointer}.promo-v2-actions .danger{color:#dc2626}.promo-v2-preview-card{margin-top:8px;width:min(100%,430px);border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card,var(--surface))}.promo-v2-preview-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}.promo-v2-preview-copy{padding:16px}.promo-v2-preview-copy span{color:var(--brand-primary,var(--orange));font-size:11px;font-weight:900;letter-spacing:.12em}.promo-v2-preview-copy strong,.promo-v2-preview-copy p{display:block}.promo-v2-preview-copy strong{margin-top:6px;color:var(--text);font-size:20px}.promo-v2-preview-copy p{margin:7px 0;color:var(--muted)}
      body.admin-view .admin-product-image{width:96px!important;height:96px!important;aspect-ratio:1/1!important;border-radius:14px!important;overflow:hidden!important;display:grid!important;place-items:center!important}
      body.admin-view .admin-product-image img{width:100%!important;height:100%!important;object-fit:cover!important}
      body.admin-view .image-preview{width:min(100%,430px);aspect-ratio:1/1!important;overflow:hidden}
      body.admin-view .image-preview img{width:100%!important;height:100%!important;object-fit:cover!important}
      @media(max-width:700px){.promo-v2-form-grid{grid-template-columns:1fr}.promo-v2-form-grid .full{grid-column:auto}.promo-v2-actions{grid-template-columns:1fr 1fr}.share-menu-button{width:100%}.promo-v2-item{grid-template-columns:82px minmax(0,1fr)}.promo-v2-thumb{width:82px}}
    `;
    document.head.appendChild(style);
  }

  function publicMenuUrl() {
    const url = new URL(location.href);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch {}
    }
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    input.remove();
    return ok;
  }

  function installShareButton() {
    const adminApp = q("#adminApp");
    const header = adminApp?.querySelector(".admin-head");
    if (!adminApp || !header || q("#shareMenuCard")) return;
    const url = publicMenuUrl();
    const card = document.createElement("section");
    card.id = "shareMenuCard";
    card.className = "share-menu-card";
    card.innerHTML = `
      <div class="share-menu-copy"><strong>Link do cardápio</strong><small>${escapeText(url)}</small></div>
      <button type="button" class="share-menu-button" id="copyMenuLink">Copiar link do cardápio</button>
      <p class="share-menu-feedback" id="copyMenuFeedback" aria-live="polite"></p>`;
    header.insertAdjacentElement("afterend", card);
    q("#copyMenuLink", card).addEventListener("click", async () => {
      const feedback = q("#copyMenuFeedback", card);
      const ok = await copyText(url);
      feedback.className = `share-menu-feedback${ok ? " ok" : ""}`;
      feedback.textContent = ok ? "Link copiado. Agora é só colar e enviar para o cliente." : "Não foi possível copiar automaticamente. Toque e segure o endereço acima para copiar.";
    });
  }

  function removeBackgroundCustomization() {
    const input = q("#brandBackgroundInput");
    input?.closest(".branding-upload")?.remove();
    const intro = q(".branding-intro");
    if (intro) intro.textContent = "Troque nome, textos, logo e imagem de capa. A paleta original permanece fixa para garantir boa leitura nos modos claro e escuro.";
  }

  function forceSquareImageEditor() {
    const aspect = q("#editorAspect");
    if (aspect) {
      aspect.innerHTML = '<option value="1:1">Quadrado (1:1)</option>';
      aspect.value = "1:1";
      aspect.disabled = true;
    }
    if (typeof openImageEditor === "function" && !openImageEditor.__squareOnly) {
      const original = openImageEditor;
      const square = function (src, options = {}) {
        return original(src, { ...options, aspect: "1:1" });
      };
      square.__squareOnly = true;
      openImageEditor = square;
    }
  }

  let promotions = [];
  let editingPromoId = "";
  let promoImage = "";

  function normalizePromo(item, index) {
    const price = Number(item?.price || 0);
    return {
      id: String(item?.id || `PROMO-${Date.now()}-${index}`).slice(0, 100),
      title: String(item?.title || "").trim().slice(0, 80),
      description: String(item?.description || "").trim().slice(0, 240),
      image: String(item?.image || ""),
      price: Number.isFinite(price) ? Math.max(0, Math.min(price, 10000)) : 0,
      active: item?.active !== false,
      orderEnabled: item?.orderEnabled !== false
    };
  }

  function promoManagerElements() {
    return {
      form: q("#promoV2Form"), title: q("#promoV2Title"), description: q("#promoV2Description"), price: q("#promoV2Price"),
      visible: q("#promoV2Visible"), available: q("#promoV2Available"), file: q("#promoV2Image"), imagePreview: q("#promoV2ImagePreview"),
      imageTools: q("#promoV2ImageTools"), fileName: q("#promoV2FileName"), status: q("#promoStatus"), save: q("#promoV2Save"),
      cancel: q("#promoV2Cancel"), list: q("#promoV2List"), count: q("#promoV2Count"), live: q("#promoV2Live")
    };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  async function editSquareImage(src, title, callback) {
    if (!src) return;
    if (typeof openImageEditor === "function") {
      await openImageEditor(src, { title, aspect: "1:1", onSave: callback });
      return;
    }
    callback(src);
  }

  function setPromoStatus(message, type = "") {
    const el = q("#promoStatus");
    if (!el) return;
    el.textContent = message;
    el.className = `status ${type}`.trim();
  }

  function updatePromoFormPreview() {
    const el = promoManagerElements();
    if (!el.form) return;
    const hasImage = Boolean(promoImage);
    el.imagePreview.innerHTML = hasImage ? `<img src="${promoImage}" alt="Prévia quadrada da promoção">` : "<span>Sem imagem</span>";
    el.imageTools.hidden = !hasImage;
    el.fileName.textContent = hasImage ? "Imagem quadrada pronta" : "JPG, PNG ou WEBP";
    const title = el.title.value.trim() || "Título da promoção";
    const description = el.description.value.trim() || "Descrição da promoção";
    const price = Number(el.price.value || 0);
    el.live.innerHTML = `${hasImage ? `<img src="${promoImage}" alt="">` : ""}<div class="promo-v2-preview-copy"><span>PROMOÇÃO</span><strong>${escapeText(title)}</strong><p>${escapeText(description)}</p><strong>${price > 0 ? moneyText(price) : ""}</strong></div>`;
  }

  function resetPromoForm() {
    const el = promoManagerElements();
    if (!el.form) return;
    editingPromoId = "";
    promoImage = "";
    el.form.reset();
    el.visible.checked = true;
    el.available.checked = true;
    el.save.textContent = "Adicionar promoção";
    el.cancel.hidden = true;
    updatePromoFormPreview();
  }

  function renderPromoList() {
    const el = promoManagerElements();
    if (!el.list) return;
    el.count.textContent = promotions.length === 1 ? "1 promoção" : `${promotions.length} promoções`;
    if (!promotions.length) {
      el.list.innerHTML = '<p class="empty-admin">Nenhuma promoção cadastrada.</p>';
      return;
    }
    el.list.innerHTML = promotions.map((promo) => `
      <article class="promo-v2-item" data-promo-id="${escapeText(promo.id)}">
        <div class="promo-v2-thumb">${promo.image ? `<img src="${promo.image}" alt="${escapeText(promo.title)}">` : "Sem foto"}</div>
        <div class="promo-v2-main">
          <strong>${escapeText(promo.title || "Promoção")}</strong>
          <small>${escapeText(promo.description || "Sem descrição")}</small>
          <div class="promo-v2-price">${moneyText(promo.price)}</div>
          <div class="promo-v2-badges">
            <span class="promo-v2-badge ${promo.active ? "on" : "off"}">${promo.active ? "VISÍVEL" : "OCULTA"}</span>
            <span class="promo-v2-badge ${promo.orderEnabled ? "on" : "off"}">${promo.orderEnabled ? "DISPONÍVEL" : "INDISPONÍVEL"}</span>
          </div>
        </div>
        <div class="promo-v2-actions">
          <button type="button" data-promo-edit="${escapeText(promo.id)}">Editar</button>
          <button type="button" data-promo-toggle-order="${escapeText(promo.id)}">${promo.orderEnabled ? "Indisponibilizar" : "Disponibilizar"}</button>
          <button type="button" data-promo-toggle-visible="${escapeText(promo.id)}">${promo.active ? "Ocultar" : "Mostrar"}</button>
          <button type="button" class="danger" data-promo-delete="${escapeText(promo.id)}">Excluir</button>
        </div>
      </article>`).join("");
  }

  async function savePromoList(message) {
    setPromoStatus("Salvando...");
    const data = await api("/api/promos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ promotions })
    });
    promotions = Array.isArray(data?.promotions) ? data.promotions.map(normalizePromo) : promotions;
    renderPromoList();
    setPromoStatus(message, "ok");
  }

  async function loadPromotionsManager() {
    try {
      const response = await fetch("/api/promos", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar as promoções.");
      const data = await response.json();
      promotions = Array.isArray(data?.promotions) ? data.promotions.map(normalizePromo) : [];
      renderPromoList();
      if (!editingPromoId) resetPromoForm();
      return data;
    } catch (error) {
      setPromoStatus(error.message || "Não foi possível carregar as promoções.", "error");
      return null;
    }
  }

  function editPromotion(id) {
    const promo = promotions.find((item) => String(item.id) === String(id));
    if (!promo) return;
    const el = promoManagerElements();
    editingPromoId = String(promo.id);
    promoImage = promo.image || "";
    el.title.value = promo.title || "";
    el.description.value = promo.description || "";
    el.price.value = Number(promo.price || 0) > 0 ? Number(promo.price) : "";
    el.visible.checked = promo.active !== false;
    el.available.checked = promo.orderEnabled !== false;
    el.save.textContent = "Salvar alterações";
    el.cancel.hidden = false;
    updatePromoFormPreview();
    el.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function installPromoManager() {
    const tab = q("#tab-promo");
    const card = tab?.querySelector(".promo-admin-card");
    if (!tab || !card || q("#promoV2Form")) return;
    const heading = tab.querySelector(".panel-heading h2");
    if (heading) heading.textContent = "Promoções";

    card.innerHTML = `
      <div class="promo-v2-shell">
        <form id="promoV2Form">
          <div class="card-title"><h3 id="promoV2FormTitle">Adicionar promoção</h3><span>imagens em formato quadrado</span></div>
          <div class="promo-v2-form-grid">
            <label class="full">Título da promoção<input id="promoV2Title" type="text" maxlength="80" placeholder="Ex.: 3 X-Saladas + refrigerante" required></label>
            <label>Valor da promoção<input id="promoV2Price" type="number" min="0" max="10000" step="0.01" inputmode="decimal" placeholder="20,00" required></label>
            <div></div>
            <label class="full">Descrição<textarea id="promoV2Description" rows="3" maxlength="240" placeholder="Ex.: Oferta especial válida hoje."></textarea></label>
            <div class="full image-field">
              <span class="field-title">Foto da promoção · quadrada (1:1)</span>
              <input class="native-file-input" id="promoV2Image" type="file" accept="image/jpeg,image/png,image/webp">
              <label class="image-picker" for="promoV2Image"><span class="image-picker-plus">+</span><span class="image-picker-text"><strong>Selecionar uma imagem</strong><small id="promoV2FileName">JPG, PNG ou WEBP</small></span><span class="image-picker-arrow">›</span></label>
              <div class="promo-v2-image-actions" id="promoV2ImageTools" hidden>
                <button type="button" class="secondary-small" id="promoV2EditImage">Editar imagem</button>
                <button type="button" class="secondary-small danger-outline" id="promoV2RemoveImage">Remover imagem</button>
              </div>
            </div>
            <div class="full promo-v2-image-preview" id="promoV2ImagePreview"><span>Sem imagem</span></div>
            <div class="full promo-v2-toggles">
              <label><input id="promoV2Visible" type="checkbox" checked> Mostrar no cardápio</label>
              <label><input id="promoV2Available" type="checkbox" checked> Disponível para pedido</label>
            </div>
            <div class="full promo-v2-preview-card" id="promoV2Live"></div>
            <div class="full promo-v2-form-actions">
              <button type="submit" class="save-button" id="promoV2Save">Adicionar promoção</button>
              <button type="button" class="secondary-button" id="promoV2Cancel" hidden>Cancelar edição</button>
            </div>
            <p class="status full" id="promoStatus" aria-live="polite"></p>
          </div>
        </form>
        <section>
          <div class="card-title"><h3>Promoções cadastradas</h3><span id="promoV2Count">0 promoções</span></div>
          <div class="promo-v2-list" id="promoV2List"></div>
        </section>
      </div>`;

    const el = promoManagerElements();
    [el.title, el.description, el.price, el.visible, el.available].forEach((control) => {
      control.addEventListener("input", updatePromoFormPreview);
      control.addEventListener("change", updatePromoFormPreview);
    });

    el.file.addEventListener("change", async () => {
      const file = el.file.files?.[0];
      if (!file) return;
      setPromoStatus("Preparando imagem quadrada...");
      try {
        const src = await readFile(file);
        await editSquareImage(src, "Ajustar foto quadrada da promoção", (edited) => {
          promoImage = edited;
          updatePromoFormPreview();
          setPromoStatus("Imagem pronta. Salve a promoção para aplicar.", "ok");
        });
      } catch (error) {
        setPromoStatus(error.message || "Não foi possível abrir a imagem.", "error");
      } finally {
        el.file.value = "";
      }
    });

    q("#promoV2EditImage").addEventListener("click", async () => {
      if (!promoImage) return setPromoStatus("Selecione uma imagem primeiro.", "error");
      await editSquareImage(promoImage, "Editar foto quadrada da promoção", (edited) => {
        promoImage = edited;
        updatePromoFormPreview();
        setPromoStatus("Imagem editada. Salve a promoção para aplicar.", "ok");
      });
    });

    q("#promoV2RemoveImage").addEventListener("click", () => {
      promoImage = "";
      updatePromoFormPreview();
      setPromoStatus("Imagem removida. Salve a promoção para aplicar.");
    });

    el.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = el.title.value.trim();
      const price = Number(el.price.value);
      if (!title) return setPromoStatus("Digite o título da promoção.", "error");
      if (!Number.isFinite(price) || price <= 0) return setPromoStatus("Informe um valor maior que zero.", "error");
      const next = normalizePromo({
        id: editingPromoId || `PROMO-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        title,
        description: el.description.value.trim(),
        price,
        image: promoImage,
        active: el.visible.checked,
        orderEnabled: el.available.checked
      }, promotions.length);
      if (editingPromoId) promotions = promotions.map((promo) => String(promo.id) === editingPromoId ? next : promo);
      else promotions.push(next);
      try {
        await savePromoList(editingPromoId ? "Promoção atualizada." : "Promoção adicionada.");
        resetPromoForm();
      } catch (error) {
        setPromoStatus(error.message || "Não foi possível salvar a promoção.", "error");
      }
    });

    el.cancel.addEventListener("click", resetPromoForm);
    el.list.addEventListener("click", async (event) => {
      const edit = event.target.closest("[data-promo-edit]");
      const toggleOrder = event.target.closest("[data-promo-toggle-order]");
      const toggleVisible = event.target.closest("[data-promo-toggle-visible]");
      const remove = event.target.closest("[data-promo-delete]");
      if (edit) return editPromotion(edit.dataset.promoEdit);
      if (toggleOrder) {
        const id = toggleOrder.dataset.promoToggleOrder;
        promotions = promotions.map((promo) => String(promo.id) === id ? { ...promo, orderEnabled: !promo.orderEnabled } : promo);
        try { await savePromoList("Disponibilidade atualizada."); } catch (error) { setPromoStatus(error.message, "error"); }
        return;
      }
      if (toggleVisible) {
        const id = toggleVisible.dataset.promoToggleVisible;
        promotions = promotions.map((promo) => String(promo.id) === id ? { ...promo, active: !promo.active } : promo);
        try { await savePromoList("Visibilidade atualizada."); } catch (error) { setPromoStatus(error.message, "error"); }
        return;
      }
      if (remove) {
        const id = remove.dataset.promoDelete;
        const promo = promotions.find((item) => String(item.id) === id);
        if (!promo || !confirm(`Excluir a promoção ${promo.title}?`)) return;
        promotions = promotions.filter((item) => String(item.id) !== id);
        try {
          await savePromoList("Promoção excluída.");
          if (editingPromoId === id) resetPromoForm();
        } catch (error) { setPromoStatus(error.message, "error"); }
      }
    });

    resetPromoForm();
    loadPromotionsManager();
    try { loadPromotion = loadPromotionsManager; } catch {}
  }

  function init() {
    installStyles();
    installShareButton();
    removeBackgroundCustomization();
    forceSquareImageEditor();
    installPromoManager();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
