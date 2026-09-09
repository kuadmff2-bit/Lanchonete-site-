# WhatsApp automático do cardápio

Esta integração é exclusivamente transacional. Ela não cria menus, não interpreta mensagens recebidas e não atende clientes.

## Fluxo

1. O cliente finaliza um pedido no cardápio.
2. O Worker registra o pedido e chama o serviço 24 horas.
3. O serviço envia o pedido completo ao WhatsApp configurado da lanchonete.
4. O mesmo serviço envia a confirmação ao WhatsApp do cliente.
5. Ao tocar em **Confirmado**, **Saiu para entrega** ou **Cancelado** no APK, o Worker envia a atualização ao cliente automaticamente.

Pedidos abertos por `/?preview=admin` são apenas simulações: não são gravados, contabilizados ou enviados.

## Painel administrativo

Na aba **WhatsApp**, o administrador pode:

- visualizar o estado real da conexão;
- escanear o QR Code dentro do APK;
- conectar outro WhatsApp;
- alterar o número que recebe os pedidos;
- conferir quais mensagens são automáticas.

Não existem configurações de saudação, respostas, menu ou encaminhamento, porque mensagens recebidas ficam para a equipe responder normalmente.

## Serviço 24 horas

Implante a pasta `whatsapp-robot` em um serviço Node/Docker e mantenha um volume persistente em `/app/tokens`.

Variáveis por instância:

- `ROBOT_API_BASE`: endereço público do Worker da lanchonete;
- `ROBOT_WEBHOOK_TOKEN`: segredo exclusivo usado na sincronização do QR;
- `ROBOT_CONTROL_TOKEN`: segredo usado pelo Worker nas chamadas servidor-servidor;
- `WPP_SESSION`: nome exclusivo da sessão;
- `WPP_TOKEN_PATH`: `/app/tokens` quando houver volume persistente.

Variáveis do Worker:

- `ROBOT_SERVICE_URL`: URL HTTPS terminando em `/instances/<slug-da-instancia>`;
- `ROBOT_CONTROL_TOKEN` ou `ADMIN_PASSWORD`: deve coincidir com o controle da instância;
- `ROBOT_WEBHOOK_TOKEN` ou `ROBOT_WEBHOOK_TOKEN_SHA256`: usado quando a sincronização direta com o Worker estiver habilitada.

## Endpoints protegidos

- `GET /control/status` — estado e QR Code;
- `POST /control/reset` — conectar outra conta;
- `POST /control/send-order` — enviar o pedido à lanchonete e a confirmação ao cliente;
- `POST /control/send-status` — enviar uma atualização de status ao cliente.

Os endpoints de controle exigem `Authorization: Bearer <ROBOT_CONTROL_TOKEN>`. O navegador nunca recebe esse segredo.
