import { conectarFirebase } from './firebase-config.js';
import { novaSeed } from './tabuleiro.js';
import { DURACAO, totalizar } from './jogo.js';
export class Multijogador {
  constructor() { this.codigo = null; this.conectado = false; this.desvio = 0; this.ouvintes = []; }
  async preparar() {
    if (this.f) return;
    const f = this.f = await conectarFirebase();
    this.ouvintes.push(f.onValue(f.ref(f.db, '.info/serverTimeOffset'), s => this.desvio = s.val() || 0));
    this.ouvintes.push(f.onValue(f.ref(f.db, '.info/connected'), s => {
      this.conectado = s.val() === true;
      this.aoConexao?.(this.conectado);
      if (this.conectado && this.codigo) this.presenca().catch(erro => this.aoErro?.(erro));
    }));
    // Aguarda uma conexão real; o SDK também mantém uma fila local de escritas.
    await new Promise((resolver, rejeitar) => {
      const limite = setTimeout(() => { cancelar(); rejeitar(new Error('Sem conexão com o Firebase. Verifique a internet e a configuração.')); }, 12000);
      const cancelar = f.onValue(f.ref(f.db,'.info/connected'), s => { if (s.val()) { clearTimeout(limite); cancelar(); resolver(); } });
    });
  }
  agora() { return Date.now() + this.desvio; }
  exigirConexao() { if (!this.conectado) throw new Error('Conexão perdida. Aguarde reconectar para enviar palavras.'); }
  async criar(nome) {
    await this.preparar(); this.exigirConexao();
    const f = this.f, alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let tentativa = 0; tentativa < 8; tentativa++) {
      const codigo = [...crypto.getRandomValues(new Uint8Array(6))].map(n => alfabeto[n % alfabeto.length]).join('');
      const resultado = await f.runTransaction(f.ref(f.db,`salas/${codigo}`), sala => {
        if (sala !== null) return;
        return { config:{host:f.uid, seed:novaSeed(), estado:'lobby', timestampInicio:0, rodada:0, criadoEm:f.serverTimestamp()}, jogadores:{[f.uid]:{nome, pontuacao:0, online:true}} };
      }, {applyLocally:false});
      if (resultado.committed) { this.codigo = codigo; await this.presenca(); return codigo; }
    }
    throw new Error('Não foi possível criar o código. Tente novamente.');
  }
  async entrar(codigo, nome) {
    await this.preparar(); this.exigirConexao();
    codigo = codigo.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(codigo)) throw new Error('O código deve ter 6 letras ou números.');
    const f = this.f, endereco = f.ref(f.db, `salas/${codigo}`);
    // A leitura inicial aquece o cache antes da transação; o servidor resolve concorrência.
    await f.get(endereco);
    let motivo = 'Sala não encontrada.';
    const resultado = await f.runTransaction(endereco, sala => {
      if (!sala?.config) return;
      const existente = sala.jogadores?.[f.uid];
      if (!existente && sala.config.estado !== 'lobby') { motivo = 'A partida já começou. Aguarde uma nova rodada.'; return; }
      if (!existente && Object.keys(sala.jogadores || {}).length >= 8) { motivo = 'Sala cheia: limite de 8 jogadores.'; return; }
      sala.jogadores ||= {};
      sala.jogadores[f.uid] = {...(existente || {pontuacao:0}), nome, online:true};
      return sala;
    }, {applyLocally:false});
    if (!resultado.committed) throw new Error(motivo);
    this.codigo = codigo; await this.presenca();
  }
  async presenca() {
    const f = this.f, codigo = this.codigo;
    if (!codigo) return;
    const online = f.ref(f.db,`salas/${codigo}/jogadores/${f.uid}/online`);
    await f.onDisconnect(online).set(false);
    if (this.codigo === codigo) await f.set(online,true);
    else await f.onDisconnect(online).cancel();
  }
  observar(aoMudar, aoErro) {
    this.cancelarSala?.(); this.aoErro = aoErro;
    const f = this.f;
    this.cancelarSala = f.onValue(f.ref(f.db,`salas/${this.codigo}`), s => aoMudar(s.val()), aoErro);
  }
  async iniciar() {
    this.exigirConexao(); const f = this.f;
    const resultado = await f.runTransaction(f.ref(f.db,`salas/${this.codigo}`), sala => {
      if (!sala || sala.config.host !== f.uid || sala.config.estado !== 'lobby' || !Object.values(sala.jogadores || {}).some(j => j.online)) return;
      sala.config = {...sala.config, seed:novaSeed(), estado:'em_andamento', timestampInicio:f.serverTimestamp(), rodada:(sala.config.rodada || 0)+1};
      sala.palavras = null;
      Object.values(sala.jogadores).forEach(j => j.pontuacao = 0);
      return sala;
    }, {applyLocally:false});
    if (!resultado.committed) throw new Error('Somente o anfitrião pode iniciar uma sala no lobby.');
  }
  async registrar(rodada, jogada, caminho) {
    this.exigirConexao(); const f = this.f;
    const resultado = await f.runTransaction(f.ref(f.db,`salas/${this.codigo}`), sala => {
      if (!sala || sala.config.rodada !== rodada || sala.config.estado !== 'em_andamento' || this.agora() >= sala.config.timestampInicio + DURACAO || !sala.jogadores?.[f.uid]) return;
      sala.palavras ||= {}; sala.palavras[f.uid] ||= {};
      if (sala.palavras[f.uid][jogada.palavra]) return;
      sala.palavras[f.uid][jogada.palavra] = {pontos:jogada.pontos, caminho, enviadoEm:f.serverTimestamp()};
      sala.jogadores[f.uid].pontuacao = totalizar(sala.palavras[f.uid]);
      return sala;
    }, {applyLocally:false});
    if (!resultado.committed) throw new Error('Palavra repetida ou rodada encerrada.');
  }
  async finalizar(rodada) {
    if (!this.conectado || !this.codigo) return;
    const f = this.f;
    await f.runTransaction(f.ref(f.db,`salas/${this.codigo}/config`), config => {
      if (!config || config.rodada !== rodada || config.estado !== 'em_andamento' || this.agora() < config.timestampInicio + DURACAO) return;
      return {...config, estado:'finalizado'};
    }, {applyLocally:false});
  }
  async voltarLobby() {
    this.exigirConexao(); const f = this.f;
    const resultado = await f.runTransaction(f.ref(f.db,`salas/${this.codigo}`), sala => {
      if (!sala || sala.config.host !== f.uid || sala.config.estado !== 'finalizado') return;
      sala.config.estado = 'lobby'; sala.config.timestampInicio = 0; sala.palavras = null;
      Object.values(sala.jogadores).forEach(j => j.pontuacao = 0); return sala;
    }, {applyLocally:false});
    if (!resultado.committed) throw new Error('Aguarde o anfitrião voltar ao lobby.');
  }
  async sair() {
    this.cancelarSala?.(); this.cancelarSala = null;
    const codigo = this.codigo; this.codigo = null;
    if (!codigo || !this.f) return;
    const f = this.f, online = f.ref(f.db,`salas/${codigo}/jogadores/${f.uid}/online`);
    // Se estiver offline, onDisconnect já sinaliza a ausência no servidor.
    if (!this.conectado) return;
    await f.runTransaction(f.ref(f.db,`salas/${codigo}`), sala => {
      if (!sala) return;
      if (sala.config.estado === 'lobby') {
        delete sala.jogadores?.[f.uid];
        const restantes = Object.keys(sala.jogadores || {});
        if (!restantes.length) return null;
        if (sala.config.host === f.uid) sala.config.host = restantes.find(id => sala.jogadores[id].online) || restantes[0];
      } else if (sala.jogadores?.[f.uid]) sala.jogadores[f.uid].online = false;
      return sala;
    }, {applyLocally:false});
    await f.onDisconnect(online).cancel();
  }
  async ranking() {
    await this.preparar(); this.exigirConexao(); const f = this.f;
    const dados = await f.get(f.query(f.ref(f.db,'rankingSolo'), f.orderByChild('pontuacao'), f.limitToLast(10)));
    return Object.values(dados.val() || {}).sort((a,b) => b.pontuacao-a.pontuacao);
  }
  async salvarRecorde(nome, pontuacao) {
    await this.preparar(); this.exigirConexao(); const f = this.f;
    await f.runTransaction(f.ref(f.db,`rankingSolo/${f.uid}`), atual => {
      if (atual && atual.pontuacao >= pontuacao) return;
      return {nome, pontuacao, atualizadoEm:f.serverTimestamp()};
    }, {applyLocally:false});
  }
}
