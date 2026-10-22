// ============================================================
//  0-config-admin.js — email/password gate for the admin pages
//  (admin.html and analytics.html).
//
//  WHY A SEPARATE LOGIN: the app itself uses anonymous sign-in,
//  whose UID changes per browser/device and whenever site data is
//  cleared. The admin pages instead use a dedicated email/password
//  account whose UID is STABLE everywhere — configure it once and it
//  simply works, on any browser or device. To keep this admin session
//  from disturbing the app's anonymous session (Firebase allows only
//  one signed-in user per app), it runs on a SECONDARY Firebase app
//  instance.
//
//  ── SETUP (one time, per deployment) ────────────────────────
//   1. Firebase Console → Authentication → Sign-in method →
//      ENABLE the "Email/Password" provider.
//   2. Authentication → Users → Add user: create your admin
//      account (any email + a password).
//   3. Copy that account's User UID.
//   4. Put the UID in ADMIN_UIDS below (multiple admins = more lines).
//   5. Put the SAME UID(s) in your Firestore analytics read rules and
//      Publish.
//
//  IMPORTANT: ADMIN_UIDS is deployment-specific — preserve it when you
//  upgrade to a newer build (don't let a fresh copy overwrite it).
// ============================================================

const ADMIN_UIDS = [
  'REPLACE_WITH_YOUR_ADMIN_UID'
];

let _adminApp = null;
let adminAuth = null;
let adminDb   = null;
var _pendingGateMsg = '';

function _initAdminApp() {
  if (_adminApp) return;
  _adminApp = firebase.apps.find(function (a) { return a.name === 'foxhuntAdmin'; })
    || firebase.initializeApp(firebaseConfig, 'foxhuntAdmin');
  adminAuth = _adminApp.auth();
  adminDb   = _adminApp.firestore();
}

// Global show/hide-password toggle (reused by the login form and admin.html).
function fhTogglePw(id, el) {
  var inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; el.textContent = 'hide'; }
  else { inp.type = 'password'; el.textContent = 'show'; }
}

// A password input with a show/hide toggle.
function _pwField(id, placeholder, autocomplete) {
  return '<div style="position:relative;margin-bottom:0.6rem">' +
    '<input id="' + id + '" type="password" placeholder="' + placeholder + '" autocomplete="' + autocomplete + '" ' +
      'style="width:100%;box-sizing:border-box;padding:0.55rem 3.2rem 0.55rem 0.7rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text,#d8dce8);font-family:var(--mono);font-size:0.85rem"/>' +
    '<span onclick="fhTogglePw(\'' + id + '\',this)" style="position:absolute;right:0.65rem;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--muted);font-size:0.68rem;user-select:none">show</span>' +
    '</div>';
}

function _gate() {
  var g = document.getElementById('fh-admin-gate');
  if (!g) {
    g = document.createElement('div');
    g.id = 'fh-admin-gate';
    g.style.cssText = 'max-width:340px;margin:2rem auto;font-family:var(--mono)';
    var wrap = document.querySelector('.page-wrap') || document.body;
    wrap.insertBefore(g, wrap.firstChild);
  }
  g.style.display = 'block';
  return g;
}
function _hideGate() {
  var g = document.getElementById('fh-admin-gate');
  if (g) g.style.display = 'none';
}

