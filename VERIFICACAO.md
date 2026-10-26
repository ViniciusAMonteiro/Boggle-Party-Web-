# Verificação da entrega

Verificações realizadas nesta versão:

- Oito testes automatizados Node passaram: seed determinística, dados e Qu; adjacência e repetição de casas; pontuação e normalização; dicionário real; relógio absoluto; capacidade de oito jogadores e papel do host; pontuação independente e duplicatas; finalização, reinício e transferência do host ao sair do lobby.
- Os testes de multiplayer executam os callbacks de transação em banco simulado. Não houve conexão a um projeto Firebase real, pois nenhuma configuração foi fornecida.
- Teste em Chromium com viewport mobile e eventos de toque: palavra formada por arraste foi aceita; a mesma palavra não pontuou duas vezes.
- O relógio foi avançado no ambiente de teste para conferir o resultado automático e a gravação do recorde no localStorage.
- Após o Service Worker controlar a página, a rede foi desligada no navegador de teste. A página recarregou e o modo solo abriu com o tabuleiro completo.
- Interface conferida em 390 px e 320 px, sem transbordamento horizontal. Nenhum erro JavaScript não tratado foi observado nesse fluxo.
- Manifesto, regras, metadados e dicionário são JSON válido. Dicionário com 15.000 entradas únicas normalizadas.

Para validar sua instalação online: configure o Firebase conforme README, use dois aparelhos/sessões, crie e entre em uma sala, confira o mesmo tabuleiro, envie palavras, deixe os 180 segundos terminarem e teste Jogar novamente. Confirme também a presença ao desconectar um aparelho. O funcionamento com Firebase real e a instalação em aparelhos físicos ainda dependem dessa configuração e verificação.

## Correção visual 1.0.1

O arquivo CSS externo foi bloqueado intencionalmente no navegador de teste. A tela inicial manteve fundo escuro e cartões formatados; o tabuleiro do solo manteve o layout em grade. A cópia interna do estilo foi confirmada, sem transbordamento em 390 px e 320 px.

## Versão 1.0.2 sem pastas

Oito testes automatizados passaram na organização plana. No navegador com viewport mobile, o solo abriu sem Firebase, uma palavra enviada por touch pontuou, duplicatas foram bloqueadas, o fim automático e o recorde local funcionaram, o solo reabriu offline, e a largura de 320 px não transbordou. Nenhum erro JavaScript ou resposta HTTP >=400 foi registrado no fluxo. A integração com um projeto Firebase real continua dependendo da configuração.

## Pacote completo 1.0.3 configurado

Inclui os valores de configuração fornecidos pelo usuário e a URL do Realtime Database mostrada em sua captura. Cache atualizado para 1.0.3-firebase. Não foram criados usuários, salas nem registros no Firebase real durante a preparação do pacote.
