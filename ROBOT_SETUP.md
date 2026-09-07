# Robô do painel administrativo

A interface do robô fica integrada ao painel administrativo e é carregada pelos arquivos `admin-robot.js` e `admin-robot.css`.

Configurações disponíveis:
- ligar/desligar;
- saudação;
- mensagem de fallback;
- menu automático;
- horário de atendimento;
- encaminhamento para atendente;
- teste rápido das respostas.

As configurações ficam salvas localmente no navegador/WebView do ADM. Para responder mensagens reais do WhatsApp, o serviço de WhatsApp deve sincronizar ou consumir essas configurações por uma API/backend compartilhado.
