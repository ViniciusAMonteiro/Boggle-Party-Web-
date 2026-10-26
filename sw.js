// Incremente a versão sempre que publicar arquivos atualizados.
const CACHE = 'boggle-party-v1.0.0';
const PREFIXO = 'boggle-party-';
const ARQUIVOS = ['./','./index.html','./css/estilo.css','./js/app.js','./js/tabuleiro.js','./js/jogo.js','./js/dicionario.js','./js/firebase-config.js','./js/multijogador.js','./dicionario.json','./manifest.json','./icones/icone-192.png','./icones/icone-512.png','./icones/icone-maskable-512.png'];
self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS)));
  // A atualização aguarda as abas antigas fecharem para não misturar versões em partidas.
});
self.addEventListener('activate', evento => {
  evento.waitUntil(caches.keys().then(chaves => Promise.all(chaves.filter(chave => chave.startsWith(PREFIXO) && chave !== CACHE).map(chave => caches.delete(chave)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', evento => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const escopo = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(escopo)) return;
  // Não armazena Firebase/CDN. O modo online sempre depende de rede real.
  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (evento.request.mode === 'navigate') return await cache.match('./index.html') || fetch(evento.request);
    return await cache.match(evento.request, {ignoreSearch:true}) || fetch(evento.request);
  })());
});
