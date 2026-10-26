# Boggle Party Web 1.0.3 — completo e configurado

Esta edição coloca TODOS os arquivos no mesmo nível e já inclui sua configuração Firebase e a URL do Realtime Database. Não precisa editar o código para colocar essas credenciais novamente. A autenticação anônima deve estar ativada e as regras devem estar publicadas no Console. O teste com o projeto Firebase real ainda deve ser feito após publicar.

## Como enviar pelo navegador

1. Baixe e EXTRAIA o ZIP. Não envie o ZIP inteiro ao repositório.
2. Entre no repositório do jogo no GitHub → Add file → Upload files.
3. Abra a pasta extraída e selecione todos os ARQUIVOS de uma só vez. Se for necessário, ative “Versão para computador” no navegador.
4. Confirme que index.html, app.js, firebase-config.js, dicionario.json, manifest.json, sw.js e os demais arquivos aparecem juntos na raiz do repositório. Não crie uma subpasta para eles.
5. Toque em Commit changes. Em Settings → Pages, use Deploy from a branch → main → /(root) → Save, se ainda não estiver configurado.
6. Aguarde a publicação, feche todas as abas/janelas do jogo e abra novamente o endereço HTTPS do GitHub Pages.

Não é necessário apagar pastas antigas do repositório: esta edição usa os arquivos na raiz. O novo index.html deve SUBSTITUIR o antigo na mesma raiz. Se havia configuração Firebase válida em js/firebase-config.js, copie os valores para o NOVO firebase-config.js da raiz.

## Testar após publicar

Digite seu nome e toque em **Criar uma sala**. Convide outro aparelho pelo link para testar o lobby. O modo **Jogar solo** também continua disponível. Se aparecer auth/operation-not-allowed, ative o provedor Anônimo em Authentication. Se aparecer permission_denied, confira as regras do Realtime Database.

## Referência da configuração Firebase (já preenchida nos arquivos)

1. Abra https://console.firebase.google.com/ e selecione seu projeto (plano Spark).
2. Em Build → Authentication → Método de login, ative Anônimo.
3. Em Build → Realtime Database, crie o banco e copie sua URL exata.
4. Na aba Regras do banco, cole o conteúdo de database.rules.json e publique. São regras ABERTAS de desenvolvimento: qualquer pessoa pode ler e alterar os dados. Para segurança em produção, veja GUIA_COMPLETO.md.
5. Na engrenagem → Configurações do projeto → Geral → Seus aplicativos, registre o aplicativo web (ícone </>) ou abra o já existente. Copie os valores do objeto firebaseConfig.
6. No GitHub, abra firebase-config.js na raiz → lápis para editar. Preencha o objeto configuracaoFirebase com os valores copiados e a databaseURL. Preserve o nome configuracaoFirebase e o restante do arquivo. Salve com Commit changes.
7. Aguarde o deploy e feche/reabra todas as abas do jogo para atualizar a configuração em cache.
8. Crie uma sala e teste o convite em outro aparelho.

Não precisa Firebase Hosting, Firestore, Storage, Functions ou servidor próprio. Nunca coloque chaves administrativas/conta de serviço no repositório.

## Personalização e manutenção

- estilo.css contém os estilos; index.html também inclui uma cópia para a aparência resistir a falhas de carregamento do CSS.
- Após alterar estilo.css, rode `python3 incorporar_estilo.py` antes de publicar.
- Para testar localmente, use `python3 -m http.server 8080`. Não abra index.html por duplo clique: módulos JavaScript precisam de HTTP/HTTPS.
- `npm test` executa oito testes sem dependências. Multiplayer foi verificado com banco simulado; Firebase real requer sua configuração.
- Para alterar o dicionário: `python3 -m pip install spylls==0.1.7` e `python3 expandir_dicionario.py --lexico pt_BR.dic --afixos pt_BR.aff --limite 20000`.
- Incremente CACHE em sw.js quando atualizar o projeto. Não misture os arquivos desta edição com os caminhos da versão antiga.
- O guia detalhado está em GUIA_COMPLETO.md; os avisos de licença e fontes também estão juntos nesta pasta.
