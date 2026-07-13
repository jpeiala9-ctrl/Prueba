// ==================== firebase-config.js ====================
// NOTA: Las credenciales de Firebase son públicas por diseño y deben protegerse mediante reglas de seguridad de Firestore y Storage.
const firebaseConfig = {
  apiKey: "AIzaSyCY0nBRMcgPMMoCuXobwVn7GxIR_HKTo9s",
  authDomain: "ri5-zaragoza.firebaseapp.com",
  projectId: "ri5-zaragoza",
  storageBucket: "ri5-zaragoza.firebasestorage.app",
  messagingSenderId: "660832033861",
  appId: "1:660832033861:web:a1ee877a7637c6fda8d72c"
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado correctamente');
  } else {
    console.log('✅ Firebase ya estaba inicializado');
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const { Timestamp, FieldValue } = firebase.firestore;

db.settings({
  ignoreUndefinedProperties: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log('✅ Persistencia de autenticación configurada (LOCAL)'))
  .catch((error) => console.error('❌ Error configurando persistencia de auth:', error));

window.firebaseServices = {
  auth,
  db,
  storage,
  Timestamp,
  FieldValue,
  utils: {
    isOnline: () => navigator.onLine,
    now: () => Timestamp.now(),
    createId: () => db.collection('_').doc().id
  }
};

console.log('✅ firebaseServices listo (con Storage)');