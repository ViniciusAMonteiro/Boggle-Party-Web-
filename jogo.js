import { normalizar } from './dicionario.js';
import { caminhoValido, palavraDoCaminho } from './tabuleiro.js';
export const DURACAO = 180000;
export function pontuar(palavra) {
  const n = normalizar(palavra).length;
  return n < 3 ? 0 : n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11;
}
export function tempoRestante(inicio, agora = Date.now()) { return Math.max(0, Math.ceil((inicio + DURACAO - agora) / 1000)); }
export function validarJogada(letras, caminho, dicionario, encontradas = {}) {
  if (!caminhoValido(caminho)) return {erro:'Selecione letras vizinhas, sem repetir casas.'};
  const palavra = normalizar(palavraDoCaminho(letras, caminho));
  if (palavra.length < 3) return {erro:'Use pelo menos 3 letras.'};
  if (!dicionario.contem(palavra)) return {erro:'Palavra fora do dicionário.'};
  if (Object.hasOwn(encontradas, palavra)) return {erro:'Você já encontrou essa palavra.'};
  return {palavra, pontos:pontuar(palavra)};
}
export function totalizar(palavras = {}) { return Object.values(palavras).reduce((soma, item) => soma + (Number(item.pontos) || 0), 0); }
export class Relogio {
  iniciar(inicio, agora, aoTique, aoFinal) {
    this.parar();
    const atualizar = () => { const segundos = tempoRestante(inicio, agora()); aoTique(segundos); if (!segundos) { this.parar(); aoFinal(); } };
    this.intervalo = setInterval(atualizar, 100); atualizar();
  }
  parar() { clearInterval(this.intervalo); }
}