// Signed-out state: email + password login form.
function _showLoginForm(message) {
  var g = _gate();
  g.innerHTML =
    '<div class="card" style="padding:1.4rem">' +
    '<div style="color:var(--accent);font-size:0.95rem;margin-bottom:0.9rem">Admin sign-in</div>' +
    '<input id="fh-admin-email" type="email" placeholder="Admin email" autocomplete="username" ' +
      'style="width:100%;box-sizing:border-box;margin-bottom:0.6rem;padding:0.55rem 0.7rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text,#d8dce8);font-family:var(--mono);font-size:0.85rem"/>' +
    _pwField('fh-admin-pass', 'Password', 'current-password') +
    '<button id="fh-admin-signin" class="btn" style="width:100%;margin-top:0.3rem">Sign in</button>' +
    '<div id="fh-admin-msg" style="font-size:0.75rem;margin-top:0.7rem;min-height:1em">' + (message || '') + '</div>' +
    '</div>';
  var doSignIn = function () {
    var email = document.getElementById('fh-admin-email').value.trim();
    var pass  = document.getElementById('fh-admin-pass').value;
    var msg   = document.getElementById('fh-admin-msg');
    msg.style.color = 'var(--muted)';
    msg.textContent = 'Signing in\u2026';
    adminAuth.signInWithEmailAndPassword(email, pass).catch(function () {
      msg.style.color = 'var(--error)';
      msg.textContent = 'Sign-in failed. Check the email and password (and that the Email/Password provider is enabled).';
    });
  };
  document.getElementById('fh-admin-signin').onclick = doSignIn;
  document.getElementById('fh-admin-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSignIn(); });
}

// Signed-in-but-not-admin state: message + sign-out only. No login form is shown,
// so you can't get stuck re-authenticating the same account.
function _showNotAdmin(user) {
  var g = _gate();
  g.innerHTML =
    '<div class="card" style="padding:1.4rem">' +
    '<div style="color:var(--error);font-size:0.9rem;margin-bottom:0.7rem">This account is not an admin.</div>' +
    '<div style="color:var(--muted);font-size:0.7rem;margin-bottom:0.9rem;word-break:break-all">UID: ' + user.uid + '</div>' +
    '<button id="fh-na-signout" class="btn" style="width:100%">Sign out &amp; use a different account</button>' +
    '</div>';
  document.getElementById('fh-na-signout').onclick = adminSignOut;
}

function _showStatus(user) {
  var s = document.getElementById('fh-admin-status');
  if (!s) {
    s = document.createElement('div');
    s.id = 'fh-admin-status';
    s.style.cssText = 'font-family:var(--mono);font-size:0.72rem;color:var(--muted);margin:0.1rem 0 0.7rem';
    var wrap = document.querySelector('.page-wrap') || document.body;
    wrap.insertBefore(s, wrap.firstChild);
  }
  s.innerHTML = '\u2713 Signed in as admin (' + (user.email || user.uid) +
    ') \u00b7 <a href="#" onclick="adminSignOut();return false" style="color:var(--accent)">Sign out</a>';
  s.style.display = 'block';
}
function _hideStatus() {
  var s = document.getElementById('fh-admin-status');
  if (s) s.style.display = 'none';
}

// User-initiated sign-out. Stamps a per-admin revocation time (so this admin's
// OTHER sessions are forced to re-login on their next load), then reloads to a
// clean slate — which also clears any content shown while signed in.
async function adminSignOut() {
  if (adminAuth && adminAuth.currentUser) {
    try {
      await adminDb.collection('adminRevocations').doc(adminAuth.currentUser.uid)
        .set({ revokeBefore: Date.now() }, { merge: true });
    } catch (e) {}
    try { await adminAuth.signOut(); } catch (e) {}
  }
  location.reload();
}

// Change this admin account's email and/or password. Requires the current
// password (Firebase treats these as security-sensitive). The account's UID does
// NOT change, so ADMIN_UIDS and the rules are unaffected. Email changes are sent
// as a confirmation link to the new address (verify-before-update).
async function adminChangeCredentials(currentPass, newEmail, newPass) {
  var user = adminAuth && adminAuth.currentUser;
  if (!user) throw new Error('Not signed in.');
  var cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
  await user.reauthenticateWithCredential(cred);
  var done = [];
  if (newPass) { await user.updatePassword(newPass); done.push('Password updated.'); }
  if (newEmail && newEmail !== user.email) {
    await user.verifyBeforeUpdateEmail(newEmail);
    done.push('A confirmation link was sent to ' + newEmail + '; the email changes once you click it.');
  }
  return done.length ? done.join(' ') : 'Nothing to change.';
}

// Gate an admin page. Calls back(user, adminDb) once an authorized admin is
// signed in. Otherwise shows the login form (signed out) or a sign-out prompt
// (signed in with a non-admin account).
function requireAdmin(callback) {
  _initAdminApp();
  var called = false;
  adminAuth.onAuthStateChanged(async function (user) {
    if (user && ADMIN_UIDS.indexOf(user.uid) !== -1) {
      if (called) return;
      called = true;
      // Global sign-out check: if this session authenticated before this admin's
      // most recent sign-out (on any device), force a fresh login.
      try {
        var tr = await user.getIdTokenResult();
        var authTime = new Date(tr.authTime).getTime();
        var snap = await adminDb.collection('adminRevocations').doc(user.uid).get();
        var revokeBefore = snap.exists ? (snap.data().revokeBefore || 0) : 0;
        if (authTime && revokeBefore && authTime < revokeBefore) {
          _pendingGateMsg = 'You were signed out on another device. Please sign in again.';
          called = false;
          await adminAuth.signOut();
          return;
        }
      } catch (e) { /* if the check can't run, allow access (fail open) */ }
      _hideGate();
      _showStatus(user);
      callback(user, adminDb);
    } else if (user) {
      called = false;
      _hideStatus();
      _showNotAdmin(user);
    } else {
      called = false;
      _hideStatus();
      _showLoginForm(_pendingGateMsg);
      _pendingGateMsg = '';
    }
  });
}
