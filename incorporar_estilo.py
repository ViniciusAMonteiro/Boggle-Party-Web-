#!/usr/bin/env python3
"""Atualiza no HTML a cópia de segurança do CSS para publicação estática."""
from pathlib import Path

raiz = Path(__file__).resolve().parent
html = raiz / 'index.html'
conteudo = html.read_text(encoding='utf-8')
css = (raiz / 'estilo.css').read_text(encoding='utf-8')
inicio = '<!-- INICIO_ESTILO_INCORPORADO -->'
fim = '<!-- FIM_ESTILO_INCORPORADO -->'
bloco = f'{inicio}\n<style id="estilo-incorporado">\n{css}\n</style>\n{fim}'
if inicio in conteudo and fim in conteudo:
    antes, restante = conteudo.split(inicio, 1)
    _, depois = restante.split(fim, 1)
    conteudo = antes + bloco + depois
else:
    marcador = '<link rel="stylesheet" href="./estilo.css">'
    if marcador not in conteudo:
        raise SystemExit('Referência ao CSS não encontrada; HTML preservado.')
    conteudo = conteudo.replace(marcador, bloco + '\n' + marcador, 1)
html.write_text(conteudo, encoding='utf-8')
print('Estilo incorporado atualizado no index.html.')
