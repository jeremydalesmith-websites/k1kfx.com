// ============================================================
//  Fox Pursuit — Theme & Background (load in <head>, AFTER 0-config-foxhunt.js)
//  Runs immediately so the themed background paints on the very first frame,
//  with no flash of the default theme on a slow connection.
// ============================================================

function fhHexToRgb(hex){
  let h=String(hex||'').trim().replace('#','');
  if(h.length===3) h=h.split('').map(c=>c+c).join('');
  if(!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) };
}
function fhRgbToHex(r,g,b){
  const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');
  return '#'+c(r)+c(g)+c(b);
}
function fhMix(h1,h2,t){
  const a=fhHexToRgb(h1), b=fhHexToRgb(h2);
  if(!a||!b) return h1;
  return fhRgbToHex(a.r+(b.r-a.r)*t, a.g+(b.g-a.g)*t, a.b+(b.b-a.b)*t);
}
function fhLighten(h,t){ return fhMix(h,'#ffffff',t); }
function fhDarken(h,t){ return fhMix(h,'#000000',t); }
function fhLuminance(hex){
  const c=fhHexToRgb(hex); if(!c) return 0;
  const f=v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
  return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);
}
function fhContrast(a,b){
  const l1=fhLuminance(a), l2=fhLuminance(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

function applyTheme(){
  const C=(typeof FOXHUNT_CONFIG!=='undefined')?FOXHUNT_CONFIG:{};
  const root=document.documentElement;
  if(C.fontSans) root.style.setProperty('--sans', C.fontSans);
  if(C.fontMono) root.style.setProperty('--mono', C.fontMono);
  const theme=String(C.theme||'original').toLowerCase().trim();
  if(theme==='custom' && C.customTheme && typeof C.customTheme==='object'){
    const t=C.customTheme;
    const bg=t.bg||'#0d0f14', text=t.text||'#d8dce8', accent=t.accent||'#f0a500';
    const muted=t.muted||text, dark=fhLuminance(bg)<0.5;
    const vars={
      '--bg':bg,
      '--panel':  t.panel  || (dark?fhLighten(bg,0.05):fhDarken(bg,0.04)),
      '--panel2': t.panel2 || (dark?fhLighten(bg,0.10):fhDarken(bg,0.08)),
      '--border': t.border || (dark?fhLighten(bg,0.18):fhDarken(bg,0.16)),
      '--accent': accent,
      '--accent2':t.accent2 || fhDarken(accent,0.22),
      '--text':text, '--muted':muted,
      '--error':  t.error   || (dark?'#e05a5a':'#c0392b'),
      '--success':t.success || (dark?'#50c878':'#2e7d32')
    };
    Object.keys(vars).forEach(k=>root.style.setProperty(k,vars[k]));
    const argb=fhHexToRgb(accent);
    if(argb) root.style.setProperty('--accent-rgb', argb.r+','+argb.g+','+argb.b);
    const brgb=fhHexToRgb(bg);
    if(brgb) root.style.setProperty('--bg-rgb', brgb.r+','+brgb.g+','+brgb.b);
    root.dataset.theme='custom';
    const cr=fhContrast(text,bg);
    if(cr<4.5) console.warn('[Fox Pursuit] Custom theme: text vs background contrast is '+cr.toFixed(2)+':1 (aim for 4.5:1 or higher so text stays easy to read).');
    if(fhContrast(accent,bg)<3) console.warn('[Fox Pursuit] Custom theme: accent vs background contrast is low — buttons and links may be hard to see.');
  } else if(theme && theme!=='original'){
    root.dataset.theme=theme;     // a named preset; colors come from foxhunt.css
  } else {
    root.dataset.theme='original';
  }
}

// Page background: "grid" (themed grid, default), "none" (solid theme color),
// or "image" (an owner-supplied image with a readability wash). The image is
// only applied if it is within backgroundMaxKB; otherwise it falls back to grid.
function setImageBg(url,size,pos,dim,fixed){
  const root=document.documentElement;
  root.style.setProperty('--bg-image', 'url("'+url+'")');
  root.style.setProperty('--bg-dim', String(dim));
  root.style.setProperty('--bg-pos', pos);
  root.style.setProperty('--bg-size', (size==='repeat') ? 'auto' : size);
  root.style.setProperty('--bg-repeat', (size==='repeat') ? 'repeat' : 'no-repeat');
  root.style.setProperty('--bg-attach', fixed ? 'fixed' : 'scroll');
  document.body.classList.remove('grid-bg','no-bg');
  document.body.classList.add('image-bg');
}
function applyBackground(){
  const C=(typeof FOXHUNT_CONFIG!=='undefined')?FOXHUNT_CONFIG:{};
  const body=document.body;
  if(!body) return;
  const mode=String(C.background||'grid').toLowerCase().trim();
  body.classList.remove('grid-bg','image-bg','no-bg');
  if(mode==='none'){ body.classList.add('no-bg'); return; }
  if(mode==='image'){
    const url=(C.backgroundImage||'').trim();
    if(!url){ body.classList.add('grid-bg'); return; }
    const maxKB=(C.backgroundMaxKB!=null)?C.backgroundMaxKB:500;
    const dim=(C.backgroundDim!=null)?C.backgroundDim:0.6;
    const size=(C.backgroundSize||'cover');
    const pos=(C.backgroundPosition||'center');
    const fixed=C.backgroundFixed===true;
    // Check the file size first; skip oversized images so they never load.
    fetch(url,{method:'HEAD'}).then(function(r){
      const len=parseInt(r.headers.get('content-length')||'0',10);
      if(len && len>maxKB*1024){
        console.warn('[Fox Pursuit] Background image is '+Math.round(len/1024)+' KB, over the '+maxKB+' KB limit — using the grid instead. Use a smaller / more-compressed image.');
        body.classList.add('grid-bg'); return;
      }
      setImageBg(url,size,pos,dim,fixed);
    }).catch(function(){ setImageBg(url,size,pos,dim,fixed); });
    return;
  }
  body.classList.add('grid-bg');   // default
}

applyTheme();   // run now, in <head>, before the body paints
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', applyBackground);
} else {
  applyBackground();
}
