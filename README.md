# Boggle Party Web

Jogo web mobile de caça-palavras, em português do Brasil. **HTML, CSS e JavaScript vanilla**, sem etapa de build, servidor próprio ou Firestore. Hospedagem estática no GitHub Pages; partidas online com **Firebase Authentication anônimo + Realtime Database**. Projeto independente, sem vínculo com Netflix ou Hasbro e sem recursos visuais proprietários. Implementa as mecânicas especificadas neste pedido; não reproduz a interface oficial da Netflix.

**Para começar:** extraia o ZIP → configure `js/firebase-config.js` → habilite autenticação e banco → envie os arquivos ao GitHub → ative Pages. O modo solo já funciona sem Firebase quando servido por HTTP/HTTPS.

![Mapa visual das etapas de configuração](docs/configuracao.svg)

## O que está incluído

- Grade 4×4, 16 dados de seis faces, seed de 32 bits e embaralhamento determinístico.
- Dados do conjunto clássico inglês de 1987, com face **Qu**, vogais e consoantes conforme esse conjunto. Há diferentes edições de dados Boggle; esta versão não inventa um conjunto oficial brasileiro.
- Arraste com dedo, caneta ou mouse por letras vizinhas, inclusive diagonais. Nenhuma casa pode ser usada duas vezes na mesma palavra. Linha colorida animada e feedback de validação.
- Teclado: setas movem o foco; espaço seleciona; Enter envia; Esc limpa.
- **15.000 palavras** PT-BR, carregadas de forma assíncrona em um `Set`, com busca média O(1). Acentos e cedilha são normalizados: café/cafe, ação/acao. Qu é uma casa e conta como duas letras.
- Partidas de 180 segundos para 1 a 8 pessoas. Pontuação independente, sem cancelar palavras encontradas por outros jogadores.
- Lobby ao vivo, convites por código ou `?sala=ABC123`, presença com `onDisconnect`, transações para entrada, início, palavras, encerramento e nova rodada.
- Ranking da partida com empates na mesma posição. Solo com recorde local e Top 10 global das melhores partidas por UID anônimo.
- PWA com manifesto, ícones normais e maskable, cache offline completo do solo. Arquivos relativos funcionam em subpastas do GitHub Pages.

| Letras na palavra | Pontos |
| --- | ---: |
| 3–4 | 1 |
| 5 | 2 |
| 6 | 3 |
| 7 | 5 |
| 8 ou mais | 11 |

## Estrutura de pastas

```text
boggle-party-web/
  index.html
  css/estilo.css
  js/
    firebase-config.js
    app.js
    tabuleiro.js
    jogo.js
    multijogador.js
    dicionario.js
  dicionario.json
  dicionario.fontes.json
  manifest.json
  sw.js
  icones/
    icone-192.png
    icone-512.png
    icone-maskable-512.png
  database.rules.json
  scripts/expandir_dicionario.py
  testes/regras.test.js
  testes/multijogador.test.js
  docs/configuracao.svg
  fontes/pt_BR.dic
  fontes/pt_BR.aff
  licencas/
  package.json
  .nojekyll
  .gitignore
  README.md
```

`fontes/` preserva os arquivos originais do léxico e suas regras de flexão. Não são carregados pelo aplicativo. Não é preciso executar Python ou Node para publicar/jogar.

## 1. Criar o projeto no Firebase — passo a passo visual

