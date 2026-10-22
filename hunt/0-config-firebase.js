// ============================================================
//  FIREBASE PROJECT CREDENTIALS  — FILL THESE IN
//  Firebase console → Project settings → Your apps → SDK setup and config.
//  A web apiKey is NOT a secret; keep every quote and the closing "};".
// ============================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY_VALUE",
  authDomain:        "YOUR_AUTHDOMAIN_VALUE",
  projectId:         "YOUR_PROJECTID_VALUE",
  storageBucket:     "YOUR_STORAGEBUCKET_VALUE",
  messagingSenderId: "YOUR_MESSAGINGSENDERID_VALUE",
  appId:             "YOUR_APPID_VALUE"
  // measurementId is optional (Google Analytics only) — omit if unused.
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
