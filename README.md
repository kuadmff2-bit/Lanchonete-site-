# Lanchonete Site

Cardápio digital com carrinho, pedido pelo WhatsApp e área administrativa de promoções.

## Área do dono
Acesse `/admin.html`.

A página não tem link no cardápio público. Para funcionar de verdade, configure no Cloudflare Pages:

1. Crie um namespace de Workers KV.
2. Adicione ao projeto um KV binding chamado `PROMOTIONS`.
3. Crie uma variável/segredo chamada `ADMIN_PASSWORD` com a senha do dono.
4. Faça um novo deploy.

Depois disso, o dono consegue enviar a foto da promoção, colocar título e descrição e publicar ou ocultar.

## WhatsApp
Número configurado: (92) 99515-9975.
A mensagem foi alterada para não usar emojis, evitando os caracteres quebrados exibidos anteriormente.