Abra o [Firebase Console](https://console.firebase.google.com/). Os rótulos podem aparecer em inglês ou português.

| Etapa | Caminho na tela | Ação |
| --- | --- | --- |
| ① Projeto | Página inicial → **Criar um projeto / Create a project** | Nome: `Boggle Party Web`. Google Analytics é opcional e pode ficar desativado. |
| ② Plano | Visão geral do projeto → plano | Mantenha **Spark**. Este jogo não usa Functions, extensões ou APIs que exijam cobrança. |
| ③ Aplicativo web | Visão geral → ícone **</>** | Registre `Boggle Web`. Não é necessário habilitar Firebase Hosting. |
| ④ Credenciais | Configurações do projeto → Geral → Seus aplicativos → Configuração do SDK | Copie o objeto `firebaseConfig`. |
| ⑤ Login | **Build → Authentication → Começar → Método de login** | Ative o provedor **Anônimo / Anonymous** e salve. |
| ⑥ Banco | **Build → Realtime Database → Criar banco de dados** | Escolha a região e crie. Use **Realtime Database**, não Cloud Firestore. |
| ⑦ Regras | Realtime Database → **Regras / Rules** | Cole as regras abaixo e toque em **Publicar**. |
| ⑧ URL | Realtime Database → **Dados / Data** | Copie o endereço completo do banco para `databaseURL`. |

### Onde colocar a configuração

Edite **somente o objeto `configuracaoFirebase` em `js/firebase-config.js`**, preservando o restante do arquivo:

```js
export const configuracaoFirebase = {
  apiKey: 'SUA_CHAVE_PUBLICA_WEB',
  authDomain: 'seu-projeto.firebaseapp.com',
  databaseURL: 'https://seu-projeto-default-rtdb.firebaseio.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.firebasestorage.app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:seu-identificador'
};
```

Use os valores reais fornecidos pelo Console. A URL pode ser `https://...firebasedatabase.app` em algumas regiões: **copie a URL exata**, sem substituí-la pelo exemplo. Não precisa ativar o produto Storage: o campo pode vir no objeto, mas o jogo não usa esse serviço. As configurações web são públicas por design; não coloque JSON de conta de serviço, credenciais administrativas ou segredos no repositório.

Em **Authentication → Configurações → Domínios autorizados**, cadastre `SEU_USUARIO.github.io` (sem `https://` e sem caminho). Se necessário, adicione `localhost` para o teste local. Autenticação anônima não usa redirecionamento OAuth; manter a lista correta prepara o projeto para provedores futuros.

### Regras abertas de desenvolvimento — copie e publique

`database.rules.json` contém JSON válido e o índice do ranking:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "rankingSolo": {
      ".indexOn": ["pontuacao"]
    }
  }
}
```

**Aviso: estas regras permitem que qualquer pessoa leia, modifique ou apague os dados, mesmo sem login.** Foram incluídas conforme solicitado para desenvolvimento e partidas privadas de teste. Não são uma configuração segura para um jogo público competitivo. Os comentários explicativos ficam aqui porque JSON estrito não aceita comentários.

Antes de abrir o jogo ao público, restrinja a leitura a usuários autenticados/membros da sala, valide nomes e formatos, faça `host` imutável, permita transições de estado apenas ao host, limite inscrições a oito vagas e permita que cada UID escreva apenas suas próprias palavras. Use `now` nas regras para limitar o prazo. Restrinja o ranking a atualizações do próprio UID, com valores numéricos válidos, e avalie App Check para reduzir abuso. **Apenas trocar `true` por `auth != null` não resolve adulteração de placar.**

A implementação atual usa transações na raiz da sala para reservar vagas e atualizar palavras/pontuação atomicamente. Uma política de produção com permissões por filho exige revisar essas transações e testar as regras no Emulator Suite; não cole regras restritas arbitrárias esperando que toda operação continue permitida. O dicionário e o cálculo da pontuação estão no cliente: um cliente adulterado pode enviar palavras/placares falsos. Ranking realmente antifraude exigiria validação confiável adicional; não é uma garantia desta arquitetura estática com regras abertas.

## 2. Publicar gratuitamente no GitHub Pages

1. Entre no [GitHub](https://github.com/) e crie um repositório **público** chamado `boggle-party-web`. No plano gratuito, use um repositório público para Pages.
2. Extraia o ZIP no computador. Abra a pasta `boggle-party-web`.
3. No repositório, clique em **Add file → Upload files**. No celular, use o navegador em **Versão para computador** se esses botões não aparecerem.
4. Envie **o conteúdo da pasta**, mantendo `css/`, `js/`, `icones/` e as demais subpastas. O arquivo `index.html` precisa estar na **raiz do repositório**, não dentro de uma segunda pasta `boggle-party-web`.
5. Confira se `js/firebase-config.js` já recebeu sua configuração. Clique em **Commit changes**.
6. Abra **Settings → Pages → Build and deployment**.
7. Em **Source**, selecione **Deploy from a branch**.
8. Escolha a branch **main** e a pasta **/(root)**. Clique em **Save**.
9. Aguarde o deploy indicado em **Actions**. Abra o endereço mostrado em Pages, normalmente:

   `https://SEU_USUARIO.github.io/boggle-party-web/`

10. Teste o solo e, depois, crie uma sala em um aparelho e entre com outro. Todos precisam acessar **o mesmo endereço e o mesmo Firebase**.

Nenhum `npm install`, build, Firebase Hosting ou backend Node é necessário. `.nojekyll` impede processamento desnecessário pelo Jekyll. O SDK modular Firebase 12.7.0 é importado sob demanda pelo CDN oficial; a interface e o solo não dependem desse download.

## 3. Testar localmente

Não abra `index.html` por duplo clique (`file://`): módulos ES e `fetch` precisam de HTTP/HTTPS.

```bash
cd boggle-party-web
python3 -m http.server 8080
```

