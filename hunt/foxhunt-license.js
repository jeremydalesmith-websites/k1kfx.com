// ============================================================
//  Fox Pursuit — License Checker                       (v71; FP12 2026-10-01)
//
//  Verifies the license key held in 0-config-license.js using
//  ECDSA P-256, entirely inside the browser. No license server,
//  no Firebase, no network of any kind on this path.
//
//  DESIGN RULE (v71): a network result may only ever UPGRADE
//  trust. Nothing here walls, degrades, or disables on the
//  strength of a network answer. That is what allows a licensed
//  installation to keep working indefinitely, with or without
//  its author, its seller, or any service they once depended on.
//
//  Do not modify or remove this file.
// ============================================================

(function () {
  'use strict';

  // ── Andrew's license PUBLIC key (raw P-256 point, base64url) ──
  // NOT a secret — it ships in every package by design. It can only
  // CHECK keys, never mint them. Generate with foxpursuit-keygen.js.
  const LICENSE_PUBKEY = 'BMRn5-28UCVwAL_bvuUCL_idE1M-BUkpBk4gT7Nlz498yj22lfmN_agTwsVIi7IoB2w7gA7FfYXxbRMfY1aMVv0';
  // ── Which edition this package is (FP12, 2026-10-01) ──
  // Every site key carries a signed claim "ed". This package accepts only keys
  // whose claim matches; a Solo key, or a key minted before FP12 (no claim), is
  // refused with a plain message. The ONLY line that differs between the Team
  // and Solo copies of this file.
  const FOXHUNT_EDITION = 'team';
  // ─────────────────────────────────────────────────────────────

  // Pages that never need a license check
  const EXEMPT = ['setup.html', 'setup.php'];
  const page   = window.location.pathname.split('/').pop() || '';
  if (EXEMPT.includes(page)) return;

  // ── Solo edition (FP12, 2026-10-01) ─────────────────────────
  // In Solo there is no 0-config-license.js: the site key lives in the phone's
  // own storage, and "no key" is not a fault - it is the trial. So the Solo
  // branch never walls on the key. It decides a STATE and publishes it as
  // window.FoxLicense for the page to act on:
  //   state   'licensed' | 'unlicensed' | 'pending'
  //   reason  'no_key' | 'bad_key' | 'wrong_edition' (when unlicensed)
  //   payload the verified key's claims (when licensed)
  //   ready   a Promise that resolves with FoxLicense once the state is known
  //   store(key) / clear()  write or remove the key, then re-decide
  // Everything else in this file is Team's path and is dormant in the Solo copy,
  // exactly as this branch is dormant in Team's: the two copies differ only in
  // FOXHUNT_EDITION above (BUILD_STANDARD v5.1 §3a).
  const SOLO_KEY = 'fps_site_key';            // localStorage; mirrored in IndexedDB 'kv'
  if (FOXHUNT_EDITION === 'solo') { soloInit(); return; }

  // The localhost development exemption was REMOVED in v71.5. It was a real
  // bypass — anyone holding the files could serve them locally and run unlicensed
  // forever. Tolerable for the multi-user app, where a hunt nobody can reach is
  // useless, but not for the single-user app, where a local copy is fully
  // functional. Local development now needs a real key in the working copy;
  // localhost is a secure context, so verification works there normally.
  const domain = window.location.hostname.toLowerCase();

  // Throttle checks — once per session is enough
  const SESSION_KEY = 'fh_lic_verified';
  if (sessionStorage.getItem(SESSION_KEY) === domain) return;

  run();

  async function run() {
    // ── PRIMARY PATH: the signed key in 0-config-license.js ──────
    // A correctly shipped 0-config-license.js ALWAYS defines this, even when it
    // still holds the placeholder. Undefined therefore means the file is missing
    // or did not parse — and the commonest cause is a key pasted across several
    // lines, which is a JavaScript syntax error. Before v71.3 that produced "no
    // licence key has been installed", which is true but sends the reader
    // looking in the wrong place entirely.
    const fileLoaded  = (typeof FOXHUNT_SITE_KEY !== 'undefined');
    const configured  = String(fileLoaded ? FOXHUNT_SITE_KEY : '').trim();
    const looksSigned = /^FP1\./.test(configured);

    // Why classify what is NOT a signed key: a wall that says only "no licence"
    // sends the reader looking in the wrong place. Every distinguishable fault
    // gets its own message — a private key pasted into the slot, a public key,
    // a placeholder, or a file that will not parse.
    //
    // If the file did not parse, JavaScript never created the variable, so there
    // is nothing in memory to classify. The source text is still fetchable
    // though — and it has to be read, because the single likeliest reason a host
    // breaks this file is pasting a private key straight out of the .pem, which
    // is three lines long. A syntax-error message would send them off to fix
    // their quoting while the key stayed exposed on a public URL.
    const wallReason = fileLoaded
      ? classifySlot(configured)
      : await classifyUnparsedFile();

    if (looksSigned) {
      // The public key has not been filled in for this build. Verification is
      // impossible, so run rather than wall — a packaging omission must never
      // take a paid installation offline.
      if (!LICENSE_PUBKEY || /^PASTE_/.test(LICENSE_PUBKEY)) {
        console.warn('Fox Pursuit: no public key in this build; license not verified.');
        pass();
        return;
      }
      // WebCrypto needs a secure context. Before v71.5 this failed OPEN, which
      // meant serving the files over plain http:// on a LAN address ran the app
      // unverified — a wider bypass than localhost ever was. It now walls.
      //
      // This does not break the rule that protects buyers. That rule forbids
      // walling on a NETWORK result; this is a local, deterministic fact about
      // the browser. And it costs no legitimate user anything: GPS, compass,
      // service worker and offline storage are all unavailable on plain http
      // too, so anyone reaching this branch has a broken app already — they
      // just have not been told why yet.
      if (!window.crypto || !crypto.subtle) {
        showWall('insecure_context');
        return;
      }

      const payload = await verifyKey(configured, LICENSE_PUBKEY);
      if (payload && payload.ed !== FOXHUNT_EDITION) {
        // A genuine key for the other edition, or a pre-FP12 key with no edition
        // claim. Local and deterministic, so walling is safe (BUILD_STANDARD §5b).
        showWall('wrong_edition');
        return;
      }
      if (payload) {
        // The licensee field is a fixed string on pool-minted keys ("Registered
        // User"), so it says nothing useful. The site key ID does.
        try { console.info('Fox Pursuit licensed — ' + payload.id); } catch (e) {}
        pass();
      } else {
        // A key IS present and it does not verify: forged, corrupted, or
        // truncated on paste. This is a purely local, deterministic result —
        // no network was consulted — so walling here is safe.
        showWall('bad_key');
      }
      return;
    }

    // Not a signed key. There is no fallback: per-domain activation was removed
    // in v71.6, nothing having ever been sold that carried a pre-v71 key. The
    // licence check now touches NO network at any point, so nothing here can be
    // affected by any service, or by this project's author, disappearing.
    showWall(wallReason);
  }

  function pass() { sessionStorage.setItem(SESSION_KEY, domain); }

  // ── Solo: state, storage, re-check ─────────────────────────
  // SoloStore is a top-level const in solo-config.js: a script-scope binding, not a
  // window property, so it is tested with typeof rather than looked up on window.
  function hasStore() { return typeof SoloStore !== 'undefined' && !!SoloStore; }
  function soloInit() {
    let resolveReady;
    const L = {
      state: 'pending', reason: null, payload: null,
      ready: new Promise(r => { resolveReady = r; }),
      verify: key => verifyKey(key, LICENSE_PUBKEY),
      async store(key) {
        key = String(key || '').replace(/\s+/g, '');
        try { localStorage.setItem(SOLO_KEY, key); } catch (e) {}
        try { if (hasStore()) await SoloStore.put('kv', SOLO_KEY, key); } catch (e) {}
        return this.recheck();
      },
      async clear() {
        try { localStorage.removeItem(SOLO_KEY); } catch (e) {}
        try { if (hasStore()) await SoloStore.del('kv', SOLO_KEY); } catch (e) {}
        return this.recheck();
      },
      recheck() {
        this.state = 'pending';
        this.ready = new Promise(r => { resolveReady = r; });
        soloDecide(this, resolveReady);
        return this.ready;
      },
    };
    window.FoxLicense = L;
    soloDecide(L, resolveReady);
  }
  async function soloDecide(L, done) {
    const finish = (state, reason, payload) => {
      L.state = state; L.reason = reason || null; L.payload = payload || null; done(L);
    };
    // Same local, deterministic wall as Team's (see the comment there): GPS,
    // compass and offline storage are all unavailable on plain http too.
    if (!window.crypto || !crypto.subtle) { showWall('insecure_context'); finish('unlicensed', 'insecure_context'); return; }
    let key = '';
    try { key = String(localStorage.getItem(SOLO_KEY) || '').trim(); } catch (e) {}
    if (!key && hasStore()) {
      // localStorage empty: restore from the IndexedDB mirror if it has the key.
      try {
        const m = await SoloStore.get('kv', SOLO_KEY);
        if (m) { key = String(m).trim(); try { localStorage.setItem(SOLO_KEY, key); } catch (e) {} }
      } catch (e) {}
    }
    if (!key) { finish('unlicensed', 'no_key'); return; }
    if (!LICENSE_PUBKEY || /^PASTE_/.test(LICENSE_PUBKEY)) {
      console.warn('Fox Pursuit: no public key in this build; license not verified.');
      finish('licensed', null, { id: '(unverified)' });
      return;
    }
    const payload = await verifyKey(key, LICENSE_PUBKEY);
    if (!payload) { finish('unlicensed', 'bad_key'); return; }
    if (payload.ed !== FOXHUNT_EDITION) { finish('unlicensed', 'wrong_edition'); return; }
    try { console.info('Fox Pursuit licensed — ' + payload.id); } catch (e) {}
    finish('licensed', null, payload);
  }

  // What is in 0-config-license.js, if it is not a signed key?
  function classifySlot(v) {
    // Checked FIRST and reported loudest. This file is served publicly, so a
    // private key here has already been handed to anyone who requested it, and
    // there is no revocation: whoever has it can mint unlimited valid licences
    // forever. Nothing else in this function describes an emergency; this does.
    if (isPrivateKeyMaterial(v)) return 'private_key';
    if (!v || /^PASTE_/.test(v)) return 'no_key';
    // A raw P-256 public key is 87-88 base64url characters with no dots. It is
    // the single easiest thing to paste here by mistake, because it comes out of
    // the same tool and looks equally like a long licence string.
    if (!/\./.test(v) && /^[A-Za-z0-9_-]{80,100}$/.test(v)) return 'wrong_value';
    return 'not_a_key';
  }

  // Fetch 0-config-license.js and inspect the raw text. Only ever called when
  // the file failed to define FOXHUNT_SITE_KEY, so it costs nothing normally.
  // The contents are matched locally and never displayed or transmitted.
  async function classifyUnparsedFile() {
    try {
      const url  = new URL('0-config-license.js', document.baseURI).href;
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) return 'config_error';       // genuinely missing
      const text = await resp.text();
      // Strip the comment header that ships with the file, so its own prose can
      // never trigger a match.
      const body = text.replace(/\/\*[\s\S]*?\*\//g, '')
                       .replace(/^\s*\/\/.*$/gm, '');
      if (isPrivateKeyMaterial(body)) return 'private_key';
      return 'config_error';
    } catch (e) {
      return 'config_error';                     // offline, blocked, whatever
    }
  }

  // Recognises a private key WITH or WITHOUT its PEM header lines. Pasting only
  // the middle of the .pem file is at least as likely as pasting the whole
  // thing, and it is the same exposure either way.
  //
  // A DER-encoded key begins with an ASN.1 SEQUENCE, which in base64 is always
  // "MIG" or "MII". Our own public key is raw base64url starting with "B", and
  // a licence key starts "FP1.", so neither can collide with this.
  function isPrivateKeyMaterial(v) {
    if (/-----BEGIN[ A-Z]*PRIVATE KEY-----/.test(v)) return true;
    const bare = String(v || '').replace(/\s+/g, '');
    // Anchored form: the value IS a key (the parsed-file case).
    if (/^MI[GI][A-Za-z0-9+/=]{60,}$/.test(bare)) return true;
    // Unanchored form: a key sits SOMEWHERE in this text (the raw-source case,
    // where the surrounding JavaScript is still attached). Requires the base64
    // to be inside quotes so ordinary prose or code cannot trip it.
    return /["'`]\s*MI[GI][A-Za-z0-9+/=\s]{60,}/.test(String(v || ''));
  }

  // ── Offline signature check ───────────────────────────────────
  // Returns the decoded payload on success, or null on any failure.
  async function verifyKey(key, pubkeyB64u) {
    // Strip ALL whitespace, not just the ends: a key is base64url, so any space
    // or line break in it arrived in transit and should not fail the check.
    const parts = String(key || '').replace(/\s+/g, '').split('.');
    if (parts.length !== 3 || parts[0] !== 'FP1') return null;
    try {
      const sig     = b64uToBytes(parts[2]);
      const payload = JSON.parse(new TextDecoder().decode(b64uToBytes(parts[1])));
      if (sig.length !== 64) return null;
      const pub = await crypto.subtle.importKey(
        'raw', b64uToBytes(pubkeyB64u),
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
      );
      const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);
      const ok = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' }, pub, sig, signed
      );
      return ok ? payload : null;
    } catch (e) { return null; }
  }

  function b64uToBytes(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  // ── License wall ──────────────────────────────────────────────
  function showWall(reason) {
    const messages = {
      not_a_key:       'The value in <strong>0-config-license.js</strong> is not a '
                     + 'Fox Pursuit site key.<br>A site key begins with '
                     + '<strong>FP1.</strong> and contains two dots.',
      private_key:     '<strong>Your PRIVATE key is in 0-config-license.js.</strong><br>'
                     + 'This file is public — anyone who has opened it can now issue '
                     + 'unlimited licenses, and that cannot be undone.<br><br>'
                     + 'Remove it now, generate a NEW keypair, and re-issue keys.<br>'
                     + '<span style="color:#9aa2b4">What belongs in that file is your '
                     + 'SITE KEY, which begins FP1. and sits on one line.</span>',
      config_error:    '<strong>0-config-license.js could not be read.</strong><br>'
                     + 'The file is missing, or it contains a syntax error.<br><br>'
                     + 'The usual cause is a site key pasted across SEVERAL LINES. It '
                     + 'must sit on one single line, inside the quotes.',
      insecure_context: 'This site must be served over <strong>HTTPS</strong>.<br>'
                     + 'License checks, GPS, the compass and offline maps all require '
                     + 'a secure connection and none of them will work over plain '
                     + 'http://.<br><br>'
                     + '<span style="color:#9aa2b4">Site owner: install a certificate '
                     + '(most hosts offer a free one) and load the site with https://. '
                     + 'See SETUP.txt.</span>',
      no_key:          'No site key has been installed.<br>It belongs in '
                     + '<strong>0-config-license.js</strong>, which still holds its '
                     + 'placeholder text. Open <strong>setup.html</strong> to get one.',
      wrong_value:     'The value in <strong>0-config-license.js</strong> is not a '
                     + 'site key.<br>It looks like your <em>public key</em>. A site key '
                     + 'begins with <strong>FP1.</strong> and contains dots.',
      bad_key:         'The site key in <strong>0-config-license.js</strong> could not be verified.<br>It may have been truncated when it was pasted.',
      wrong_edition:   'The site key in <strong>0-config-license.js</strong> is not a '
                     + 'Fox Pursuit <strong>Team</strong> key.<br>It is either a Solo key, '
                     + 'or a key issued before October 2026, which carried no edition.<br><br>'
                     + 'Open <strong>setup.html</strong>, paste the license key from your '
                     + 'Team purchase receipt, and install the site key it gives you.',
    };

    waitForBody(() => {
      const el = document.createElement('div');
      el.id = 'fh-license-wall';
      el.setAttribute('style', [
        'position:fixed','inset:0','z-index:2147483647',
        'background:rgba(13,15,20,0.97)',
        'display:flex','flex-direction:column',
        'align-items:center','justify-content:center',
        'font-family:monospace','text-align:center','padding:2rem',
        'color:#d8dce8',
      ].join(';'));
      el.innerHTML = `
        <div style="max-width:500px">
          <div style="font-size:3rem;margin-bottom:1rem">🦊</div>
          <h2 style="color:#f0a500;font-size:1.1rem;letter-spacing:0.1em;margin-bottom:1rem">
            FOX PURSUIT — LICENSE REQUIRED
          </h2>
          <p style="font-size:0.88rem;line-height:1.8;margin-bottom:1.5rem">
            ${messages[reason] || 'License verification failed.'}
          </p>
          <p style="color:#5a6070;font-size:0.78rem;line-height:1.7;margin-bottom:2rem">
            A valid license is required to use this software.<br>
            Purchase at
            <a href="https://foxpursuit.com/" style="color:#f0a500" target="_blank">foxpursuit.com</a>
            or contact
            <a href="https://www.qrz.com/db/WA0MCS" style="color:#f0a500" target="_blank">WA0MCS</a>.
          </p>
          <a href="setup.html" style="
            display:inline-block;background:#f0a500;color:#000;
            font-family:monospace;font-size:0.85rem;font-weight:bold;
            letter-spacing:0.08em;text-transform:uppercase;
            padding:0.75rem 2.5rem;border-radius:4px;text-decoration:none;
          ">Check License Key →</a>
          <p style="color:#2a2f3d;font-size:0.62rem;margin-top:2.5rem">
            © 2026 Andrew Lindsay WA0MCS · Fox Pursuit Software · All Rights Reserved
          </p>
        </div>`;
      document.body.appendChild(el);
    });
  }

  function waitForBody(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

})();
