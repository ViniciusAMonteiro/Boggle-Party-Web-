// Conjunto clássico de 16 dados, edição inglesa de 1987 (não é uma edição PT-BR).
export const DADOS = ['AAEEGN','ABBJOO','ACHOPS','AFFKPS','AOOTTW','CIMOTU','DEILRX','DELRVY','DISTTY','EEGHNW','EEINSU','EHRTVW','EIOSST','ELRTTY','HIMNQU','HLNNRZ'].map(dado => [...dado].map(letra => letra === 'Q' ? 'Qu' : letra));
export function aleatorioComSeed(seed) {
  let estado = Number(seed) >>> 0;
  return () => { estado += 0x6D2B79F5; let t = estado; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function novaSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }
export function gerarTabuleiro(seed) {
  const sortear = aleatorioComSeed(seed);
  const letras = DADOS.map(dado => dado[Math.floor(sortear() * 6)]);
  for (let i = letras.length - 1; i > 0; i--) { const j = Math.floor(sortear() * (i + 1)); [letras[i], letras[j]] = [letras[j], letras[i]]; }
  return letras;
}
export function adjacentes(a, b) {
  return a !== b && Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) <= 1 && Math.abs(a % 4 - b % 4) <= 1;
}
export function caminhoValido(caminho) {
  return Array.isArray(caminho) && caminho.length > 0 && caminho.length <= 16 && new Set(caminho).size === caminho.length && caminho.every((n, i) => Number.isInteger(n) && n >= 0 && n < 16 && (!i || adjacentes(caminho[i-1], n)));
}
export function palavraDoCaminho(letras, caminho) { return caminho.map(i => letras[i]).join(''); }
export class Tabuleiro {
  constructor(elemento, aoEnviar, aoSelecionar) {
    this.elemento = elemento; this.aoEnviar = aoEnviar; this.aoSelecionar = aoSelecionar;
    this.caminho = []; this.ativo = false; this.ponteiro = null;
    elemento.addEventListener('pointerdown', evento => {
      if (!this.ativo || this.ponteiro !== null || (evento.pointerType === 'mouse' && evento.button !== 0)) return;
      const indice = this.indiceEm(evento.clientX, evento.clientY);
      if (indice === null) return;
      evento.preventDefault(); this.caminho = []; this.ponteiro = evento.pointerId;
      elemento.setPointerCapture(evento.pointerId); this.adicionar(indice);
    });
    elemento.addEventListener('pointermove', evento => {
      if (evento.pointerId !== this.ponteiro) return;
      // Eventos intermediários reduzem saltos quando o dedo se move rápido.
      const eventos = evento.getCoalescedEvents?.() || [evento];
      for (const ponto of eventos.length ? eventos : [evento]) {
        const indice = this.indiceEm(ponto.clientX, ponto.clientY);
        if (indice !== null) this.adicionar(indice);
      }
    });
    elemento.addEventListener('pointerup', evento => {
      if (evento.pointerId !== this.ponteiro) return;
      this.ponteiro = null; this.enviar();
    });
    for (const tipo of ['pointercancel', 'lostpointercapture']) elemento.addEventListener(tipo, () => { if (this.ponteiro !== null) this.limpar(); });
    elemento.addEventListener('keydown', evento => {
      if (!this.ativo) return;
      const indice = Number(evento.target.dataset.indice);
      if (evento.key === 'Escape') this.limpar();
      if (evento.key === 'Enter') { evento.preventDefault(); this.enviar(); }
      if (evento.key === ' ' && Number.isInteger(indice)) { evento.preventDefault(); this.adicionar(indice); }
      const passos = {ArrowRight:1, ArrowLeft:-1, ArrowUp:-4, ArrowDown:4};
      if (passos[evento.key]) { evento.preventDefault(); this.botoes[(indice + passos[evento.key] + 16) % 16].focus(); }
    });
    this.observador = new ResizeObserver(() => this.desenhar()); this.observador.observe(elemento);
  }
  montar(letras) {
    this.letras = letras; this.limpar(); this.elemento.replaceChildren(); this.botoes = [];
    letras.forEach((letra, indice) => {
      const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'letra'; botao.dataset.indice = indice;
      botao.textContent = letra; botao.setAttribute('aria-label', `Letra ${letra}, linha ${Math.floor(indice/4)+1}, coluna ${indice%4+1}`);
      this.botoes.push(botao); this.elemento.append(botao);
    });
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.svg.classList.add('traco'); this.svg.setAttribute('aria-hidden','true');
    this.linha = document.createElementNS(this.svg.namespaceURI, 'polyline'); this.svg.append(this.linha); this.elemento.append(this.svg);
    this.habilitar(true);
  }
  habilitar(ativo) { this.ativo = ativo; this.botoes?.forEach(b => b.disabled = !ativo); if (!ativo) this.limpar(); }
  indiceEm(x, y) {
    const alvo = document.elementFromPoint(x,y)?.closest('[data-indice]');
    return alvo && this.elemento.contains(alvo) ? Number(alvo.dataset.indice) : null;
  }
  adicionar(indice) {
    if (!this.ativo || this.caminho.includes(indice) || (this.caminho.length && !adjacentes(this.caminho.at(-1), indice))) return;
    this.caminho.push(indice); this.desenhar(); this.aoSelecionar(palavraDoCaminho(this.letras, this.caminho));
  }
  desenhar() {
    if (!this.linha) return;
    const caixa = this.elemento.getBoundingClientRect();
    this.botoes.forEach((b,i) => { b.classList.toggle('selecionada', this.caminho.includes(i)); b.setAttribute('aria-pressed', String(this.caminho.includes(i))); });
    this.svg.setAttribute('viewBox', `0 0 ${caixa.width} ${caixa.height}`);
    this.linha.setAttribute('points', this.caminho.map(i => { const r = this.botoes[i].getBoundingClientRect(); return `${r.x-caixa.x+r.width/2},${r.y-caixa.y+r.height/2}`; }).join(' '));
  }
  enviar() { const caminho = [...this.caminho]; this.limpar(); if (caminho.length && this.ativo) this.aoEnviar(caminho); }
  limpar() { this.caminho = []; this.ponteiro = null; this.desenhar(); this.aoSelecionar(''); }
}
