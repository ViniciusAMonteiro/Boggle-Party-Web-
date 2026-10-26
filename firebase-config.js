// Cole aqui o objeto exibido em Configurações do projeto > Seus aplicativos.
// Estas são configurações públicas de cliente; nunca coloque chave de serviço aqui.
export const configuracaoFirebase = {
  apiKey: 'COLE_SUA_API_KEY',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  databaseURL: 'https://SEU_PROJETO-default-rtdb.firebaseio.com',
  projectId: 'SEU_PROJETO',
  storageBucket: 'SEU_PROJETO.firebasestorage.app',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID'
};
let promessa;
export function conectarFirebase() {
  if (promessa) return promessa;
  if (configuracaoFirebase.apiKey.startsWith('COLE_')) return Promise.reject(new Error('Configure js/firebase-config.js para jogar online. O modo solo já está disponível.'));
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
