#!/usr/bin/env python3
"""Monta um recorte frequente do léxico VERO PT-BR. Usa Spylls para validar as flexões do Hunspell."""
import argparse
import hashlib
import json
import re
import unicodedata
import urllib.request
import tempfile
from spylls.hunspell import Dictionary
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
FONTES = {
    'frequencia': 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt',
    'lexico': 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pt_BR/pt_BR.dic',
    'afixos': 'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pt_BR/pt_BR.aff',
}

def normalizar(texto):
    return ''.join(letra for letra in unicodedata.normalize('NFD', texto.lower()) if unicodedata.category(letra) != 'Mn')

def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument('--limite', type=int, default=15000, help='Número máximo de palavras frequentes, sujeito ao tamanho da interseção.')
    argumentos.add_argument('--adicionar', type=Path, help='Arquivo UTF-8 com palavras revisadas, uma por linha; serão unidas à seleção.')
    argumentos.add_argument('--frequencia', type=Path, help='Usar cópia local da lista de frequência.')
    argumentos.add_argument('--lexico', type=Path, help='Usar cópia local do arquivo Hunspell .dic.')
    argumentos.add_argument('--afixos', type=Path, help='Usar cópia local das regras Hunspell .aff.')
    argumentos.add_argument('--saida', type=Path, default=RAIZ / 'dicionario.json')
    opcoes = argumentos.parse_args()
    if opcoes.limite < 5000:
        argumentos.error('O limite deve ser de pelo menos 5000 palavras.')
    textos, hashes = {}, {}
    for nome, endereco in FONTES.items():
        caminho = getattr(opcoes, nome)
        conteudo = caminho.read_bytes() if caminho else urllib.request.urlopen(endereco, timeout=60).read()
        textos[nome] = conteudo.decode('utf-8-sig')
        hashes[nome] = hashlib.sha256(conteudo).hexdigest()
    # O verificador aplica as flexões: casa pode derivar de casar no léxico.
    with tempfile.TemporaryDirectory() as temporario:
        base = Path(temporario) / 'pt_BR'
        base.with_suffix('.dic').write_text(textos['lexico'], encoding='utf-8')
        base.with_suffix('.aff').write_text(textos['afixos'], encoding='utf-8')
        verificador = Dictionary.from_files(str(base))
    palavras = set()
    for linha in textos['frequencia'].splitlines():
        if not linha.strip():
            continue
        palavra = normalizar(linha.split()[0])
        if re.fullmatch(r'[a-z]{3,16}', palavra) and verificador.lookup(linha.split()[0]):
            palavras.add(palavra)
        if len(palavras) >= opcoes.limite:
            break
    if opcoes.adicionar:
        for linha in opcoes.adicionar.read_text(encoding='utf-8').splitlines():
            palavra = normalizar(linha.strip())
            if re.fullmatch(r'[a-z]{3,16}', palavra):
                palavras.add(palavra)
    if len(palavras) < 5000:
        raise SystemExit('As fontes produziram menos de 5000 palavras; nenhum arquivo foi alterado.')
    opcoes.saida.write_text(json.dumps(sorted(palavras), ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    metadados = {'palavras': len(palavras), 'fontes': FONTES, 'sha256_fontes': hashes, 'criterio': 'Interseção de frequência PT-BR com VERO e validação de afixos por Spylls; normalização sem acentos; 3 a 16 letras.'}
    opcoes.saida.with_suffix('.fontes.json').write_text(json.dumps(metadados, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(palavras)} palavras gravadas em {opcoes.saida}')

if __name__ == '__main__':
    main()
