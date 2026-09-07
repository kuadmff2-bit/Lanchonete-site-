# Robô do painel administrativo

A interface do robô fica integrada ao painel administrativo e é carregada pelos arquivos `admin-robot.js` e `admin-robot.css`.

## Recursos no ADM
- ligar/desligar o robô;
- mensagem de saudação;
- mensagem de fallback;
- menu automático;
- horário de atendimento;
- encaminhamento para atendente;
- teste rápido das respostas.

## Sincronização
As configurações são salvas no backend pelo endpoint `/api/robot` e armazenadas no KV `PROMOTIONS`, na chave `robot-settings`. O navegador/WebView mantém uma cópia local apenas como fallback.

O endpoint `POST /api/robot` exige a autenticação normal do administrador. O `GET /api/robot` expõe somente as regras de atendimento, permitindo que um serviço externo de WhatsApp consulte as configurações.

## WhatsApp
O painel e o backend do robô já estão preparados. Para responder mensagens reais do WhatsApp 24 horas por dia ainda é necessário conectar um serviço de WhatsApp ao endpoint/configurações do robô.
