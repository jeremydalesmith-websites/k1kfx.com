// ============================================================
//  FIREBASE PROJECT CREDENTIALS  — FILL THESE IN
//  Firebase console → Project settings → Your apps → SDK setup and config.
//  A web apiKey is NOT a secret; keep every quote and the closing "};".
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyA9WCvAZZoAjfwXML6d3xmbhzymznhhLe4",
  authDomain: "k1kfx-foxhunt.firebaseapp.com",
  projectId: "k1kfx-foxhunt",
  storageBucket: "k1kfx-foxhunt.firebasestorage.app",
  messagingSenderId: "809340851296",
  appId: "1:809340851296:web:a4b7fb26985ac3aaf9df05"
};
(function () {
  var unfilled = Object.keys(firebaseConfig).filter(function (k) {
    if (k === 'measurementId') return false;
    var v = firebaseConfig[k];
    return !v || /^YOUR_|^PASTE_/.test(v);
  });
  if (unfilled.length) {
    var m = 'Firebase is not configured: 0-config-firebase.js still has placeholder ' +
            'values for [' + unfilled.join(', ') + ']. Replace them with your real ' +
            'Firebase web-app credentials.';
    console.error('[Fox Pursuit] ' + m);
    try { window.__FOXHUNT_CONFIG_ERROR = m; } catch (e) {}
  }
})();
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') console.warn('[Fox Pursuit] Offline persistence unavailable (multiple tabs).');
  else if (err.code === 'unimplemented') console.warn('[Fox Pursuit] Offline persistence not supported by this browser.');
  else console.warn('[Fox Pursuit] Offline persistence error:', err);
});
