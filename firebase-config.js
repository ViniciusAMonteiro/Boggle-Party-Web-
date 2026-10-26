// Configuração pública do aplicativo Boggle Party Web, com URL do Realtime Database.
// Estas são configurações públicas de cliente; nunca coloque chave de serviço aqui.
export const configuracaoFirebase = {
  "apiKey": "AIzaSyBsOlsQe9FzLvmCAq-bCAlzIyFPlq-76S8",
  "authDomain": "boggle-party-web-724fc.firebaseapp.com",
  "databaseURL": "https://boggle-party-web-724fc-default-rtdb.firebaseio.com",
  "projectId": "boggle-party-web-724fc",
  "storageBucket": "boggle-party-web-724fc.firebasestorage.app",
  "messagingSenderId": "132258899806",
  "appId": "1:132258899806:web:cb99d9ec9ad37c943551cf"
};
let promessa;
export function conectarFirebase() {
  if (promessa) return promessa;
  if (configuracaoFirebase.apiKey.startsWith('COLE_')) return Promise.reject(new Error('Configure firebase-config.js para jogar online. O modo solo já está disponível.'));
  promessa = (async () => {
    // Importação sob demanda: o solo não depende do CDN ou de autenticação.
    const [aplicativo, autenticacao, banco] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js')
    ]);
    const app = aplicativo.getApps().length ? aplicativo.getApp() : aplicativo.initializeApp(configuracaoFirebase);
    const auth = autenticacao.getAuth(app);
    await autenticacao.setPersistence(auth, autenticacao.browserSessionPersistence);
    await autenticacao.signInAnonymously(auth);
    const db = banco.getDatabase(app);
    return { ...banco, db, uid:auth.currentUser.uid };
  })().catch(erro => { promessa = null; throw erro; });
  return promessa;
}
