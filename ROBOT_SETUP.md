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

O endpoint `POST /api/robot` exige a autenticação normal do administrador. O `GET /api/robot` expõe somente as regras de atendimento.

## Motor de conversa e pedidos
O endpoint `POST /api/robot/chat` mantém uma sessão separada para cada cliente e usa os produtos reais cadastrados no cardápio.

Fluxo principal:
1. Cliente pede o cardápio.
2. Robô envia o link do cardápio digital e todos os produtos disponíveis numerados, com preço.
3. Cliente envia o número do produto.
4. Robô pergunta quantas unidades.
5. Na etapa de quantidade, somente números inteiros de 1 a 30 são aceitos.
6. O item e a quantidade são acumulados no carrinho do cliente.
7. O cliente pode escolher outros produtos ou enviar `finalizar`.
8. Ao finalizar, o robô pede nome, entrega/retirada, endereço quando necessário e forma de pagamento.
9. O pedido é criado pelo mesmo endpoint `/api/orders` usado pelo cardápio e aparece normalmente no painel administrativo.

Comandos úteis durante o atendimento:
- `cardápio` — mostra o link e a lista numerada atualizada;
- `carrinho` — mostra os itens acumulados e o total;
- `finalizar` — inicia o fechamento do pedido;
- `cancelar` — limpa o atendimento e o carrinho;
- `atendente` — solicita atendimento humano, quando habilitado.

As sessões expiram automaticamente depois de algumas horas sem atividade para evitar carrinhos abandonados permanentes.

## Integração com WhatsApp
Um serviço de WhatsApp deve encaminhar cada mensagem recebida para `POST /api/robot/chat` usando um `contactId` estável e, de preferência, o telefone do cliente. A resposta JSON contém o texto em `reply`, além do estado da conversa, carrinho e indicadores como `handoff` ou `completed`.

Exemplo de entrada:

```json
{
  "contactId": "5592999999999",
  "phone": "5592999999999",
  "message": "cardápio"
}
```

Quando a variável secreta `ROBOT_WEBHOOK_TOKEN` estiver configurada no Cloudflare, o serviço externo também deve enviar o mesmo valor no cabeçalho `x-robot-token`.

O motor de conversa e criação de pedidos já está no backend. Para responder mensagens reais do WhatsApp 24 horas por dia ainda é necessário conectar o número da lanchonete a um serviço de WhatsApp que faça o envio e recebimento das mensagens.
