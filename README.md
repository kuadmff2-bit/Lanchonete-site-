# Lanchonete Site

Cardápio digital com carrinho, pedido pelo WhatsApp e painel administrativo.

## Área do dono
Acesse `/admin.html`.

O painel agora possui:
- resumo de pedidos iniciados pelo site;
- pedidos de hoje e total acumulado;
- valor de pedidos de hoje e acumulado;
- lista dos pedidos recentes;
- cadastro, edição e exclusão de produtos;
- categorias Lanche e Bebida;
- controle Disponível / Indisponível por produto;
- foto por produto;
- publicação e ocultação de promoções.

## Cloudflare Pages
O backend usa o mesmo Workers KV para promoções, produtos e estatísticas.

Configure no projeto:
1. Um namespace de Workers KV.
2. Um KV binding chamado `PROMOTIONS`.
3. Uma variável/segredo chamada `ADMIN_PASSWORD` com a senha do dono.
4. Faça um novo deploy depois de configurar.

Os pedidos contabilizados no painel representam clientes que tocaram em **Enviar pedido no WhatsApp**. Como o envio final acontece dentro do WhatsApp, o site não consegue confirmar se a pessoa realmente tocou no botão de enviar da conversa.

## WhatsApp
Número configurado: (92) 99515-9975.
A mensagem não usa emojis para evitar caracteres quebrados em alguns aparelhos.
