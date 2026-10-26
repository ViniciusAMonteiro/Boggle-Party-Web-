// A normalização mantém Qu como duas letras e aceita palavras sem acentos.
export function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
export class Dicionario {
  constructor() { this.palavras = new Set(); }
  async carregar() {
    const resposta = await fetch(new URL('./dicionario.json', import.meta.url));
    if (!resposta.ok) throw new Error('Não foi possível carregar o dicionário. Recarregue com internet.');
    const lista = await resposta.json();
    this.palavras = new Set(lista.map(normalizar));
    if (this.palavras.size < 5000) throw new Error('Dicionário incompleto.');
    return this;
  }
  contem(palavra) { return this.palavras.has(normalizar(palavra)); }
}