Abra [http://localhost:8080](http://localhost:8080). No Windows, use `py -m http.server 8080` se `python3` não existir. Python é apenas um servidor estático de desenvolvimento, não faz parte da hospedagem do jogo.

Testes de regras, sem instalar dependências, com Node.js 20 ou superior:

```bash
npm test
```

Os testes de multiplayer usam um banco simulado para verificar os callbacks de transação. Não substituem um teste de integração no seu projeto Firebase real.

## 4. Amigos no celular e instalação PWA

**Convite:** o anfitrião abre o endereço, digita o nome e toca em **Criar uma sala**. Em **Compartilhar convite**, envia o link pelo aplicativo de sua escolha. Os amigos abrem o link, informam o nome e tocam em **Entrar**. Também podem digitar o código de seis caracteres na tela inicial. Cada jogador usa seu próprio aparelho. O anfitrião toca em **Começar partida**; todos recebem o mesmo tabuleiro e prazo.

**Android / Chrome:** abra o endereço HTTPS → menu **⋮** → **Instalar app** ou **Adicionar à tela inicial**. Se o navegador permitir, o próprio jogo mostra **Instalar aplicativo**.

**iPhone / iPad / Safari:** abra o endereço HTTPS → **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**. Abra pelo ícone para jogar em modo aplicativo.

A instalação não é obrigatória. Multiplayer requer internet. Para solo offline, faça uma primeira visita online e espere o cache terminar; depois reabra pelo mesmo endereço/ícone. Não há tentativa de simular partidas online sem conexão.

## 5. Como funciona a sincronização

```text
salas/
  ABC123/
    config/
      host: "uid-do-anfitriao"
      seed: 123456789
      estado: "lobby" | "em_andamento" | "finalizado"
      timestampInicio: 1793000000000
      rodada: 1
      criadoEm: 1793000000000
    jogadores/
      uid/
        nome: "Ana"
        pontuacao: 3
        online: true
    palavras/
      uid/
        cafe/
          pontos: 1
          caminho: [0, 1, 5, 6]
          enviadoEm: 1793000020000
rankingSolo/
  uid/
    nome: "Ana"
    pontuacao: 42
    atualizadoEm: 1793000200000
```

- O anfitrião grava `serverTimestamp()`, equivalente modular a `ServerValue.TIMESTAMP`, e uma nova seed ao iniciar a rodada. Todos usam o mesmo gerador determinístico.
- Cada cliente acompanha `.info/serverTimeOffset` e calcula o prazo absoluto `timestampInicio + 180000`. O relógio se corrige após aba em segundo plano: não depende de contar 180 chamadas de `setInterval`.
- `.info/connected` e `onDisconnect` indicam a presença. Sem conexão, a seleção é desabilitada e o relógio continua. Não se aceitam novas palavras intencionalmente na fila offline. Uma escrita que já estava em trânsito pode depender da resolução da conexão; regras abertas não fornecem controle de prazo no servidor.
- As palavras são chaves normalizadas por UID: repetição do próprio jogador não pontua. A mesma palavra de dois jogadores pontua para ambos.
- Transações usam `applyLocally: false` para evitar avançar a interface antes da confirmação. O código da rodada impede que uma resposta antiga contamine uma rodada nova.
- Ao acabar o tempo, cada cliente apresenta o resultado localmente. Qualquer participante conectado pode persistir o estado finalizado; o ranking continua acompanhando as confirmações do banco. Um aparelho offline mostra os últimos dados conhecidos até reconectar.
- Só o host volta ao lobby/inicia outra rodada. Os outros acompanham automaticamente. Sair do lobby libera a vaga e transfere o papel de host. Desconexões preservam vagas/UID para reentrada. Se o anfitrião fechar o navegador durante a partida, ele deve voltar pelo convite na mesma sessão para iniciar outra; não há eleição automática de host em desconexão abrupta. Se isso não for possível, crie outra sala.
- A autenticação usa persistência de sessão por aba. Recarregar permite reentrar; fechar a sessão, trocar de navegador ou reinstalar pode gerar outro UID. O ranking global acompanha o UID, não é uma conta permanente. O recorde pessoal usa `localStorage` e permanece no aparelho enquanto os dados do site não forem apagados.
- Não há expiração automática de salas no servidor. Exclua salas antigas pelo Console conforme necessário. A última saída explícita de um lobby vazio remove a sala.

## 6. Expandir o dicionário

O JSON incluído funciona sem nenhuma dependência. O script de manutenção, executado fora do aplicativo, precisa de Python 3 e [Spylls](https://github.com/zverok/spylls) para aplicar corretamente as flexões Hunspell.

```bash
python3 -m pip install spylls==0.1.7
python3 scripts/expandir_dicionario.py --limite 20000
```

A fonte de frequência é **FrequencyWords, PT-BR/OpenSubtitles 2018**; a validação ortográfica usa o **VERO PT-BR/LibreOffice** com suas regras `.aff`. O script retém palavras de 3 a 16 letras, normaliza acentos e remove duplicatas. Nomes próprios não são adicionados por mera frequência: precisam ser aceitos pelo léxico na grafia minúscula. Não é um dicionário oficial de torneio; a seleção pode conter coloquialismos, palavrões e flexões e não cobre todo o português. Você pode revisar o vocabulário conforme o público do jogo.

Para reutilizar os arquivos VERO incluídos e baixar apenas a lista de frequência:

```bash
python3 scripts/expandir_dicionario.py --lexico fontes/pt_BR.dic --afixos fontes/pt_BR.aff --limite 20000
```

Para adicionar palavras que você revisou, crie `minhas-palavras.txt`, uma palavra por linha:

```bash
python3 scripts/expandir_dicionario.py --adicionar minhas-palavras.txt --limite 20000
```

O script também grava `dicionario.fontes.json` com URLs, hashes SHA-256 das fontes e critérios. O limite é um teto, não uma garantia de quantidade: a interseção das fontes pode ser menor. Abaixo de 5.000 palavras o script aborta sem substituir o arquivo. As fontes públicas podem mudar; os hashes documentam cada execução. Após alterar o JSON, atualize a versão de cache em `sw.js` e publique os dois arquivos.

## 7. Atualizações, desempenho e limites

Altere `CACHE` em `sw.js` a cada publicação. A nova versão aguarda todas as abas antigas serem fechadas para não trocar arquivos no meio de uma partida. Feche o PWA e todas as abas e reabra. Não armazene segredos nos arquivos em cache.

O dicionário é transferido uma vez e reutilizado pelo Service Worker. Os ouvintes são por sala, não no conjunto de todas as salas. As transações de palavras operam sobre a sala inteira: simples e apropriado para pequenos grupos de até oito, com volume de dados crescente conforme as palavras. Para muitos grupos, monitore tráfego, autenticações e armazenamento no Console; gratuidade não significa capacidade ilimitada.

O Spark limita o Realtime Database a **100 conexões simultâneas por banco**; abas abertas também contam. Este projeto não exige upgrade para Blaze nem Cloud Functions. Consulte os limites/quota vigentes antes de eventos maiores. Não configure faturamento apenas para fazer este projeto funcionar.

## Solução de problemas

| Sintoma | O que conferir |
| --- | --- |
| Só o solo funciona | Preencha `js/firebase-config.js`, habilite login anônimo e crie o Realtime Database. |
| `permission_denied` | Publique `database.rules.json` na aba Regras do banco correto. |
| `auth/operation-not-allowed` | Ative Authentication → provedor Anônimo. |
| `auth/invalid-api-key` | Copie novamente a configuração do aplicativo web. |
| Sala não existe | Confira código, endereço do site e se os aparelhos usam a mesma configuração Firebase. |
| Sala cheia após alguém desconectar | A vaga fica reservada para reentrada. Saia explicitamente no lobby ou crie outra sala. |
| Firebase não conecta | Confira `databaseURL`, bloqueadores de rede, conexão e quotas no Console. |
| Erro no dicionário | Sirva por HTTP/HTTPS e confirme `dicionario.json` na raiz junto ao `index.html`. |
| Ícones ou módulos retornam 404 | Preserve subpastas e nomes com a mesma caixa; use a raiz correta em Pages. |
| Versão antiga no PWA | Incremente `CACHE`, feche todas as abas e reabra. Para diagnóstico, limpe os dados do site; isso apaga o recorde local. |
| Não aparece instalar | Use HTTPS e confira manifesto/ícones. No iOS use o menu Compartilhar no Safari. |

## Fontes e licenças

O código original do jogo está sob MIT (`licencas/CODIGO-MIT.txt`). O dicionário é um recorte normalizado derivado de fontes externas; preserve os avisos e licenças ao redistribuir. As alterações nesta distribuição são filtragem por frequência, validação com afixos, remoção de acentos, deduplicação e conversão para JSON.

- [VERO/LibreOffice PT-BR](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR), Raimundo Santos Moura e colaboradores. Avisos originais em `licencas/README_pt_BR.txt`. Esta distribuição usa a opção LGPLv3; fontes originais incluídas em `fontes/`, textos da LGPLv3 e GPLv3 em `licencas/`.
- [FrequencyWords](https://github.com/hermitdave/FrequencyWords), Hermit Dave, MIT; aviso original em `licencas/FrequencyWords-MIT.txt`.
- [Firebase: instalação do SDK web](https://firebase.google.com/docs/web/setup), [presença/horário do servidor](https://firebase.google.com/docs/database/web/offline-capabilities), [limites do Realtime Database](https://firebase.google.com/docs/database/usage/limits).
- [GitHub Pages: publicação de um site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [Stanford: mecânica Boggle e dados](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1186/assn/boggle.html) e [Hasbro: instruções do Boggle](https://instructions.hasbro.com/en-us/instruction/boggle-game).
