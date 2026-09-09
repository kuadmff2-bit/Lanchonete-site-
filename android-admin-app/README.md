# Lanchonete Admin APK

Aplicativo Android que abre diretamente o painel administrativo da lanchonete:

`https://lanchonete-site.kuadmff2.workers.dev/admin`

## Recursos
- sem barra de endereço do navegador;
- entrada automática, sem campo de senha no APK;
- pedidos, produtos, promoções, WhatsApp e aparência;
- upload/troca de imagens pelo seletor do Android;
- links externos abrem no aplicativo correspondente;
- botão voltar do Android navega no painel;
- modos claro e escuro;
- ícone e tela de carregamento com o hambúrguer laranja da marca;
- notificações de novos pedidos com som e vibração.

O APK é salvo em `apk/Lanchonete-Admin.apk`. Para reconstruí-lo, passe a chave exclusiva
como propriedade Gradle `adminAppToken`; no GitHub Actions ela é derivada de um
segredo do projeto e cadastrada automaticamente no Worker durante a compilação.
