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
