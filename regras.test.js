import teste from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gerarTabuleiro, DADOS, adjacentes, caminhoValido} from '../js/tabuleiro.js';
import {normalizar, Dicionario} from '../js/dicionario.js';
import {pontuar, tempoRestante, validarJogada, totalizar} from '../js/jogo.js';
teste('Seed reproduzível, 16 dados de seis faces e Qu indivisível', () => {
  assert.equal(DADOS.length,16); assert.ok(DADOS.every(d => d.length === 6));
  assert.deepEqual(gerarTabuleiro(123456),gerarTabuleiro(123456));
  assert.notDeepEqual(gerarTabuleiro(123456),gerarTabuleiro(1));
  assert.equal(gerarTabuleiro(3).length,16);
  assert.ok(DADOS.some(d => d.includes('Qu')));
});
teste('Diagonais permitidas, bordas sem contorno e célula sem repetição', () => {
  assert.ok(adjacentes(0,5)); assert.ok(!adjacentes(3,4));
  assert.ok(!caminhoValido([0,1,0])); assert.ok(!caminhoValido([0,15]));
  assert.ok(caminhoValido([0,1,5,10])); assert.ok(!caminhoValido([-1]));
});
teste('Pontuação e contagem de letras oficiais', () => {
  assert.deepEqual(['oi','sol','casa','casas','banana','palavra','palavras','chocolate'].map(pontuar),[0,1,1,2,3,5,11,11]);
  assert.equal(normalizar('Café'),'cafe'); assert.equal(normalizar('AÇÃO'),'acao');
  const dic = new Dicionario(); dic.palavras = new Set(['que']);
  assert.deepEqual(validarJogada(['Qu','E'],[0,1],dic),{palavra:'que',pontos:1});
});
teste('Dicionário real, limites e duplicatas normalizadas', async () => {
  const lista = JSON.parse(await readFile(new URL('../dicionario.json',import.meta.url)));
  assert.ok(lista.length >= 5000); assert.equal(new Set(lista).size,lista.length);
  assert.ok(lista.every(p => /^[a-z]{3,16}$/.test(p)));
  const dic = new Dicionario(); dic.palavras = new Set(lista);
  assert.ok(dic.contem('café')); assert.ok(dic.contem('ação')); assert.ok(dic.contem('casa'));
  const letras = ['C','A','F','E'];
  assert.equal(validarJogada(letras,[0,1,2,3],dic).palavra,'cafe');
  assert.ok(validarJogada(letras,[0,1,2,3],dic,{cafe:{pontos:1}}).erro);
});
teste('Relógio por prazo absoluto, independente da quantidade de intervalos', () => {
  assert.equal(tempoRestante(1000,1000),180);
  assert.equal(tempoRestante(1000,101001),80);
  assert.equal(tempoRestante(1000,181000),0);
  assert.equal(tempoRestante(1000,999999),0);
  assert.equal(totalizar({casa:{pontos:1},palavras:{pontos:11}}),12);
});
