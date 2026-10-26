// Incremente a versão sempre que publicar arquivos atualizados.
const CACHE = 'boggle-party-sem-pastas-v1.0.3-firebase';
const PREFIXO = 'boggle-party-';
const ARQUIVOS = ['./','./index.html','./estilo.css','./app.js','./tabuleiro.js','./jogo.js','./dicionario.js','./firebase-config.js','./multijogador.js','./dicionario.json','./manifest.json','./icone-192.png','./icone-512.png','./icone-maskable-512.png'];
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
