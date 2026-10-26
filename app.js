import { configuracaoFirebase } from './firebase-config.js';
import { Dicionario } from './dicionario.js';
import { gerarTabuleiro, novaSeed, Tabuleiro } from './tabuleiro.js';
import { Relogio, validarJogada, totalizar } from './jogo.js';
import { Multijogador } from './multijogador.js';
const porId = id => document.getElementById(id);
const firebaseConfigurado = !configuracaoFirebase.apiKey.startsWith('COLE_');
const dicionario = new Dicionario(), online = new Multijogador(), relogio = new Relogio();
let tela = 'inicio', modo = null, sala = null, letras = [], palavras = {}, rodadaAtual = null, encerrada = true, inicioSolo = 0, ocupada = false;
let conviteInstalacao, atrasoMensagem;
function lerLocal(chave, padrao = '') { try { return localStorage.getItem(chave) || padrao; } catch { return padrao; } }
function salvarLocal(chave, valor) { try { localStorage.setItem(chave, String(valor)); } catch { mensagem('O armazenamento local está indisponível neste navegador.'); } }
function recorde() { return Number(lerLocal('boggle_recorde', '0')) || 0; }
function atualizarRecorde() { porId('recorde').textContent = `Seu recorde: ${recorde()} pts`; }
function mensagem(texto) {
  clearTimeout(atrasoMensagem); porId('mensagem').textContent = texto; porId('mensagem').hidden = false;
  atrasoMensagem = setTimeout(() => porId('mensagem').hidden = true, 6000);
}
function mostrar(nome) {
  tela = nome; document.querySelectorAll('.tela').forEach(secao => secao.hidden = secao.id !== `tela-${nome}`);
  porId('aviso-conexao').hidden = !(modo === 'online' && !online.conectado);
  window.scrollTo(0,0);
}
function nomeJogador() {
  const nome = porId('nome').value.trim().slice(0,20);
  if (!nome) { porId('nome').focus(); throw new Error('Digite seu nome para começar.'); }
  salvarLocal('boggle_nome', nome); return nome;
}
async function executar(botao, acao) {
  if (ocupada) return;
  ocupada = true; botao.disabled = true;
  try { await acao(); } catch (erro) { mensagem(erro.message || 'Não foi possível concluir. Tente novamente.'); }
  finally { ocupada = false; botao.disabled = false; }
}
const pronto = dicionario.carregar();
pronto.catch(erro => mensagem(erro.message));
const tabuleiro = new Tabuleiro(porId('tabuleiro'), enviarPalavra, palavra => {
  porId('palavra-atual').textContent = palavra || 'Deslize para formar uma palavra';
  porId('palavra-atual').classList.toggle('preenchida', !!palavra);
});
function preencherPalavras(elemento, lista) {
  elemento.replaceChildren();
  Object.entries(lista).sort((a,b) => b[1].pontos-a[1].pontos || a[0].localeCompare(b[0])).forEach(([palavra, dados]) => {
    const item = document.createElement('li'); item.textContent = palavra;
    const pontos = document.createElement('span'); pontos.textContent = `+${dados.pontos}`; item.append(pontos); elemento.append(item);
  });
}
function atualizarPalavras() {
  porId('pontos').textContent = totalizar(palavras);
  const quantidade = Object.keys(palavras).length;
  porId('quantidade-palavras').textContent = `${quantidade} ${quantidade === 1 ? 'palavra' : 'palavras'}`;
  preencherPalavras(porId('palavras-encontradas'), palavras);
}
async function enviarPalavra(caminho) {
  if (encerrada) return;
  const jogada = validarJogada(letras, caminho, dicionario, palavras);
  const retorno = porId('retorno-jogada');
  if (jogada.erro) { retorno.textContent = jogada.erro; return; }
  if (modo === 'solo') {
    if (Date.now() >= inicioSolo + 180000) { finalizarSolo(); return; }
    palavras[jogada.palavra] = {pontos:jogada.pontos, caminho}; atualizarPalavras();
    retorno.textContent = `${jogada.palavra.toUpperCase()} · +${jogada.pontos} ${jogada.pontos === 1 ? 'ponto' : 'pontos'}`;
  } else {
    // A confirmação vem da transação, sem somar pontos otimistas em duplicidade.
    const rodadaEnviada = rodadaAtual;
    retorno.textContent = 'Enviando…';
    try { await online.registrar(rodadaEnviada, jogada, caminho); if (rodadaAtual === rodadaEnviada) retorno.textContent = `${jogada.palavra.toUpperCase()} · +${jogada.pontos}`; }
    catch (erro) { retorno.textContent = erro.message; }
  }
}
function iniciarInterface(seed, inicio, agora, aoFinal) {
  letras = gerarTabuleiro(seed); encerrada = false;
  mostrar('jogo'); tabuleiro.montar(letras); tabuleiro.habilitar(modo === 'solo' || online.conectado);
  porId('modo-jogo').textContent = modo === 'solo' ? 'DESAFIO SOLO' : `SALA ${online.codigo}`;
  porId('retorno-jogada').textContent = ''; atualizarPalavras();
  relogio.iniciar(inicio, agora, segundos => {
    porId('tempo').textContent = `${Math.floor(segundos/60)}:${String(segundos%60).padStart(2,'0')}`;
    porId('tempo').classList.toggle('urgente', segundos <= 20);
    porId('progresso-tempo').style.width = `${segundos/180*100}%`;
  }, aoFinal);
}
async function iniciarSolo() {
  await pronto; await online.sair();
  modo = 'solo'; sala = null; rodadaAtual = null; palavras = {}; inicioSolo = Date.now();
  iniciarInterface(novaSeed(), inicioSolo, () => Date.now(), finalizarSolo);
}
function finalizarSolo() {
  if (encerrada) return;
  encerrada = true; relogio.parar(); tabuleiro.habilitar(false);
  const pontos = totalizar(palavras), anterior = recorde();
  if (pontos > anterior) salvarLocal('boggle_recorde', pontos);
  atualizarRecorde(); mostrar('resultado');
  porId('resumo-resultado').textContent = `${pontos} pontos em ${Object.keys(palavras).length} palavras. ${pontos > anterior ? 'Novo recorde pessoal!' : `Seu recorde: ${recorde()} pontos.`}`;
  preencherRanking(porId('ranking-partida'), [{nome:lerLocal('boggle_nome','Você'), pontuacao:pontos}], true);
  preencherPalavras(porId('palavras-resultado'), palavras);
  porId('botao-novamente').hidden = false;
  const status = porId('status-resultado'); status.textContent = 'Recorde pessoal salvo neste aparelho.';
  // Sem internet/configuração, não há dependência do ranking para continuar jogando.
  if (navigator.onLine && pontos > 0 && firebaseConfigurado) {
    online.salvarRecorde(lerLocal('boggle_nome','Jogador'), pontos).then(() => {
      if (tela === 'resultado' && modo === 'solo') status.textContent = 'Melhor pontuação enviada ao ranking global.';
    }).catch(() => { if (tela === 'resultado' && modo === 'solo') status.textContent = 'Recorde local salvo. Ranking global indisponível (verifique Firebase e internet).'; });
  }
}
function preencherRanking(elemento, jogadores, solo = false) {
  elemento.replaceChildren();
  jogadores.forEach((jogador, i) => {
    const item = document.createElement('li'), posicao = document.createElement('span'), nome = document.createElement('span'), pontos = document.createElement('span');
    // Empates compartilham posição; o nome ordena apenas a apresentação.
    let lugar = i + 1;
    while (lugar > 1 && jogadores[lugar-2].pontuacao === jogador.pontuacao) lugar--;
    posicao.className = 'posicao'; posicao.textContent = String(lugar).padStart(2,'0');
    nome.className = 'nome-jogador'; nome.textContent = jogador.nome + (!solo && jogador.uid === online.f?.uid ? ' (você)' : '');
    pontos.className = 'pontos-jogador'; pontos.textContent = `${jogador.pontuacao} pts`;
    item.append(posicao,nome,pontos); elemento.append(item);
  });
}
function resultadoOnline() {
  encerrada = true; relogio.parar(); tabuleiro.habilitar(false); mostrar('resultado');
  const jogadores = Object.entries(sala.jogadores || {}).map(([uid,j]) => ({...j, uid, pontuacao:totalizar(sala.palavras?.[uid])})).sort((a,b) => b.pontuacao-a.pontuacao || a.nome.localeCompare(b.nome));
  preencherRanking(porId('ranking-partida'), jogadores);
  preencherPalavras(porId('palavras-resultado'), palavras);
  porId('resumo-resultado').textContent = `Você encontrou ${Object.keys(palavras).length} palavras e somou ${totalizar(palavras)} pontos.`;
  const souHost = sala.config.host === online.f.uid;
  porId('botao-novamente').hidden = !souHost;
  porId('status-resultado').textContent = souHost ? 'O ranking recebe as últimas confirmações em tempo real. Pronto para outra?' : 'Aguarde o anfitrião para jogar novamente. O ranking se atualiza em tempo real.';
}
function receberSala(dados) {
  if (modo !== 'online') return;
  if (!dados?.config || !dados.jogadores?.[online.f.uid]) { mensagem('A sala foi encerrada.'); voltarInicio(); return; }
  sala = dados; palavras = sala.palavras?.[online.f.uid] || {};
  const config = sala.config, souHost = config.host === online.f.uid;
  if (config.estado === 'lobby') {
    relogio.parar(); encerrada = true; rodadaAtual = null; mostrar('lobby');
    porId('codigo-sala').textContent = online.codigo;
    const jogadores = Object.entries(sala.jogadores || {});
    porId('quantidade-jogadores').textContent = `${jogadores.length}/8`;
    const lista = porId('lista-jogadores'); lista.replaceChildren();
    jogadores.forEach(([uid,j]) => {
      const item = document.createElement('li'), avatar = document.createElement('span'), nome = document.createElement('span'), estado = document.createElement('span');
      avatar.className = 'avatar'; avatar.textContent = j.nome.slice(0,1).toUpperCase();
      nome.className = 'nome-jogador'; nome.textContent = j.nome + (uid === online.f.uid ? ' (você)' : '');
      estado.className = 'estado-jogador'; estado.textContent = `${uid === config.host ? 'Anfitrião · ' : ''}${j.online ? 'Conectado' : 'Desconectado'}`;
      nome.append(estado); item.append(avatar,nome); lista.append(item);
    });
    porId('botao-iniciar').hidden = !souHost;
    porId('aviso-host').textContent = souHost ? 'Você escolhe quando começar. A partida dura 3 minutos.' : 'Aguarde o anfitrião iniciar a partida.';
  } else if (config.estado === 'em_andamento') {
    if (typeof config.timestampInicio !== 'number') return;
    if (rodadaAtual !== config.rodada) {
      rodadaAtual = config.rodada;
      iniciarInterface(config.seed, config.timestampInicio, () => online.agora(), () => {
        resultadoOnline(); online.finalizar(config.rodada).catch(erro => mensagem(erro.message));
      });
    }
    atualizarPalavras();
    if (encerrada) resultadoOnline();
  } else if (config.estado === 'finalizado') { rodadaAtual = config.rodada; resultadoOnline(); }
}
async function acompanharSala() {
  modo = 'online'; rodadaAtual = null;
  online.observar(receberSala, erro => mensagem(`Firebase: ${erro.message}`));
  const url = new URL(location.href); url.searchParams.set('sala', online.codigo); history.replaceState(null,'',url);
}
async function voltarInicio() {
  encerrada = true; relogio.parar(); tabuleiro.habilitar(false);
  modo = null; sala = null; rodadaAtual = null; mostrar('inicio'); atualizarRecorde();
  const url = new URL(location.href); url.searchParams.delete('sala'); history.replaceState(null,'',url);
  try { await online.sair(); } catch (erro) { mensagem(erro.message); }
}
online.aoConexao = conectado => {
  porId('aviso-conexao').hidden = modo !== 'online' || conectado;
  if (modo === 'online' && !encerrada) tabuleiro.habilitar(conectado);
  if (conectado && modo === 'online' && encerrada && sala?.config.estado === 'em_andamento') online.finalizar(sala.config.rodada).catch(erro => mensagem(erro.message));
};
porId('nome').value = lerLocal('boggle_nome'); atualizarRecorde();
porId('aviso-configuracao').hidden = firebaseConfigurado;
porId('formulario-criar').addEventListener('submit', evento => {
  evento.preventDefault(); executar(evento.submitter, async () => { const nome = nomeJogador(); await pronto; await online.criar(nome); await acompanharSala(); });
});
porId('formulario-entrar').addEventListener('submit', evento => {
  evento.preventDefault(); executar(evento.submitter, async () => { const nome = nomeJogador(); await pronto; await online.entrar(porId('codigo').value,nome); await acompanharSala(); });
});
porId('botao-solo').onclick = evento => executar(evento.currentTarget, async () => { if (!porId('nome').value.trim()) porId('nome').value = 'Jogador'; nomeJogador(); await iniciarSolo(); });
porId('botao-iniciar').onclick = evento => executar(evento.currentTarget, () => online.iniciar());
porId('botao-novamente').onclick = evento => executar(evento.currentTarget, () => modo === 'solo' ? iniciarSolo() : online.voltarLobby());
for (const id of ['botao-inicio','botao-sair-lobby','botao-sair-jogo']) porId(id).onclick = evento => executar(evento.currentTarget, voltarInicio);
porId('botao-convite').onclick = evento => executar(evento.currentTarget, async () => {
  const url = new URL(location.href); url.searchParams.set('sala',online.codigo);
  try {
    if (navigator.share) await navigator.share({title:'Boggle Party Web', text:`Venha jogar! Sala ${online.codigo}`, url:String(url)});
    else { await navigator.clipboard.writeText(String(url)); mensagem('Link do convite copiado!'); }
  } catch (erro) { if (erro.name !== 'AbortError') mensagem(`Envie o endereço desta página ou o código ${online.codigo} aos amigos.`); }
});
porId('botao-ranking').onclick = evento => executar(evento.currentTarget, async () => {
  mostrar('ranking'); porId('lista-ranking').replaceChildren(); porId('status-ranking').textContent = 'Carregando ranking…';
  try { const jogadores = await online.ranking(); preencherRanking(porId('lista-ranking'), jogadores,true); porId('status-ranking').textContent = jogadores.length ? '' : 'Ainda não há recordes. Que tal começar?'; }
  catch (erro) { porId('status-ranking').textContent = erro.message; }
});
porId('fechar-ranking').onclick = () => mostrar('inicio');
porId('codigo').value = (new URL(location.href).searchParams.get('sala') || '').toUpperCase().slice(0,6);
if (porId('codigo').value) mensagem('Você recebeu um convite! Digite seu nome e toque em Entrar.');
window.addEventListener('beforeinstallprompt', evento => { evento.preventDefault(); conviteInstalacao = evento; porId('botao-instalar').hidden = false; });
porId('botao-instalar').onclick = async () => { if (conviteInstalacao) { await conviteInstalacao.prompt(); conviteInstalacao = null; porId('botao-instalar').hidden = true; } };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => mensagem('Cache offline indisponível. O jogo continua no navegador.'));
