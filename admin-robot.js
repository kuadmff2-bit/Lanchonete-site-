(() => {
  const DEFAULTS = {
    enabled: false,
    greeting: 'Olá! 👋 Sou o atendimento automático da lanchonete. Como posso ajudar?',
    fallback: 'Não consegui entender sua mensagem. Digite *menu* para ver as opções ou aguarde um atendente.',
    humanHandoff: true,
    businessHoursOnly: false,
    openTime: '18:00',
    closeTime: '23:59',
    menuText: '1 - Ver cardápio\n2 - Fazer pedido\n3 - Acompanhar pedido\n4 - Falar com atendente',
    updatedAt: null
  };

  const STORAGE_KEY = 'lanchonete_robot_settings_v1';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function saveSettings(settings) {
    const next = { ...DEFAULTS, ...settings, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('lanchonete-robot-settings', { detail: next }));
    return next;
  }

  function isWithinBusinessHours(settings = loadSettings(), now = new Date()) {
    if (!settings.businessHoursOnly) return true;
    const [oh, om] = String(settings.openTime || '00:00').split(':').map(Number);
    const [ch, cm] = String(settings.closeTime || '23:59').split(':').map(Number);
    const current = now.getHours() * 60 + now.getMinutes();
    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    return open <= close ? current >= open && current <= close : current >= open || current <= close;
  }

  function getReply(message, settings = loadSettings()) {
    if (!settings.enabled) return null;
    if (!isWithinBusinessHours(settings)) return 'Olá! Nosso atendimento automático está fora do horário configurado. Assim que possível, um atendente continuará com você.';

    const text = String(message || '').trim().toLowerCase();
    if (!text) return settings.greeting;

    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|menu|iniciar|começar|comecar)$/.test(text)) {
      return `${settings.greeting}\n\n${settings.menuText}`;
    }
    if (/^(1|cardápio|cardapio|menu de produtos|produtos)$/.test(text)) {
      return 'Você pode conferir os produtos disponíveis diretamente no nosso cardápio. Se quiser, diga o nome de um produto para eu tentar ajudar.';
    }
    if (/^(2|pedido|fazer pedido|quero pedir|comprar)$/.test(text)) {
      return 'Perfeito! Escolha os itens no cardápio e finalize o pedido. Se precisar de ajuda durante o pedido, é só me chamar.';
    }
    if (/^(3|acompanhar|acompanhar pedido|status|meu pedido)$/.test(text)) {
      return 'Para acompanhar seu pedido, informe o número ou nome usado no pedido.';
    }
    if (/^(4|atendente|humano|falar com atendente|secretaria|suporte)$/.test(text)) {
      return settings.humanHandoff
        ? 'Certo. Vou encaminhar seu atendimento para uma pessoa da equipe.'
        : settings.fallback;
    }

    return settings.fallback;
  }

  function renderRobotPanel() {
    const host = document.querySelector('#robotPanel, [data-admin-section="robot"]');
    if (!host || host.dataset.robotReady === '1') return;
    host.dataset.robotReady = '1';
    const s = loadSettings();

    host.innerHTML = `
      <div class="robot-admin-card">
        <div class="robot-admin-header">
          <div>
            <h2>🤖 Robô de Atendimento</h2>
            <p>Configure o atendimento automático que pode ser usado pelo WhatsApp ou por outros canais conectados ao sistema.</p>
          </div>
          <label class="robot-switch"><input id="robotEnabled" type="checkbox" ${s.enabled ? 'checked' : ''}><span></span></label>
        </div>

        <div class="robot-status ${s.enabled ? 'is-on' : 'is-off'}" id="robotStatus">
          ${s.enabled ? '● Robô ligado' : '● Robô desligado'}
        </div>

        <div class="robot-grid">
          <label>Mensagem de saudação<textarea id="robotGreeting" rows="3"></textarea></label>
          <label>Mensagem quando não entender<textarea id="robotFallback" rows="3"></textarea></label>
          <label class="robot-full">Menu automático<textarea id="robotMenuText" rows="5"></textarea></label>
        </div>

        <div class="robot-options">
          <label><input id="robotHumanHandoff" type="checkbox" ${s.humanHandoff ? 'checked' : ''}> Permitir encaminhar para atendente humano</label>
          <label><input id="robotBusinessHoursOnly" type="checkbox" ${s.businessHoursOnly ? 'checked' : ''}> Responder apenas no horário configurado</label>
        </div>

        <div class="robot-hours">
          <label>Abertura<input id="robotOpenTime" type="time" value="${s.openTime}"></label>
          <label>Fechamento<input id="robotCloseTime" type="time" value="${s.closeTime}"></label>
        </div>

        <div class="robot-actions">
          <button type="button" class="admin-primary" id="robotSave">Salvar configurações</button>
          <button type="button" class="admin-secondary" id="robotTest">Testar robô</button>
        </div>

        <div class="robot-test" id="robotTestBox" hidden>
          <div class="robot-test-title">Teste rápido</div>
          <div class="robot-test-row"><input id="robotTestInput" placeholder="Digite: oi, menu, 1, pedido, atendente..."><button type="button" id="robotTestSend">Enviar</button></div>
          <div class="robot-test-reply" id="robotTestReply"></div>
        </div>

        <div class="robot-note">O painel já salva as regras no ADM. Para responder mensagens reais do WhatsApp, o serviço do WhatsApp precisa ler estas configurações ou sincronizá-las com o backend.</div>
      </div>`;

    host.querySelector('#robotGreeting').value = s.greeting;
    host.querySelector('#robotFallback').value = s.fallback;
    host.querySelector('#robotMenuText').value = s.menuText;

    const collect = () => ({
      enabled: host.querySelector('#robotEnabled').checked,
      greeting: host.querySelector('#robotGreeting').value.trim() || DEFAULTS.greeting,
      fallback: host.querySelector('#robotFallback').value.trim() || DEFAULTS.fallback,
      humanHandoff: host.querySelector('#robotHumanHandoff').checked,
      businessHoursOnly: host.querySelector('#robotBusinessHoursOnly').checked,
      openTime: host.querySelector('#robotOpenTime').value || '18:00',
      closeTime: host.querySelector('#robotCloseTime').value || '23:59',
      menuText: host.querySelector('#robotMenuText').value.trim() || DEFAULTS.menuText
    });

    const refreshStatus = () => {
      const on = host.querySelector('#robotEnabled').checked;
      const status = host.querySelector('#robotStatus');
      status.className = `robot-status ${on ? 'is-on' : 'is-off'}`;
      status.textContent = on ? '● Robô ligado' : '● Robô desligado';
    };

    host.querySelector('#robotEnabled').addEventListener('change', refreshStatus);
    host.querySelector('#robotSave').addEventListener('click', () => {
      saveSettings(collect());
      refreshStatus();
      const btn = host.querySelector('#robotSave');
      const old = btn.textContent;
      btn.textContent = '✓ Salvo';
      setTimeout(() => { btn.textContent = old; }, 1200);
    });

    host.querySelector('#robotTest').addEventListener('click', () => {
      const box = host.querySelector('#robotTestBox');
      box.hidden = !box.hidden;
      if (!box.hidden) host.querySelector('#robotTestInput').focus();
    });

    const sendTest = () => {
      const settings = collect();
      const reply = getReply(host.querySelector('#robotTestInput').value, settings);
      host.querySelector('#robotTestReply').textContent = reply || 'O robô está desligado.';
    };
    host.querySelector('#robotTestSend').addEventListener('click', sendTest);
    host.querySelector('#robotTestInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendTest(); });
  }

  function boot() {
    renderRobotPanel();
    const observer = new MutationObserver(renderRobotPanel);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.LanchoneteRobot = { loadSettings, saveSettings, getReply, isWithinBusinessHours, renderRobotPanel };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
