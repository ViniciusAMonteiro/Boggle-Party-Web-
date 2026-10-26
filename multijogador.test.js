import teste from 'node:test';
import assert from 'node:assert/strict';
import {Multijogador} from '../js/multijogador.js';
// Banco simulado: verifica a lógica das transações; não substitui testes com o Firebase real.
function criarSimulacao() {
  let sala = {config:{host:'host',seed:12,estado:'lobby',rodada:0,timestampInicio:0},jogadores:{host:{nome:'Edu',online:true,pontuacao:0}}};
  const participante = uid => {
    const cliente = new Multijogador(); cliente.codigo = 'ABC123'; cliente.conectado = true;
    cliente.f = {uid,db:{},ref:(_,caminho)=>caminho,serverTimestamp:()=>Date.now(),get:async()=>{},onDisconnect:()=>({set:async()=>{},cancel:async()=>{}}),set:async()=>{},runTransaction:async(endereco,alterar)=>{
      const config = endereco.endsWith('/config');
      const atual = structuredClone(config ? sala.config : sala);
      const novo = alterar(atual);
      if (novo === undefined) return {committed:false};
      if (config) sala.config = novo; else sala = novo;
      return {committed:true};
    }};
    return cliente;
  };
  return {participante, ler:()=>sala};
}
teste('Limite de oito jogadores e início exclusivo do anfitrião',async()=>{
  const {participante,ler}=criarSimulacao();
  for(let i=1;i<8;i++) await participante('p'+i).entrar('ABC123','Jogador '+i);
  await assert.rejects(()=>participante('nono').entrar('ABC123','Nono'),/cheia/);
  await assert.rejects(()=>participante('p1').iniciar(),/anfitrião/);
  await participante('host').iniciar();
  assert.equal(Object.keys(ler().jogadores).length,8);
  assert.equal(ler().config.estado,'em_andamento');
  await assert.rejects(()=>participante('novo').entrar('ABC123','Novo'),/começou/);
});
teste('Pontuações independentes, duplicação rejeitada e rodada antiga bloqueada',async()=>{
  const {participante,ler}=criarSimulacao(); const host=participante('host'), amigo=participante('amigo');
  await amigo.entrar('ABC123','Amigo'); await host.iniciar();
  await host.registrar(1,{palavra:'casa',pontos:1},[0,1,2,3]);
  await amigo.registrar(1,{palavra:'casa',pontos:1},[0,1,2,3]);
  assert.equal(ler().jogadores.host.pontuacao,1);assert.equal(ler().jogadores.amigo.pontuacao,1);
  await assert.rejects(()=>host.registrar(1,{palavra:'casa',pontos:1},[0,1,2,3]));
  await assert.rejects(()=>host.registrar(0,{palavra:'outra',pontos:2},[0,1,2,3]));
  assert.equal(ler().jogadores.host.pontuacao,1);
});
teste('Fim, reinício limpo e saída no lobby transfere o anfitrião',async()=>{
  const {participante,ler}=criarSimulacao(); const host=participante('host'), amigo=participante('amigo');
  await amigo.entrar('ABC123','Amigo'); await host.iniciar(); host.desvio=181000;
  await assert.rejects(()=>host.registrar(1,{palavra:'casa',pontos:1},[0,1,2,3]));
  await host.finalizar(1); assert.equal(ler().config.estado,'finalizado');
  await assert.rejects(()=>amigo.voltarLobby());
  await host.voltarLobby(); assert.equal(ler().config.estado,'lobby');assert.equal(ler().palavras,null);
  await host.sair(); assert.equal(ler().config.host,'amigo');
});
