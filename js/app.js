import * as M from './model.js';
import * as S from './store.js';
import { ITEMS, SOURCES, TOPICS } from './content.js';
import { faceSVG, faceGroups, bringToLife } from './faces.js';

/* =========================================================
   Basics
   ========================================================= */

const APP_VERSION = '1.0.0';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const st = () => S.get();
const now = () => Date.now();
const todayKey = () => M.dayKey(now());
const settingsFor = k => M.settingsFor(st().settingsHistory, k);
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const BY_CAT = { fact: ITEMS.filter(i => i.category === 'fact').map(i => i.id), myth: ITEMS.filter(i => i.category === 'myth').map(i => i.id) };

function haptic(kind = 'light') {
  try { if (navigator.vibrate) navigator.vibrate(kind === 'medium' ? 18 : 8); } catch (e) { /* not supported */ }
}

const ICONS = {
  home: '<path d="M4 11.2 12 4.8l8 6.4v8.3a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V21H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
  sleep: '<path d="M19.6 14.6A8 8 0 1 1 9.4 4.4a6.4 6.4 0 0 0 10.2 10.2z"/>',
  discover: '<rect x="3.5" y="7" width="11.5" height="13.5" rx="2.6"/><path d="M8.5 3.5h9.4a2.6 2.6 0 0 1 2.6 2.6v10.4"/>',
  history: '<path d="M5 20v-7M10 20V6.5M15 20v-9.5M20 20V9"/>',
  settings: '<path d="M4 7h9.5M18.5 7H20M4 17h3.5M12.5 17H20"/><circle cx="16" cy="7" r="2.4"/><circle cx="10" cy="17" r="2.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  left: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  right: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  up: '<path d="M5.5 14.5 12 8l6.5 6.5"/>',
  down: '<path d="M5.5 9.5 12 16l6.5-6.5"/>',
  edit: '<path d="M5 19.2l.9-4L15.6 5.5a2.1 2.1 0 0 1 3 3L8.9 18.2z"/>',
  trash: '<path d="M5 7.5h14M10 7.5V5.2h4v2.3M7 7.5l1 11.8h8l1-11.8"/>',
  star: '<path d="M12 4.2l2.3 4.9 5.3.7-3.9 3.6 1 5.3L12 16.1l-4.7 2.6 1-5.3-3.9-3.6 5.3-.7z"/>',
  download: '<path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14"/>',
  cup: '<path d="M5 8.5h11v5.2a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.6a2.6 2.6 0 0 1 0 5.2H16"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5h4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  moonCheck: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  cards: '<rect x="4" y="5" width="9" height="14" rx="2.4"/><rect x="11" y="5" width="9" height="14" rx="2.4"/>',
  bookmark: '<path d="M7 4.5h10v15.5l-5-3.6-5 3.6z"/>',
  calc: '<rect x="5" y="3.5" width="14" height="17" rx="2.6"/><path d="M8.5 8h7M8.5 12.5h.1M12 12.5h.1M15.5 12.5h.1M8.5 16.5h.1M12 16.5h.1M15.5 16.5h.1"/>',
  flip: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1M19.5 12a7.5 7.5 0 0 1-13 5.1"/><path d="M17.8 3.5v3.6h-3.6M6.2 20.5v-3.6h3.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'
};
const icon = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${ICONS[n] || ''}</svg>`;

const CATS = [
  { id: 'coffee', label: 'Coffee', short: 'Coffee' },
  { id: 'tea', label: 'Tea', short: 'Tea' },
  { id: 'energy', label: 'Energy drink', short: 'Energy' },
  { id: 'preworkout', label: 'Pre-workout / supplement', short: 'Pre-workout' },
  { id: 'other', label: 'Other', short: 'Other' }
];
const catLabel = id => (CATS.find(c => c.id === id) || CATS[4]).label;

// Generic starting values. All editable, all marked as estimates.
const PRESETS = {
  coffee: [
    { name: 'Filter coffee', portion: '240 ml mug', mg: 96, note: 'Typical value (Mayo Clinic)' },
    { name: 'Espresso, single', portion: '30 ml', mg: 63, note: 'Typical value (Mayo Clinic)' },
    { name: 'Espresso, double', portion: '60 ml', mg: 126, note: 'Two typical single shots' },
    { name: 'Cappuccino or latte', portion: 'one shot of espresso', mg: 63, note: 'Based on one typical shot' },
    { name: 'Decaf coffee', portion: '240 ml mug', mg: 5, note: 'FDA range is 2 to 15 mg' }
  ],
  tea: [
    { name: 'Black tea', portion: '240 ml cup', mg: 48, note: 'Typical value (Mayo Clinic)' },
    { name: 'Green tea', portion: '240 ml cup', mg: 29, note: 'Typical value (Mayo Clinic)' },
    { name: 'Decaf black tea', portion: '240 ml cup', mg: 2, note: 'Typical value (Mayo Clinic)' },
    { name: 'Herbal tea', portion: '240 ml cup', mg: 0, note: 'Usually caffeine-free. Check blends with tea or mate.' }
  ],
  energy: [
    { name: 'Energy drink', portion: '237 ml (8 fl oz)', mg: 79, note: 'Typical value (Mayo Clinic). Check your can.' },
    { name: 'Energy drink, large can', portion: '500 ml', mg: 160, note: 'Rough guess. EU cans over 150 mg/L list mg per 100 ml.' },
    { name: 'Energy shot', portion: '60 ml', mg: 200, note: 'Typical value (Mayo Clinic)' }
  ],
  preworkout: [
    { name: 'Pre-workout', portion: '1 scoop', mg: 200, note: 'Varies a lot. Use the label.' },
    { name: 'Caffeine tablet', portion: '1 tablet', mg: 100, note: 'Use the label.' }
  ],
  other: [
    { name: 'Cola', portion: '330 ml can', mg: 46, note: 'Scaled from Mayo Clinic\'s 33 mg per 237 ml' },
    { name: 'Something else', portion: '1 serving', mg: 0, note: 'Enter the amount yourself.' }
  ]
};

const SLEEP_ANSWERS = [
  { id: 'restless', label: 'Restless', face: 'meh' },
  { id: 'okay', label: 'Okay', face: 'smirk' },
  { id: 'well', label: 'Well', face: 'relieved' },
  { id: 'notsure', label: 'Not sure', face: 'meh' },
  { id: 'skipped', label: 'Skip', face: 'sleepy' }
];
const sleepLabel = a => a === 'skipped' ? 'Skipped' : (SLEEP_ANSWERS.find(s => s.id === a) || {}).label || '';

/* =========================================================
   UI state (not persisted)
   ========================================================= */

const ui = {
  route: 'home',
  historyMode: 'day',
  historyKey: null,
  discoverView: 'today',
  archiveCat: 'all',
  archiveTopic: 'all',
  openArchive: null,
  fillFrom: null,
  whatif: null,
  saving: false,
  lastToday: null,
  focusOnRender: false
};

/* =========================================================
   Persistence helpers
   ========================================================= */

function save(mutator) {
  const r = S.commit(mutator);
  if (!r.ok) {
    toast('Couldn\'t save on this device. Storage may be full or blocked. Nothing was changed.', { ms: 7000 });
    return false;
  }
  return true;
}

/* =========================================================
   Toasts
   ========================================================= */

let toastTimer = null;
function toast(msg, { undo = null, undoLabel = 'Undo', ms = 5200 } = {}) {
  const root = $('#toast-root');
  clearTimeout(toastTimer);
  root.innerHTML = `<div class="toast" role="status"><div class="grow">${esc(msg)}</div>${undo ? `<button type="button" data-toast-undo>${esc(undoLabel)}</button>` : ''}</div>`;
  const el = root.firstElementChild;
  if (undo) {
    el.querySelector('[data-toast-undo]').addEventListener('click', () => { hideToast(); undo(); });
  }
  toastTimer = setTimeout(hideToast, ms);
}
function hideToast() {
  const el = $('#toast-root .toast');
  if (!el) return;
  el.classList.add('out');
  setTimeout(() => el.remove(), 320);
}

/* =========================================================
   Sheets & modals
   ========================================================= */

const sheetStack = [];

function openSheet({ title, body, onRender, label }) {
  const opener = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const sheet = document.createElement('section');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', label || title);
  sheet.innerHTML = `<div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close-sheet aria-label="Close">${icon('close')}</button></div><div class="sheet-body"></div>`;
  document.body.append(overlay, sheet);
  document.body.classList.add('locked');
  setInert(true);
  const entry = { overlay, sheet, opener, onRender, setTitle: t => { sheet.querySelector('h2').textContent = t; sheet.setAttribute('aria-label', t); } };
  sheetStack.push(entry);
  overlay.addEventListener('click', () => closeSheet());
  sheet.querySelector('[data-close-sheet]').addEventListener('click', () => closeSheet());
  setSheetBody(entry, body);
  setTimeout(() => (sheet.querySelector('[autofocus]') || sheet.querySelector('[data-close-sheet]')).focus({ preventScroll: true }), 60);
  return entry;
}

function setSheetBody(entry, html) {
  const b = entry.sheet.querySelector('.sheet-body');
  b.innerHTML = html;
  bringToLife(b);
  if (entry.onRender) entry.onRender(b);
}

function topSheet() { return sheetStack[sheetStack.length - 1]; }

function closeSheet({ all = false } = {}) {
  const list = all ? sheetStack.splice(0) : [sheetStack.pop()].filter(Boolean);
  for (const e of list) {
    e.overlay.classList.add('closing');
    e.sheet.classList.add('closing');
    setTimeout(() => { e.overlay.remove(); e.sheet.remove(); bringToLife(document); }, reduceMotion() ? 0 : 280);
  }
  if (!sheetStack.length) {
    document.body.classList.remove('locked');
    setInert(false);
  }
  const last = list[list.length - 1];
  if (last && last.opener && last.opener.isConnected && !sheetStack.length) last.opener.focus({ preventScroll: true });
}

function setInert(on) {
  for (const id of ['screen', 'tabbar']) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  }
}

function confirmModal({ title, text, ok = 'OK', cancel = 'Cancel', danger = false, face = 'meh' }) {
  return new Promise(resolve => {
    const opener = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="overlay"></div><div class="modal ${danger ? 'red' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="mt" aria-describedby="md">
      <div class="stack">
        ${faceSVG(face, { size: 64, cls: 'pop' })}
        <h2 id="mt">${esc(title)}</h2>
        <p id="md" class="lede">${esc(text)}</p>
        <div class="stack" style="margin-top:18px">
          <button type="button" class="btn ${danger ? '' : ''}" data-ok>${esc(ok)}</button>
          <button type="button" class="btn quiet" data-cancel>${esc(cancel)}</button>
        </div>
      </div></div>`;
    document.body.append(wrap);
    const modalEls = [...document.body.children].filter(c => c !== wrap && c.id !== 'toast-root');
    modalEls.forEach(c => c.setAttribute('inert', ''));
    bringToLife(wrap);
    const done = v => {
      modalEls.forEach(c => { if (!(sheetStack.length && (c.id === 'screen' || c.id === 'tabbar'))) c.removeAttribute('inert'); });
      if (!sheetStack.length) setInert(false);
      wrap.remove();
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      resolve(v);
    };
    wrap.querySelector('[data-ok]').addEventListener('click', () => done(true));
    wrap.querySelector('[data-cancel]').addEventListener('click', () => done(false));
    wrap.querySelector('.overlay').addEventListener('click', () => done(false));
    wrap.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } });
    setTimeout(() => wrap.querySelector('[data-cancel]').focus(), 30);
  });
}

/* =========================================================
   Charts
   ========================================================= */

function niceMax(v) {
  if (v <= 50) return 50;
  if (v <= 100) return 100;
  if (v <= 200) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}

// series: [{pts:[{t,v}], stroke, fill, dotted}]
function lineChart({ series, from, to, maxY, markers = [], aria, color = 'currentColor' }) {
  const W = 340, H = 196, L = 40, R = 12, T = 22, B = 30;
  const x = t => L + (t - from) / (to - from) * (W - L - R);
  const y = v => T + (1 - Math.min(v, maxY * 1.2) / maxY) * (H - T - B);
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}" style="color:${color}">`;
  for (const v of [0, maxY / 2, maxY]) {
    out += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
  }
  out += `<text x="${L - 8}" y="${T - 10}" text-anchor="end" class="lbl-strong">mg</text>`;
  for (const s of series) {
    if (!s.pts.length) continue;
    const line = s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    if (s.fill) {
      const area = `${line} L${x(s.pts[s.pts.length - 1].t).toFixed(1)} ${y(0)} L${x(s.pts[0].t).toFixed(1)} ${y(0)} Z`;
      out += `<path d="${area}" fill="${s.fill}" stroke="none"/>`;
    }
    out += `<path d="${line}" fill="none" stroke="${s.stroke}" stroke-width="${s.width || 3.5}" stroke-linecap="round" stroke-linejoin="round" ${s.dotted ? 'stroke-dasharray="0.1 7"' : ''}/>`;
  }
  // markers: rounded ticks with label
  markers.forEach((m, i) => {
    if (m.t < from || m.t > to) return;
    const mx = x(m.t);
    out += `<rect x="${(mx - 1.5).toFixed(1)}" y="${T}" width="3" height="${H - T - B}" rx="1.5" fill="currentColor" opacity=".35"/>`;
    const anchor = mx > W - 60 ? 'end' : (mx < L + 30 ? 'start' : 'middle');
    out += `<text x="${mx.toFixed(1)}" y="${i % 2 ? T - 10 + 0 : T - 10}" text-anchor="${anchor}" class="lbl-strong">${esc(m.label)}</text>`;
  });
  out += `<text x="${L}" y="${H - 8}" text-anchor="start">${M.fmtTime(from)}</text>`;
  out += `<text x="${W - R}" y="${H - 8}" text-anchor="end">${M.fmtTime(to)}</text>`;
  const mid = from + (to - from) / 2;
  out += `<text x="${x(mid)}" y="${H - 8}" text-anchor="middle">${M.fmtTime(mid)}</text>`;
  return out + '</svg>';
}

function barsChart(days, { mode, today }) {
  const W = 340, H = 170, T = 10, B = 26, L = 4, R = 4;
  const maxTotal = Math.max(...days.map(d => d.total), ...days.map(d => d.limit || 0), 100);
  const maxY = niceMax(maxTotal);
  const n = days.length;
  const slot = (W - L - R) / n;
  const bw = Math.max(5, Math.min(30, slot * 0.66));
  const rx = Math.min(8, bw / 2);
  const ph = H - T - B;
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(barsAria(days, maxY))}">`;
  days.forEach((d, i) => {
    const cx = L + slot * i + slot / 2;
    const x0 = cx - bw / 2;
    const future = d.key > today;
    out += `<rect x="${x0.toFixed(1)}" y="${T}" width="${bw.toFixed(1)}" height="${ph}" rx="${rx}" fill="currentColor" opacity="${future ? 0.04 : 0.08}"/>`;
    if (d.status === 'logged' && d.total > 0) {
      const h = Math.max(rx * 2, d.total / maxY * ph);
      out += `<rect x="${x0.toFixed(1)}" y="${(T + ph - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="${d.over ? '#ffcc2e' : '#2747c9'}"/>`;
    } else if (d.status === 'free' || (d.status === 'logged' && d.total === 0)) {
      out += `<rect x="${x0.toFixed(1)}" y="${(T + ph - rx * 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${rx * 2}" rx="${rx}" fill="#0f5a3a"/>`;
    }
    const showLabel = mode === 'week' || i === 0 || (i + 1) % 5 === 0;
    if (showLabel) {
      const k = M.keyToDate(d.key);
      const lab = mode === 'week' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][k.getDay()] : String(k.getDate());
      out += `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
    }
  });
  out += `<text x="${W - R}" y="${T + 12}" text-anchor="end" class="lbl-strong">${maxY} mg</text>`;
  return out + '</svg>';
}

function barsAria(days, maxY) {
  const parts = days.map(d => {
    const lab = M.fmtDay(d.key);
    if (d.status === 'none') return `${lab}: nothing recorded`;
    if (d.status === 'free') return `${lab}: confirmed caffeine-free`;
    return `${lab}: ${Math.round(d.total)} mg${d.over ? ', above chosen limit' : ''}`;
  });
  return `Caffeine consumed per day, scale 0 to ${maxY} mg. ` + parts.join('; ');
}

/* =========================================================
   Tank
   ========================================================= */

const TANK = { W: 320, H: 258, top: 26, bottom: 252 };
function tankLevelY(mg) {
  const r = Math.max(0, Math.min(1, mg / M.TANK_SCALE_MG));
  let h = r * (TANK.bottom - TANK.top);
  if (mg >= 1 && h < 6) h = 6;
  return TANK.bottom - h;
}
function tankExpr(mg, any) {
  if (!any || mg < 1) return 'sleepy';
  const r = mg / M.TANK_SCALE_MG;
  if (r < 0.34) return 'relieved';
  if (r < 0.67) return 'smirk';
  return 'shock';
}
function tankSVG(mg, any, aria) {
  const y = tankLevelY(mg);
  const expr = tankExpr(mg, any);
  const over = mg > M.TANK_SCALE_MG;
  const face = (color) => `<svg x="102" y="${TANK.top + 52}" width="116" height="116" viewBox="8 10 84 84" overflow="visible" style="color:${color}">${faceGroups(expr)}</svg>`;
  const tankH = TANK.bottom - TANK.top;
  return `<svg class="tank-svg ${over ? 'over' : ''}" data-expr="${expr}" viewBox="0 0 ${TANK.W} ${TANK.H}" role="img" aria-label="${esc(aria)}">
    <defs>
      <clipPath id="tank-clip"><rect x="0" y="${TANK.top}" width="${TANK.W}" height="${tankH}" rx="30"/></clipPath>
      <clipPath id="liq-clip"><rect class="liq-rect" x="0" y="${y.toFixed(1)}" width="${TANK.W}" height="${tankH + 40}"/></clipPath>
    </defs>
    ${over ? `<g fill="#ff8a3d"><rect x="52" y="6" width="44" height="48" rx="22"/><rect x="138" y="0" width="34" height="48" rx="17"/><rect x="220" y="10" width="40" height="44" rx="20"/></g>` : ''}
    <g clip-path="url(#tank-clip)">
      <rect x="0" y="${TANK.top}" width="${TANK.W}" height="${tankH}" fill="#2747c9"/>
      <rect class="liq-rect" x="0" y="${y.toFixed(1)}" width="${TANK.W}" height="${tankH + 40}" fill="#ff8a3d"/>
      ${face('#d8e4ff')}
      <g clip-path="url(#liq-clip)">${face('#4a1a05')}</g>
    </g>
  </svg>`;
}
function setTankLevel(svg, mg, animateFrom = null) {
  const y = tankLevelY(mg);
  const rects = $$('.liq-rect', svg);
  if (animateFrom != null && !reduceMotion()) {
    const y0 = tankLevelY(animateFrom);
    for (const r of rects) {
      r.setAttribute('y', y.toFixed(1));
      r.animate([{ transform: `translateY(${(y0 - y).toFixed(1)}px)` }, { transform: 'translateY(0px)' }],
        { duration: 900, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    }
  } else {
    for (const r of rects) r.setAttribute('y', y.toFixed(1));
  }
}

/* =========================================================
   Derived values
   ========================================================= */

function homeData() {
  const s = st();
  const t = now();
  const k = M.dayKey(t);
  const rem = M.remainingAt(s.consumptions, t);
  const any = M.anyBefore(s.consumptions, t);
  const set = settingsFor(k);
  const today = M.consumedOn(s.consumptions, k);
  const nb = M.nextBedtime(t, settingsFor);
  const atBed = M.remainingAt(s.consumptions, nb.at);
  const past = s.consumptions.filter(c => c.at <= t).sort((a, b) => b.at - a.at);
  return { s, t, k, rem, any, set, today, nb, atBed, last: past[0] || null };
}

function statusText(d) {
  if (!d.any) return 'Empty tank. Nothing logged yet.';
  if (d.rem < 1) return 'Practically drained, by this estimate.';
  if (d.last && d.t - d.last.at < 20 * 60000) return 'Just topped up. Still in the tank.';
  return 'Gradually decreasing.';
}

function whenLabel(at) {
  const k = M.dayKey(at);
  const t = todayKey();
  if (k === t) return `today ${M.fmtTime(at)}`;
  if (k === M.addDays(t, 1)) return `tomorrow ${M.fmtTime(at)}`;
  if (k === M.addDays(t, -1)) return `yesterday ${M.fmtTime(at)}`;
  return `${M.fmtDay(k)} ${M.fmtTime(at)}`;
}

function bedtimeWhen(nb) {
  const k = M.dayKey(nb.at);
  const t = todayKey();
  const time = M.fmtTime(nb.at);
  if (nb.nightKey === t) return k === t ? `${time} tonight` : `${time} tonight, after midnight`;
  if (nb.nightKey === M.addDays(t, -1)) return `${time} this morning (last night's bedtime)`;
  return `${time}, ${M.fmtDay(k)}`;
}

/* =========================================================
   Router & render
   ========================================================= */

function parseRoute() {
  const h = (location.hash || '#home').slice(1);
  return ['home', 'sleep', 'discover', 'history'].includes(h) ? h : 'home';
}

function render() {
  ui.route = parseRoute();
  ui.lastToday = todayKey();
  const screen = $('#screen');
  document.body.classList.toggle('on-sleep', ui.route === 'sleep');
  screen.className = '';
  let html = '';
  if (ui.route === 'home') html = renderHome();
  if (ui.route === 'sleep') { html = renderSleep(); screen.className = 'colored screen-sleep'; }
  if (ui.route === 'discover') html = renderDiscover();
  if (ui.route === 'history') html = renderHistory();
  screen.innerHTML = html;
  $$('#tabbar button').forEach(b => {
    if (b.dataset.route === ui.route) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const themeColor = ui.route === 'sleep' ? '#b98cff' : '#f3ede4';
  $('meta[name="theme-color"]').setAttribute('content', themeColor);
  if (ui.route === 'home') {
    const svg = $('.tank-svg', screen);
    if (svg && ui.fillFrom != null) {
      const d = homeData();
      setTankLevel(svg, d.rem, ui.fillFrom);
      const n = $('#home-num');
      if (n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
    }
    ui.fillFrom = null;
  }
  bringToLife(screen);
  if (ui.focusOnRender) {
    ui.focusOnRender = false;
    const h = $('h1', screen);
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }
}

/* ---------------- HOME ---------------- */

function renderHome() {
  const d = homeData();
  const f = M.formatMg(d.rem, d.any);
  const over = d.rem > M.TANK_SCALE_MG;
  const aria = `Caffeine tank. Estimated remaining ${f.text}. ${over ? 'Over the tank display scale of ' + M.TANK_SCALE_MG + ' mg.' : 'Display scale 0 to ' + M.TANK_SCALE_MG + ' mg.'}`;
  const limit = d.set.dailyLimit;
  const overLimit = limit != null && d.today > limit;
  const morning = renderMorningCards();
  const reminder = renderReminderBanner();

  return `
  <div class="topbar">
    <span class="wordmark" aria-hidden="true">CAFFEINE</span>
    <h1 class="sr-only">Home</h1>
    <button type="button" class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button>
  </div>

  ${morning}
  ${reminder}

  <section class="enter" aria-labelledby="rem-label" style="margin-top:14px">
    <div class="row spread">
      <span id="rem-label" class="meta">Estimated remaining</span>
      <span class="chip">Estimated</span>
    </div>
    <div class="hero-num" aria-live="polite" aria-atomic="true">
      <span class="num ${f.tiny ? 'tiny' : ''}" id="home-num">${esc(f.tiny ? 'Less than 1' : f.num)}</span><span class="unit">mg</span>
    </div>
    <p class="status-line" id="home-status">${esc(statusText(d))}</p>
    ${over ? `<p class="chip" style="margin-top:10px" id="home-over">Over the tank's display scale. The number above is the estimate.</p>` : ''}
    <div class="tank-wrap">${tankSVG(d.rem, d.any, aria)}</div>
    <p class="tank-note">The tank shows 0 to ${M.TANK_SCALE_MG} mg. That is a display scale, not a limit or a goal.</p>
  </section>

  ${!d.any ? `
  <section class="notice sky enter enter-2" style="margin-top:16px">
    <h3>Empty, for now</h3>
    <p class="small">Add your first caffeine and the tank starts estimating. An empty log does not mean you had no caffeine, just that none is logged.</p>
  </section>` : ''}

  <div class="grid2 collapse enter enter-2" style="margin-top:16px">
    <button type="button" class="tile ${overLimit ? 'yellow' : ''}" data-action="go-history-today" aria-label="Consumed today ${Math.round(d.today)} mg. Open today's history.">
      <span class="meta">Consumed today</span>
      <div class="num" id="home-today">${Math.round(d.today)}<small> mg</small></div>
      <div class="sub">${limit == null ? 'No daily limit set.' : overLimit ? `<strong>Above your chosen daily limit</strong> of ${M.fmtNum(limit)} mg, by ${Math.round(d.today - limit)} mg.` : `Your chosen limit: ${M.fmtNum(limit)} mg.`}</div>
    </button>
    <button type="button" class="tile lila" data-action="route" data-route="sleep" aria-label="Estimated at bedtime ${M.formatMg(d.atBed, M.anyBefore(d.s.consumptions, d.nb.at)).text}. Open Sleep.">
      <span class="meta">Estimated at bedtime</span>
      <div class="num" id="home-bed">${esc(M.formatMg(d.atBed, M.anyBefore(d.s.consumptions, d.nb.at)).num)}<small> mg</small></div>
      <div class="sub">Bed ${esc(bedtimeWhen(d.nb))}. Projection.</div>
    </button>
  </div>

  <div class="stack enter enter-3" style="margin-top:12px">
    ${d.set.cutoff ? `<p class="small"><strong>Your last-caffeine time:</strong> ${esc(d.set.cutoff)}. Your own plan, not medical advice.</p>` : ''}
    ${d.last ? `<p class="small"><strong>Last logged:</strong> ${esc(d.last.name)}, ${M.fmtNum(d.last.totalMg)} mg, ${esc(whenLabel(d.last.at))}.</p>` : ''}
  </div>

  <div class="enter enter-3" style="margin-top:16px">
    <button type="button" class="btn" data-action="add" id="add-main">${icon('plus')}Add caffeine</button>
  </div>

  <div class="enter enter-4" style="margin-top:12px">
    <a class="menu-item" href="#discover" data-action="route" data-route="discover">
      <span class="ico pink">${faceSVG('smirk', { size: 34 })}</span>
      <span class="grow"><span class="t">Your daily Fun Fact &amp; Mythbusters</span><span class="d">Two new cards today. Tap to reveal.</span></span>
    </a>
  </div>`;
}

function patchHome() {
  const d = homeData();
  const num = $('#home-num');
  if (!num) return;
  const f = M.formatMg(d.rem, d.any);
  const txt = f.tiny ? 'Less than 1' : f.num;
  const svg = $('.tank-svg');
  const overNow = d.rem > M.TANK_SCALE_MG;
  if (!svg || svg.dataset.expr !== tankExpr(d.rem, d.any) || svg.classList.contains('over') !== overNow || !!$('#home-over') !== overNow) { render(); return; }
  if (num.textContent !== txt) num.textContent = txt;
  $('#home-status').textContent = statusText(d);
  setTankLevel(svg, d.rem);
  svg.setAttribute('aria-label', `Caffeine tank. Estimated remaining ${f.text}. Display scale 0 to ${M.TANK_SCALE_MG} mg.`);
  const bed = $('#home-bed');
  if (bed) bed.innerHTML = `${esc(M.formatMg(d.atBed, M.anyBefore(d.s.consumptions, d.nb.at)).num)}<small> mg</small>`;
}

/* ---------- recap + sleep check + reminder ---------- */

function recapLines(k) {
  const s = st();
  const d = M.daySummary(s, k);
  const lines = [];
  if (d.status === 'logged') {
    lines.push(`${Math.round(d.total)} mg logged across ${d.count} ${d.count === 1 ? 'drink' : 'drinks'}.`);
    lines.push(`Last intake at ${M.fmtTime(d.last.at)}.`);
  } else if (d.status === 'free') {
    lines.push('Confirmed caffeine-free.');
  } else {
    lines.push('Nothing recorded. That could mean caffeine-free, or just not logged.');
  }
  const bedTxt = M.formatMg(d.atBedtime, d.atBedtimeAny).text;
  lines.push(`Estimated at bedtime (${d.bedtime}): ${bedTxt}.`);
  if (d.status !== 'none') {
    if (d.limit == null) lines.push('No daily limit was set that day.');
    else if (d.over) lines.push(`Above your chosen limit then (${M.fmtNum(d.limit)} mg), by ${Math.round(d.total - d.limit)} mg.`);
    else lines.push(`Within your chosen limit then (${M.fmtNum(d.limit)} mg).`);
  }
  return { d, lines };
}

function startedBy(k) {
  return M.dayKey(st().createdAt) <= k;
}

function renderMorningCards() {
  const s = st();
  const t = todayKey();
  const y = M.addDays(t, -1);
  let out = '';
  if (startedBy(y) && !s.recapsSeen.includes(y)) {
    const { d, lines } = recapLines(y);
    out += `<section class="notice ${d.status === 'none' ? 'paper' : 'mint'} enter" aria-labelledby="recap-h" style="margin-top:14px">
      <span class="meta">Yesterday, ${esc(M.fmtDay(y))}</span>
      <h3 id="recap-h">${d.status === 'logged' ? 'Your day, logged.' : d.status === 'free' ? 'A caffeine-free day.' : 'No record.'}</h3>
      <div class="small stack">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
      <div class="row wrap">
        ${d.status === 'none' ? `<button type="button" class="btn small" data-action="mark-free" data-day="${y}">It was caffeine-free</button>
        <button type="button" class="btn small quiet" data-action="add-for-day" data-day="${y}">Add a drink</button>` : ''}
        <button type="button" class="btn small quiet" data-action="recap-done" data-day="${y}">Done</button>
      </div>
    </section>`;
  }
  const night = y;
  const bed = M.bedtimeFor(night, settingsFor(night).bedtime);
  const hour = new Date().getHours();
  if (s.prefs.sleepCheck && startedBy(night) && !s.sleepChecks[night] && now() > bed && hour >= 4) {
    out += `<section class="notice sky enter enter-2" aria-labelledby="sc-h" style="margin-top:14px">
      <span class="meta">${esc(M.nightLabel(night))}</span>
      <h3 id="sc-h">How did you sleep?</h3>
      <p class="small">Optional. It sits next to your caffeine estimates in History. It doesn't say what caused anything.</p>
      <div class="seg wrap" role="group" aria-label="How did you sleep?">
        ${SLEEP_ANSWERS.map(a => `<button type="button" data-action="sleep-answer" data-night="${night}" data-answer="${a.id}">${esc(a.label)}</button>`).join('')}
      </div>
    </section>`;
  }
  return out;
}

function reminderWindow() {
  const s = st();
  const k = todayKey();
  const set = settingsFor(k);
  if (!set.cutoff || s.prefs.reminder === 'off') return null;
  const p = M.parseHM(set.cutoff);
  const d = M.keyToDate(k);
  d.setHours(p.h, p.m, 0, 0);
  const at = d.getTime();
  return { start: at - 30 * 60000, at, k, cutoff: set.cutoff };
}

function renderReminderBanner() {
  const w = reminderWindow();
  if (!w) return '';
  const t = now();
  if (t < w.start || t >= w.at || st().reminderLog[w.k]) return '';
  return `<section class="notice yellow enter" style="margin-top:14px" aria-label="Reminder">
    <p class="lede">Heads-up: your chosen last-caffeine time is ${esc(w.cutoff)}.</p>
    <button type="button" class="btn small quiet" data-action="reminder-dismiss">Got it</button>
  </section>`;
}

/* ---------------- SLEEP ---------------- */

function renderSleep() {
  const s = st();
  const t = now();
  const nb = M.nextBedtime(t, settingsFor);
  const set = settingsFor(nb.nightKey);
  const anyB = M.anyBefore(s.consumptions, nb.at);
  const atBed = M.remainingAt(s.consumptions, nb.at);
  const fb = M.formatMg(atBed, anyB);
  const from = t - 3 * 3600000;
  const to = nb.at + 2 * 3600000;
  const past = M.curve(s.consumptions, from, t, 10);
  const proj = M.curve(s.consumptions, t, to, 10);
  const maxV = Math.max(...past.map(p => p.v), ...proj.map(p => p.v));
  if (ui.whatif && (M.fromLocalInput(ui.whatif.at) || 0) < t - 5 * 60000) ui.whatif.at = M.toLocalInput(t);
  const wi = whatIfData(nb);
  const extraPts = wi && wi.valid ? M.curve(s.consumptions, t, to, 10, [wi.drink]) : [];
  const maxY = niceMax(Math.max(maxV, ...extraPts.map(p => p.v), 20));
  const chart = lineChart({
    series: [
      { pts: past, stroke: '#2b1360', fill: 'rgba(43,19,96,.16)' },
      { pts: proj, stroke: '#2b1360', fill: 'rgba(43,19,96,.08)', dotted: true },
      ...(extraPts.length ? [{ pts: extraPts, stroke: '#141210', dotted: false, width: 3 }] : [])
    ],
    from, to, maxY,
    markers: [{ t, label: 'Now' }, { t: nb.at, label: 'Bed' }],
    aria: `Estimated caffeine from ${M.fmtTime(from)} to ${M.fmtTime(to)}. Now: ${M.formatMg(M.remainingAt(s.consumptions, t), M.anyBefore(s.consumptions, t)).text}. At bedtime ${M.fmtTime(nb.at)}: ${fb.text}.${extraPts.length ? ' Black line includes the what-if drink.' : ''} Dotted part is a projection.`,
    color: '#2b1360'
  });
  const afterMid = M.isAfterMidnight(set.bedtime);

  return `<div class="inner">
    <div class="topbar"><span class="meta">Sleep</span><button type="button" class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button></div>
    <section class="enter" style="margin-top:8px">
      <h1>Bed ${esc(M.fmtTime(nb.at))}</h1>
      <p class="lede" style="margin-top:10px">${esc(M.nightLabel(nb.nightKey))}${afterMid ? ', after midnight' : ''}.</p>
      <div class="row wrap" style="margin-top:12px">
        <label class="field grow" style="max-width:220px"><span>Usual bedtime</span><input type="time" value="${esc(set.bedtime)}" data-setting="bedtime" aria-describedby="bed-hint"></label>
      </div>
      <p class="field-hint" id="bed-hint">Times from 00:00 to 11:59 count as after midnight, for the night before. Changes apply from today; past days keep their bedtime.</p>
    </section>

    <section class="enter enter-2" style="margin-top:22px" aria-labelledby="atbed">
      <span class="meta" id="atbed">Estimated at bedtime</span>
      <div class="hero-num"><span class="num ${fb.tiny ? 'tiny' : ''}">${esc(fb.tiny ? 'Less than 1' : fb.num)}</span><span class="unit">mg</span></div>
      <p class="small" style="margin-top:8px">Projection from what you have logged so far. It estimates caffeine. It does not predict when you will actually fall asleep, and a low number is no guarantee.</p>
      <div style="margin-top:14px">${chart}</div>
      <p class="small muted" style="margin-top:6px">Solid: estimate up to now. Dotted: projection.${extraPts.length ? ' Black: with the what-if drink.' : ''}</p>
    </section>

    <section class="enter enter-3 tile" style="margin-top:18px">
      <span class="meta">Your last-caffeine time</span>
      <div class="row wrap" style="margin-top:8px">
        <input type="time" value="${esc(set.cutoff || '')}" data-setting="cutoff" aria-label="Your last-caffeine time" style="max-width:180px">
        ${set.cutoff ? `<button type="button" class="btn small quiet inline" data-action="clear-cutoff">Clear</button>` : ''}
      </div>
      <p class="small" style="margin-top:8px">${set.cutoff ? `Set to ${esc(set.cutoff)}. A plan you chose, not medical advice. Drinks after it still get logged as usual.` : 'Optional. Pick a daily time after which you plan to skip caffeine.'}</p>
    </section>

    <section class="whatif enter enter-4" style="margin-top:18px" aria-labelledby="wi-h">
      <h2 id="wi-h">What if?</h2>
      <p class="lede">Another coffee? See what changes.</p>
      ${renderWhatIfForm(nb, wi)}
    </section>
  </div>`;
}

function whatIfDefaults() {
  const fav = st().favorites[0];
  return {
    pick: fav ? 'fav:' + fav.id : 'custom',
    name: fav ? fav.name : 'Coffee',
    mg: fav ? fav.mgPerServing : 96,
    at: M.toLocalInput(now())
  };
}

function whatIfData(nb) {
  if (!ui.whatif) ui.whatif = whatIfDefaults();
  const w = ui.whatif;
  const at = M.fromLocalInput(w.at);
  const mg = parseNum(w.mg);
  const t = now();
  let error = null;
  if (mg == null || mg < 0) error = 'Enter an amount in mg.';
  else if (at == null) error = 'Pick a time.';
  else if (at < t - 5 * 60000) error = 'Pick a time from now on. Past drinks belong in the log.';
  else if (at >= nb.at) error = 'Pick a time before the selected bedtime.';
  const drink = { at: at ?? t, totalMg: mg ?? 0 };
  const without = M.remainingAt(st().consumptions, nb.at);
  const withD = error ? without : M.remainingAt(st().consumptions, nb.at, [drink]);
  return { valid: !error, error, drink, without, with: withD, diff: withD - without, at, mg, nb, isNow: at != null && Math.abs(at - t) <= 5 * 60000 };
}

function miniTank(v, label, scaleMax) {
  const h = 100;
  const fill = v >= 1 ? Math.max(10, Math.min(1, v / scaleMax) * h) : 0;
  return `<div class="mini"><span class="meta">${label}</span>
    <svg viewBox="0 0 60 ${h}" width="48" height="80" aria-hidden="true"><rect x="0" y="0" width="60" height="${h}" rx="14" fill="#2747c9"/>${fill ? `<rect x="0" y="${(h - fill).toFixed(1)}" width="60" height="${fill.toFixed(1)}" rx="${Math.min(14, fill / 2).toFixed(1)}" fill="#ff8a3d"/>` : ''}</svg>
    <span class="num">${esc(M.formatMg(v, v > 0).num)}<small style="font-size:20px"> mg</small></span></div>`;
}

function renderWhatIfForm(nb, wi) {
  const favs = st().favorites;
  const w = ui.whatif;
  return `
    <div class="field">
      <span class="field-label" id="wi-pick">Drink</span>
      <div class="seg wrap" role="group" aria-labelledby="wi-pick">
        ${favs.slice(0, 6).map(f => `<button type="button" data-action="wi-pick" data-pick="fav:${f.id}" aria-pressed="${w.pick === 'fav:' + f.id}">${esc(f.name)}</button>`).join('')}
        <button type="button" data-action="wi-pick" data-pick="custom" aria-pressed="${w.pick === 'custom'}">Custom</button>
      </div>
    </div>
    <div class="grid2 collapse">
      <label class="field"><span>Caffeine (mg)</span><input type="text" inputmode="decimal" value="${esc(w.mg)}" data-wi="mg"></label>
      <label class="field"><span>When</span><input type="datetime-local" value="${esc(w.at)}" data-wi="at" min="${esc(M.toLocalInput(now()))}"></label>
    </div>
    <div id="wi-result">${renderWhatIfResult(wi)}</div>`;
}

function renderWhatIfResult(wi) {
  if (!wi.valid) return `<p class="field-error" role="alert">${esc(wi.error)}</p>`;
  const scaleMax = niceMax(Math.max(wi.with, wi.without, 50));
  return `
    <div class="cmp" aria-live="polite">
      ${miniTank(wi.without, 'Without', scaleMax)}
      ${miniTank(wi.with, 'With it', scaleMax)}
    </div>
    <p class="small muted">Estimated at bedtime. Both tanks use the same scale, 0 to ${scaleMax} mg.</p>
    <div class="diff">+${Math.round(wi.diff)} mg at bedtime</div>
    <p class="small">Preview only. Nothing is logged.</p>
    ${wi.isNow
      ? `<button type="button" class="btn" data-action="wi-log">I'm having it now</button>
         <p class="small muted">Opens the log form so you can confirm the details.</p>`
      : `<p class="small"><strong>It's a future drink, so it stays a preview.</strong> Log it when you actually have it.</p>`}`;
}

/* ---------------- DISCOVER ---------------- */

function ensureDaily(k) {
  const s = st();
  if (s.discover.daily[k]) return s.discover.daily[k];
  const pair = M.pickDaily(BY_CAT, s.discover, k);
  save(d => { d.discover.daily[k] = pair; });
  return pair;
}

const isSaved = id => st().discover.saved.some(x => x.id === id);

function sourceList(item) {
  return `<div class="sources"><span class="meta">${item.sources.length > 1 ? 'Sources' : 'Source'}</span>
    ${item.sources.map(sid => { const src = SOURCES[sid]; return `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.label)}</a>`; }).join('')}
    <span class="checked">Checked against source: ${esc(item.checked)}</span></div>`;
}

function backContent(item, headingId) {
  const isMyth = item.category === 'myth';
  return `
    <span class="kicker">${isMyth ? 'Mythbusters' : 'Fun Fact'}</span>
    ${isMyth ? `<h3 class="back-title" id="${headingId}" tabindex="-1">"${esc(item.title)}"</h3><span class="verdict">${esc(item.verdict)}</span>`
      : `<h3 class="back-title" id="${headingId}" tabindex="-1">${esc(item.title)}</h3><p class="fact-text">${esc(item.fact)}</p>`}
    <p class="body">${esc(item.explain)}</p>
    <div class="nuance"><strong>Nuance</strong>${esc(item.nuance)}</div>
    ${item.more ? `<details class="more"><summary>Read more</summary><p class="body">${esc(item.more)}</p></details>` : ''}
    ${sourceList(item)}
    <p class="small"><span class="meta">Topic</span> ${esc(TOPICS[item.topic])}</p>`;
}

function flipCard(item) {
  const isMyth = item.category === 'myth';
  const kicker = isMyth ? 'Mythbusters' : 'Fun Fact';
  const saved = isSaved(item.id);
  return `<article class="flip ${isMyth ? 'myth' : 'fact'} wiggle" data-card="${item.id}" aria-label="${kicker}">
    <div class="side front">
      <button type="button" class="flip-btn" data-action="flip" data-card="${item.id}" aria-label="${kicker}: ${esc(item.title)} Tap to reveal.">
        <span class="kicker" aria-hidden="true">${kicker}</span>
        <span class="front-title" aria-hidden="true">${isMyth ? '"' + esc(item.title) + '"' : esc(item.title)}</span>
        <span class="row spread" aria-hidden="true"><span class="tap">Tap to reveal.</span>${faceSVG(item.face, { size: 76, cls: 'front-face' })}</span>
      </button>
    </div>
    <div class="side back" aria-hidden="true" inert>
      ${backContent(item, 'bh-' + item.id)}
      <div class="card-actions">
        <button type="button" class="btn small" data-action="save-card" data-card="${item.id}" aria-pressed="${saved}">${icon('bookmark')}${saved ? 'Saved' : 'Save'}</button>
        <button type="button" class="btn small quiet" data-action="flip" data-card="${item.id}">${icon('flip')}Flip back</button>
      </div>
    </div>
  </article>`;
}

function renderDiscover() {
  const k = todayKey();
  if (ui.discoverView !== 'today') return renderArchive();
  const pair = ensureDaily(k);
  const fact = ITEM[pair.fact], myth = ITEM[pair.myth];
  const prevCount = Object.keys(st().discover.daily).filter(d => d < k).length;
  const savedCount = st().discover.saved.length;
  return `
    <div class="topbar"><span class="meta">${esc(M.fmtDay(k))}</span><button type="button" class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button></div>
    <h1 class="enter" style="margin-top:6px">Discover</h1>
    <p class="lede enter" style="margin:10px 0 18px">One Fun Fact and one Mythbusters a day. New pair tomorrow.</p>
    <div class="cards">
      <div class="enter enter-2">${flipCard(fact)}</div>
      <div class="enter enter-3">${flipCard(myth)}</div>
    </div>
    <div class="stack enter enter-4" style="margin-top:18px">
      <button type="button" class="menu-item" data-action="discover-view" data-view="previous">
        <span class="ico cobalt">${icon('cards')}</span>
        <span class="grow"><span class="t">Previous cards</span><span class="d">${prevCount ? `${prevCount} earlier ${prevCount === 1 ? 'day' : 'days'} of cards.` : 'Cards from earlier days collect here.'}</span></span>
      </button>
      <button type="button" class="menu-item" data-action="discover-view" data-view="saved">
        <span class="ico yellow">${icon('bookmark')}</span>
        <span class="grow"><span class="t">Saved</span><span class="d">${savedCount ? `${savedCount} saved ${savedCount === 1 ? 'card' : 'cards'}.` : 'Nothing saved yet.'}</span></span>
      </button>
    </div>
    <p class="small muted" style="margin-top:18px">Cards come from a fixed, checked collection built into the app. Each one names its source. Not medical advice.</p>`;
}

function renderArchive() {
  const s = st();
  const k = todayKey();
  const saved = ui.discoverView === 'saved';
  let entries = [];
  if (saved) {
    entries = [...s.discover.saved].sort((a, b) => b.savedAt - a.savedAt).map(x => ({ id: x.id, day: null }));
  } else {
    const days = Object.keys(s.discover.daily).filter(d => d < k).sort().reverse();
    for (const d of days) {
      const p = s.discover.daily[d];
      if (p.fact) entries.push({ id: p.fact, day: d });
      if (p.myth) entries.push({ id: p.myth, day: d });
    }
  }
  entries = entries.filter(e => ITEM[e.id]);
  const filtered = entries.filter(e => {
    const it = ITEM[e.id];
    return (ui.archiveCat === 'all' || it.category === ui.archiveCat) && (ui.archiveTopic === 'all' || it.topic === ui.archiveTopic);
  });
  const usedTopics = [...new Set(entries.map(e => ITEM[e.id].topic))];
  return `
    <div class="topbar"><button type="button" class="icon-btn" data-action="discover-view" data-view="today" aria-label="Back to today's cards">${icon('left')}</button><span class="meta">Discover</span></div>
    <h1 class="enter" style="margin-top:10px">${saved ? 'Saved' : 'Previous cards'}</h1>
    <div class="stack" style="margin-top:16px">
      <div class="seg" role="group" aria-label="Filter by category">
        ${[['all', 'All'], ['fact', 'Fun Fact'], ['myth', 'Mythbusters']].map(([v, l]) => `<button type="button" data-action="archive-cat" data-cat="${v}" aria-pressed="${ui.archiveCat === v}">${l}</button>`).join('')}
      </div>
      <label class="field"><span>Topic</span>
        <select data-archive-topic>
          <option value="all">All topics</option>
          ${Object.entries(TOPICS).filter(([t]) => usedTopics.includes(t) || ui.archiveTopic === t).map(([t, l]) => `<option value="${t}" ${ui.archiveTopic === t ? 'selected' : ''}>${esc(l)}</option>`).join('')}
        </select>
      </label>
    </div>
    <p class="small" style="margin:14px 0 10px" aria-live="polite">${filtered.length} ${filtered.length === 1 ? 'card' : 'cards'}${entries.length !== filtered.length ? ` of ${entries.length}` : ''}.</p>
    <div class="list">
      ${filtered.length ? filtered.map(e => archiveItem(e)).join('') : `<div class="notice paper">${faceSVG('sleepy', { size: 56 })}<p class="lede">${saved ? 'No saved cards here yet. Tap Save on a card to keep it.' : entries.length ? 'No cards match these filters.' : 'Earlier cards show up here from tomorrow on.'}</p></div>`}
    </div>`;
}

function archiveItem(e) {
  const it = ITEM[e.id];
  const key = (e.day || 'saved') + ':' + it.id;
  const open = ui.openArchive === key;
  const saved = isSaved(it.id);
  return `<div class="arch-item ${it.category}">
    <button type="button" class="arch-toggle" data-action="arch-toggle" data-key="${esc(key)}" aria-expanded="${open}" aria-controls="ab-${esc(key)}">
      ${faceSVG(it.face, { size: 40, cls: 'still' })}
      <span class="grow"><span class="meta">${it.category === 'myth' ? 'Mythbusters' : 'Fun Fact'}${e.day ? ', ' + esc(M.fmtDay(e.day)) : ''}</span><span class="t" style="display:block">${it.category === 'myth' ? '"' + esc(it.title) + '"' : esc(it.title)}</span></span>
      ${icon(open ? 'up' : 'down', 'width="24" height="24"')}
    </button>
    <div class="arch-body" id="ab-${esc(key)}" ${open ? '' : 'hidden'}>
      ${it.category === 'myth' ? `<span class="verdict">${esc(it.verdict)}</span>` : `<p class="lede">${esc(it.fact)}</p>`}
      <p>${esc(it.explain)}</p>
      <div class="nuance"><strong>Nuance: </strong>${esc(it.nuance)}</div>
      ${it.more ? `<p class="small">${esc(it.more)}</p>` : ''}
      ${sourceList(it)}
      <button type="button" class="btn small" data-action="save-card" data-card="${it.id}" aria-pressed="${saved}">${icon('bookmark')}${saved ? 'Saved' : 'Save'}</button>
    </div>
  </div>`;
}

/* ---------------- HISTORY ---------------- */

function renderHistory() {
  if (!ui.historyKey) ui.historyKey = todayKey();
  const mode = ui.historyMode;
  const k = ui.historyKey;
  const t = todayKey();
  let label, canNext;
  if (mode === 'day') { label = k === t ? 'Today' : M.fmtDay(k, true); canNext = k < t; }
  else if (mode === 'week') { const w = M.weekKeys(k); label = `${M.fmtDay(w[0])} to ${M.fmtDay(w[6])}`; canNext = w[6] < t; }
  else { label = M.fmtMonth(k); const m = M.monthKeys(k); canNext = m[m.length - 1] < t; }
  return `
    <div class="topbar"><span class="meta">Your log</span><button type="button" class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button></div>
    <h1 class="enter" style="margin-top:6px">History</h1>
    <div class="seg" role="group" aria-label="View" style="margin-top:16px">
      ${[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([v, l]) => `<button type="button" data-action="hist-mode" data-mode="${v}" aria-pressed="${mode === v}">${l}</button>`).join('')}
    </div>
    <div class="dnav" style="margin-top:14px">
      <button type="button" class="icon-btn" data-action="hist-nav" data-dir="-1" aria-label="Previous ${mode}">${icon('left')}</button>
      <span class="lab" aria-live="polite">${esc(label)}</span>
      <button type="button" class="icon-btn" data-action="hist-nav" data-dir="1" aria-label="Next ${mode}" ${canNext ? '' : 'disabled'}>${icon('right')}</button>
    </div>
    <div style="margin-top:16px">${mode === 'day' ? renderDay(k) : renderRange(mode === 'week' ? M.weekKeys(k) : M.monthKeys(k), mode)}</div>`;
}

function renderDay(k) {
  const s = st();
  const d = M.daySummary(s, k);
  const t = now();
  const today = todayKey();
  const isFuture = k > today;
  const list = M.consumptionsOn(s.consumptions, k);
  const statusTxt = { logged: 'Drinks logged', free: 'Confirmed caffeine-free', none: 'Nothing recorded' }[d.status];
  const from = M.dayStart(k);
  const to = Math.max(M.dayEnd(k), d.bedAt + 3600000);
  const split = Math.min(Math.max(t, from), to);
  const pastPts = M.curve(s.consumptions, from, split, 10);
  const projPts = split < to ? M.curve(s.consumptions, split, to, 10) : [];
  const maxY = niceMax(Math.max(20, ...pastPts.map(p => p.v), ...projPts.map(p => p.v)));
  const peak = [...pastPts, ...projPts].reduce((a, p) => p.v > a.v ? p : a, { v: 0, t: from });
  const chart = lineChart({
    series: [
      { pts: pastPts, stroke: '#2747c9', fill: 'rgba(39,71,201,.16)' },
      ...(projPts.length ? [{ pts: projPts, stroke: '#2747c9', fill: 'rgba(39,71,201,.07)', dotted: true }] : [])
    ],
    from, to, maxY,
    markers: [{ t: d.bedAt, label: 'Bed ' + d.bedtime }, ...(t > from && t < to ? [{ t, label: 'Now' }] : [])],
    aria: `Estimated caffeine in the body on ${M.fmtDay(k)}, ${M.fmtTime(from)} to ${M.fmtTime(to)}. Highest about ${Math.round(peak.v)} mg at ${M.fmtTime(peak.t)}. At bedtime: ${M.formatMg(d.atBedtime, d.atBedtimeAny).text}.${projPts.length ? ' Dotted part is a projection.' : ''}`,
    color: '#141210'
  });
  const { lines } = recapLines(k);
  const nightDone = d.bedAt < t;
  const sc = s.sleepChecks[k];

  return `
    <div class="row wrap spread">
      <span class="status-pill ${d.status}">${statusTxt}</span>
      ${!isFuture && d.status === 'none' ? `<button type="button" class="btn small inline" data-action="mark-free" data-day="${k}">Mark caffeine-free</button>` : ''}
      ${d.status === 'free' ? `<button type="button" class="btn small quiet inline" data-action="unmark-free" data-day="${k}">Remove caffeine-free mark</button>` : ''}
    </div>

    <div class="grid2" style="margin-top:12px">
      <div class="tile ${d.over ? 'yellow' : ''}"><span class="meta">Consumed</span><div class="num">${Math.round(d.total)}<small> mg</small></div>
        <div class="sub">${d.limit == null ? 'No limit set that day.' : d.over ? `Above your chosen limit (${M.fmtNum(d.limit)} mg).` : `Limit that day: ${M.fmtNum(d.limit)} mg.`}</div></div>
      <div class="tile"><span class="meta">Last intake</span><div class="num">${d.last ? M.fmtTime(d.last.at) : 'None'}</div>
        <div class="sub">${d.count} ${d.count === 1 ? 'drink' : 'drinks'}.</div></div>
      <div class="tile lila" style="grid-column:1 / -1"><span class="meta">Estimated at bedtime (${esc(d.bedtime)})${d.bedAt > t ? ', projection' : ''}</span>
        <div class="num">${esc(M.formatMg(d.atBedtime, d.atBedtimeAny).num)}<small> mg</small></div>
        <div class="sub">${esc(M.nightLabel(k))}. Includes caffeine from earlier days.</div></div>
    </div>

    <section style="margin-top:18px" aria-labelledby="curve-h">
      <h3 id="curve-h">Estimated curve</h3>
      <div style="margin-top:8px">${chart}</div>
      <p class="small muted">Estimated caffeine in the body, in mg, with a 5-hour half-life model.${projPts.length ? ' Dotted: projection.' : ''}</p>
    </section>

    <section style="margin-top:18px" aria-labelledby="drinks-h">
      <div class="row spread"><h3 id="drinks-h">Drinks</h3></div>
      <div class="list" style="margin-top:10px">
        ${list.length ? list.map(c => `
          <button type="button" class="item" data-action="edit-consumption" data-id="${c.id}" aria-label="Edit ${esc(c.name)}, ${M.fmtNum(c.totalMg)} mg at ${M.fmtTime(c.at)}">
            <span class="grow"><span class="name">${esc(c.name)}</span><br><span class="sub">${M.fmtTime(c.at)}, ${esc(c.servings !== 1 ? M.fmtNum(c.servings) + ' x ' : '')}${esc(c.portion || catLabel(c.category))}, ${c.source === 'label' ? 'from label' : 'estimate'}</span></span>
            <span class="mg">${M.fmtNum(c.totalMg)} mg</span>${icon('edit', 'width="22" height="22"')}
          </button>`).join('') : `<p class="small">${d.status === 'free' ? 'Confirmed caffeine-free.' : 'No drinks logged for this day.'}</p>`}
      </div>
      ${!isFuture ? `<button type="button" class="btn quiet small" style="margin-top:10px" data-action="add-for-day" data-day="${k}">${icon('plus')}Add a drink to this day</button>` : ''}
    </section>

    ${k < today ? `<section class="notice paper" style="margin-top:18px" aria-labelledby="recap-h2">
      <h3 id="recap-h2">Day recap</h3>
      <div class="small stack">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
    </section>` : ''}

    <section class="notice sky" style="margin-top:14px" aria-labelledby="sc-h2">
      <span class="meta">${esc(M.nightLabel(k))}</span>
      <h3 id="sc-h2">Sleep check</h3>
      ${nightDone ? `
        <p class="small">${sc ? `You said: <strong>${esc(sleepLabel(sc.answer))}</strong>. Change it any time.` : 'No answer for this night.'} Shown next to the estimates, not as a cause.</p>
        <div class="seg wrap" role="group" aria-label="How did you sleep that night?">
          ${SLEEP_ANSWERS.map(a => `<button type="button" data-action="sleep-answer" data-night="${k}" data-answer="${a.id}" aria-pressed="${sc ? sc.answer === a.id : false}">${esc(a.label)}</button>`).join('')}
        </div>` : '<p class="small">Available after this night\'s bedtime.</p>'}
    </section>`;
}

function renderRange(keys, mode) {
  const s = st();
  const t = todayKey();
  const pastKeys = keys.filter(k => k <= t);
  const sum = M.rangeSummary(s, pastKeys);
  const allDays = keys.map(k => M.daySummary(s, k));
  const avgTxt = sum.average == null
    ? 'No recorded days yet, so no average.'
    : `Average ${Math.round(sum.average)} mg per recorded day, over ${sum.recordedCount} recorded ${sum.recordedCount === 1 ? 'day' : 'days'} (${sum.loggedCount} logged, ${sum.freeCount} confirmed caffeine-free).`;
  return `
    <div class="grid2">
      <div class="tile"><span class="meta">Average</span><div class="num">${sum.average == null ? 'None' : Math.round(sum.average) + '<small> mg</small>'}</div><div class="sub">per recorded day</div></div>
      <div class="tile ${sum.overCount ? 'yellow' : ''}"><span class="meta">Above chosen limit</span><div class="num">${sum.overCount}<small> ${sum.overCount === 1 ? 'day' : 'days'}</small></div><div class="sub">${sum.limitDays ? `of ${sum.limitDays} recorded days with a limit set` : 'No limit set on recorded days.'}</div></div>
    </div>
    <p class="small" style="margin-top:12px">${esc(avgTxt)} ${sum.noneCount ? `${sum.noneCount} ${sum.noneCount === 1 ? 'day' : 'days'} with nothing recorded ${sum.noneCount === 1 ? 'is' : 'are'} left out, not counted as zero.` : ''}</p>
    <section style="margin-top:14px" aria-labelledby="bars-h">
      <h3 id="bars-h" class="sr-only">Caffeine per day</h3>
      ${barsChart(allDays, { mode, today: t })}
      <p class="small muted" style="margin-top:6px">Consumed per day in mg. Blue: logged. Yellow: above the limit you had set that day. Green stub: confirmed caffeine-free. Empty: nothing recorded.</p>
    </section>
    <section style="margin-top:16px">
      <div class="list">
        ${pastKeys.slice().reverse().map(k => {
          const d = M.daySummary(s, k);
          const status = d.status === 'logged' ? `${Math.round(d.total)} mg` : d.status === 'free' ? 'Caffeine-free' : 'Nothing recorded';
          return `<button type="button" class="item" data-action="hist-open-day" data-day="${k}">
            <span class="grow"><span class="name">${esc(M.fmtDay(k))}</span><br>
              <span class="sub">${d.last ? 'Last ' + M.fmtTime(d.last.at) : d.status === 'none' ? 'No record' : 'No drinks'}${d.over ? ', above limit' : ''}${d.sleep ? ', slept: ' + esc(sleepLabel(d.sleep.answer)) : ''}</span></span>
            <span class="mg">${esc(status)}</span>
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

/* =========================================================
   Add / edit consumption
   ========================================================= */

let addEntry = null;
const add = { step: 'pick', cat: 'coffee', draft: null, editId: null, errors: {} };

function parseNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function newDraft(base = {}, at = now()) {
  return {
    name: base.name || '',
    category: base.category || add.cat || 'coffee',
    portion: base.portion || '',
    mgPerServing: base.mgPerServing != null ? String(base.mgPerServing) : base.mg != null ? String(base.mg) : '',
    servings: base.servings != null ? String(base.servings) : '1',
    source: base.source || 'estimate',
    at: M.toLocalInput(base.at || at),
    saveFav: false,
    note: base.note || ''
  };
}

function openAdd({ dayKey = null } = {}) {
  add.step = 'pick';
  add.editId = null;
  add.errors = {};
  add.dayKey = dayKey;
  add.defaultAt = dayKey && dayKey !== todayKey() ? (() => { const d = M.keyToDate(dayKey); d.setHours(12, 0, 0, 0); return d.getTime(); })() : null;
  addEntry = openSheet({ title: dayKey && dayKey !== todayKey() ? 'Add for ' + M.fmtDayShort(dayKey) : 'Add caffeine', body: renderAddPick() });
}

function openEditConsumption(id) {
  const c = st().consumptions.find(x => x.id === id);
  if (!c) return;
  add.step = 'form';
  add.editId = id;
  add.errors = {};
  add.draft = newDraft(c, c.at);
  addEntry = openSheet({ title: 'Edit drink', body: renderAddForm() });
}

function renderAddPick() {
  const s = st();
  const favs = s.favorites;
  return `
    <section aria-labelledby="fav-h">
      <div class="row spread"><h3 id="fav-h">Favourites</h3><button type="button" class="link-btn" data-action="manage-favs">Manage</button></div>
      <div class="list" style="margin-top:10px">
        ${favs.length ? favs.map(f => `<div class="fav-row">
            <button type="button" class="item" data-action="fav-details" data-id="${f.id}" aria-label="${esc(f.name)}, ${M.fmtNum(f.mgPerServing)} mg. Adjust details first.">
              <span class="grow"><span class="name">${esc(f.name)}</span><br><span class="sub">${esc(f.portion || catLabel(f.category))}, ${f.source === 'label' ? 'label' : 'estimate'}</span></span>
              <span class="mg">${M.fmtNum(f.mgPerServing)} mg</span>
            </button>
            <button type="button" class="fav-log" data-action="fav-quick" data-id="${f.id}" aria-label="Log ${esc(f.name)} now">Log</button>
          </div>`).join('') : `<p class="small">No favourites yet. Tick "Save as favourite" when you log a drink, or add one under Manage.</p>`}
      </div>
      ${favs.length ? '<p class="small muted" style="margin-top:8px">LOG adds it right now. Tap the drink itself to adjust first.</p>' : ''}
    </section>

    <section style="margin-top:22px" aria-labelledby="cat-h">
      <h3 id="cat-h">Pick a drink</h3>
      <div class="seg wrap" role="group" aria-label="Category" style="margin-top:10px">
        ${CATS.map(c => `<button type="button" data-action="add-cat" data-cat="${c.id}" aria-pressed="${add.cat === c.id}">${esc(c.short)}</button>`).join('')}
      </div>
      <div class="preset-grid" style="margin-top:10px">
        ${PRESETS[add.cat].map((p, i) => `<button type="button" class="preset" data-action="preset" data-i="${i}">
          <span class="name">${esc(p.name)}<br><span class="small" style="font-weight:600">${esc(p.portion)}</span></span>
          <span class="mg">~${p.mg} mg</span>
        </button>`).join('')}
      </div>
      <p class="small muted" style="margin-top:8px">Starting values are rough estimates. You can change everything on the next step.</p>
      <button type="button" class="btn quiet" style="margin-top:12px" data-action="custom-drink">${icon('edit')}Custom drink</button>
    </section>`;
}

function addPreview() {
  const dr = add.draft;
  const mg = parseNum(dr.mgPerServing);
  const sv = parseNum(dr.servings);
  const at = M.fromLocalInput(dr.at);
  if (mg == null || sv == null || at == null || mg < 0 || sv <= 0) return null;
  const total = M.roundMg(mg * sv);
  const k = M.dayKey(at);
  const others = st().consumptions.filter(c => c.id !== add.editId);
  const dayTotal = M.consumedOn(others, k) + total;
  const limit = settingsFor(k).dailyLimit;
  return { total, k, dayTotal, limit, over: limit != null && dayTotal > limit, future: at > now() + 60000 };
}

function previewHTML() {
  const p = addPreview();
  if (!p) return `<div class="preview-box"><span class="meta">Preview</span><p>Fill in an amount and a time to see the totals.</p></div>`;
  if (p.future) return `<div class="preview-box over" role="alert"><span class="big">Not yet</span><p>That time is in the future. This logs drinks you've actually had. For a preview, use What if? on Sleep.</p></div>`;
  const dayLabel = p.k === todayKey() ? 'today' : M.fmtDay(p.k);
  return `<div class="preview-box ${p.over ? 'over' : ''}">
    <span class="big">+${M.fmtNum(p.total)} mg</span>
    <p>New total for ${esc(dayLabel)}: <strong>${M.fmtNum(p.dayTotal)} mg</strong>.</p>
    <p>${p.limit == null ? 'No daily limit set for that day.' : p.over ? `Above your chosen daily limit of ${M.fmtNum(p.limit)} mg, by ${M.fmtNum(p.dayTotal - p.limit)} mg.` : `Your chosen limit that day: ${M.fmtNum(p.limit)} mg.`}</p>
  </div>`;
}

function renderAddForm() {
  const dr = add.draft;
  const e = add.errors;
  const editing = !!add.editId;
  return `
    <form id="add-form" novalidate>
      ${!editing ? `<button type="button" class="link-btn" data-action="add-back">${icon('left', 'width="20" height="20" style="display:inline;vertical-align:-4px"')} Back to drinks</button>` : ''}
      <div class="stack-l">
        <label class="field"><span>Product</span><input type="text" name="name" value="${esc(dr.name)}" autocomplete="off" maxlength="80" required ${e.name ? 'aria-invalid="true" aria-describedby="err-name"' : ''}>${e.name ? `<p class="field-error" id="err-name">${esc(e.name)}</p>` : ''}</label>
        <div class="field"><span class="field-label" id="cat-l">Category</span>
          <div class="seg wrap" role="group" aria-labelledby="cat-l">
            ${CATS.map(c => `<button type="button" data-action="draft-cat" data-cat="${c.id}" aria-pressed="${dr.category === c.id}">${esc(c.short)}</button>`).join('')}
          </div></div>
        <label class="field"><span>Portion</span><input type="text" name="portion" value="${esc(dr.portion)}" placeholder="e.g. 240 ml mug" maxlength="60"></label>
        <div class="grid2">
          <label class="field"><span>Caffeine per serving (mg)</span><input type="text" inputmode="decimal" name="mgPerServing" value="${esc(dr.mgPerServing)}" ${e.mg ? 'aria-invalid="true" aria-describedby="err-mg"' : ''}>${e.mg ? `<p class="field-error" id="err-mg">${esc(e.mg)}</p>` : ''}</label>
          <label class="field"><span>Servings</span><input type="text" inputmode="decimal" name="servings" value="${esc(dr.servings)}" ${e.sv ? 'aria-invalid="true" aria-describedby="err-sv"' : ''}>${e.sv ? `<p class="field-error" id="err-sv">${esc(e.sv)}</p>` : ''}</label>
        </div>
        <div class="field"><span class="field-label" id="src-l">Caffeine amount comes from</span>
          <div class="seg" role="group" aria-labelledby="src-l">
            <button type="button" data-action="draft-src" data-src="estimate" aria-pressed="${dr.source === 'estimate'}">Estimate</button>
            <button type="button" data-action="draft-src" data-src="label" aria-pressed="${dr.source === 'label'}">Product label</button>
          </div>
          ${dr.note ? `<p class="field-hint">${esc(dr.note)}</p>` : ''}
        </div>
        <label class="field"><span>Date and time</span><input type="datetime-local" name="at" value="${esc(dr.at)}" max="${esc(M.toLocalInput(now() + 60000))}" ${e.at ? 'aria-invalid="true" aria-describedby="err-at"' : ''}>${e.at ? `<p class="field-error" id="err-at">${esc(e.at)}</p>` : ''}</label>
        <div class="row wrap">
          <button type="button" class="btn small quiet inline" data-action="time-shift" data-min="0">Now</button>
          <button type="button" class="btn small quiet inline" data-action="time-shift" data-min="-30">30 min ago</button>
          <button type="button" class="btn small quiet inline" data-action="time-shift" data-min="-60">1 h ago</button>
        </div>
        ${!editing ? `<div class="toggle"><span class="lede" id="fav-l">Save as favourite</span><button type="button" class="switch" role="switch" aria-checked="${dr.saveFav}" aria-labelledby="fav-l" data-action="toggle-savefav"></button></div>` : ''}
        <div id="add-preview" aria-live="polite">${previewHTML()}</div>
        <button type="submit" class="btn" id="add-submit">${editing ? 'Save changes' : 'Log it'}</button>
        ${editing ? `
          <button type="button" class="btn quiet" data-action="fav-from-consumption">${icon('star')}Make it a favourite</button>
          <button type="button" class="btn red" data-action="delete-consumption">${icon('trash')}Delete drink</button>` : ''}
      </div>
    </form>`;
}

function rerenderAdd() {
  if (!addEntry) return;
  setSheetBody(addEntry, add.step === 'pick' ? renderAddPick() : renderAddForm());
}

function readDraftFromForm() {
  const f = $('#add-form');
  if (!f) return;
  for (const n of ['name', 'portion', 'mgPerServing', 'servings', 'at']) {
    const el = f.elements[n];
    if (el) add.draft[n] = el.value;
  }
}

function validateDraft() {
  const dr = add.draft;
  const errors = {};
  if (!dr.name.trim()) errors.name = 'Give it a name.';
  const mg = parseNum(dr.mgPerServing);
  if (mg == null || mg < 0) errors.mg = 'Enter a number, 0 or more.';
  else if (mg > 2000) errors.mg = 'That is more than 2000 mg per serving. Check the number.';
  const sv = parseNum(dr.servings);
  if (sv == null || sv <= 0) errors.sv = 'Enter more than 0.';
  else if (sv > 20) errors.sv = 'Up to 20 servings at once.';
  const at = M.fromLocalInput(dr.at);
  if (at == null) errors.at = 'Pick a date and time.';
  else if (at > now() + 60000) errors.at = 'That is in the future. Log drinks you have had. For previews, use What if? on Sleep.';
  return errors;
}

async function submitDraft() {
  if (ui.saving) return;
  readDraftFromForm();
  add.errors = validateDraft();
  if (Object.keys(add.errors).length) {
    rerenderAdd();
    const first = $('[aria-invalid="true"]', addEntry.sheet);
    if (first) first.focus();
    return;
  }
  const dr = add.draft;
  const mg = parseNum(dr.mgPerServing);
  const sv = parseNum(dr.servings);
  const at = M.fromLocalInput(dr.at);
  const rec = {
    name: dr.name.trim(),
    category: dr.category,
    portion: dr.portion.trim(),
    mgPerServing: mg,
    servings: sv,
    totalMg: M.roundMg(mg * sv),
    at,
    source: dr.source
  };
  if (add.editId) {
    const old = st().consumptions.find(c => c.id === add.editId);
    const ok = save(d => {
      const c = d.consumptions.find(x => x.id === add.editId);
      Object.assign(c, rec, { updatedAt: now() });
      d.caffeineFreeDays = d.caffeineFreeDays.filter(k => k !== M.dayKey(at));
    });
    if (!ok) return;
    closeSheet();
    addEntry = null;
    render();
    toast('Changes saved.', { undo: () => { if (save(d => { const i = d.consumptions.findIndex(x => x.id === old.id); if (i >= 0) d.consumptions[i] = old; })) { render(); toast('Change undone.'); } } });
    return;
  }
  await logConsumption(rec, { saveFav: dr.saveFav });
}

async function logConsumption(rec, { saveFav = false } = {}) {
  if (ui.saving) return false;
  ui.saving = true;
  try {
    const t = now();
    const dup = st().consumptions.find(c => c.name === rec.name && Math.abs(c.totalMg - rec.totalMg) < 0.01 && t - c.createdAt < 90000);
    if (dup) {
      const secs = Math.max(1, Math.round((t - dup.createdAt) / 1000));
      const go = await confirmModal({ title: 'Again?', text: `You logged ${rec.name} ${secs} seconds ago. Log a second one?`, ok: 'Log another', cancel: 'No, keep one', face: 'shock' });
      if (!go) return false;
    }
    const before = M.remainingAt(st().consumptions, now());
    const id = S.uid();
    const k = M.dayKey(rec.at);
    const wasFree = st().caffeineFreeDays.includes(k);
    const ok = save(d => {
      d.consumptions.push({ id, ...rec, createdAt: now(), updatedAt: now() });
      d.caffeineFreeDays = d.caffeineFreeDays.filter(x => x !== k);
      if (saveFav && !d.favorites.some(f => f.name === rec.name && f.mgPerServing === rec.mgPerServing && f.portion === rec.portion)) {
        d.favorites.push({ id: S.uid(), name: rec.name, category: rec.category, portion: rec.portion, mgPerServing: rec.mgPerServing, source: rec.source });
      }
    });
    if (!ok) return false;
    haptic('medium');
    if (sheetStack.length) closeSheet({ all: true });
    addEntry = null;
    const after = M.remainingAt(st().consumptions, now());
    if (after - before >= 0.5 && ui.route === 'home') ui.fillFrom = before;
    render();
    const dayTxt = k === todayKey() ? '' : ` for ${M.fmtDay(k)}`;
    toast(`Logged${dayTxt}: ${rec.name}, ${M.fmtNum(rec.totalMg)} mg.${wasFree ? ' Caffeine-free mark removed.' : ''}`, {
      undo: () => {
        if (save(d => { d.consumptions = d.consumptions.filter(c => c.id !== id); if (wasFree && !d.caffeineFreeDays.includes(k)) d.caffeineFreeDays.push(k); })) {
          render();
          toast('Removed. Nothing logged.');
        }
      }
    });
    return true;
  } finally {
    setTimeout(() => { ui.saving = false; }, 400);
  }
}

async function deleteConsumption(id) {
  const c = st().consumptions.find(x => x.id === id);
  if (!c) return;
  if (!save(d => { d.consumptions = d.consumptions.filter(x => x.id !== id); })) return;
  closeSheet({ all: true });
  addEntry = null;
  render();
  toast(`Deleted ${c.name}.`, { undo: () => { if (save(d => { d.consumptions.push(c); d.caffeineFreeDays = d.caffeineFreeDays.filter(k => k !== M.dayKey(c.at)); })) { render(); toast('Restored.'); } } });
}

/* =========================================================
   Favourites
   ========================================================= */

let favEntry = null;
let favForm = null; // {id|null, name, category, portion, mg, source, errors}

function openFavs() {
  favForm = null;
  favEntry = openSheet({ title: 'Favourites', body: renderFavs() });
}

function renderFavs() {
  if (favForm) return renderFavForm();
  const favs = st().favorites;
  return `
    <p class="small">Changes here never touch drinks you already logged. Each logged drink keeps its own values.</p>
    <div class="list" style="margin-top:12px">
      ${favs.length ? favs.map((f, i) => `<div class="item">
        <span class="grow"><span class="name">${esc(f.name)}</span><br><span class="sub">${M.fmtNum(f.mgPerServing)} mg, ${esc(f.portion || catLabel(f.category))}, ${f.source === 'label' ? 'label' : 'estimate'}</span></span>
        <button type="button" class="icon-btn" data-action="fav-move" data-id="${f.id}" data-dir="-1" aria-label="Move ${esc(f.name)} up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
        <button type="button" class="icon-btn" data-action="fav-move" data-id="${f.id}" data-dir="1" aria-label="Move ${esc(f.name)} down" ${i === favs.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
        <button type="button" class="icon-btn" data-action="fav-edit" data-id="${f.id}" aria-label="Edit ${esc(f.name)}">${icon('edit')}</button>
      </div>`).join('') : '<p class="small">No favourites yet.</p>'}
    </div>
    <button type="button" class="btn" style="margin-top:14px" data-action="fav-new">${icon('plus')}New favourite</button>`;
}

function renderFavForm() {
  const f = favForm;
  const e = f.errors || {};
  return `
    <button type="button" class="link-btn" data-action="fav-back">Back to favourites</button>
    <form id="fav-form" class="stack-l" novalidate>
      <label class="field"><span>Name</span><input type="text" name="name" value="${esc(f.name)}" maxlength="80" ${e.name ? 'aria-invalid="true" aria-describedby="ferr-name"' : ''}>${e.name ? `<p class="field-error" id="ferr-name">${esc(e.name)}</p>` : ''}</label>
      <div class="field"><span class="field-label" id="fcat-l">Category</span>
        <div class="seg wrap" role="group" aria-labelledby="fcat-l">
          ${CATS.map(c => `<button type="button" data-action="favform-cat" data-cat="${c.id}" aria-pressed="${f.category === c.id}">${esc(c.short)}</button>`).join('')}
        </div></div>
      <label class="field"><span>Portion</span><input type="text" name="portion" value="${esc(f.portion)}" maxlength="60" placeholder="e.g. 240 ml mug"></label>
      <label class="field"><span>Caffeine per serving (mg)</span><input type="text" inputmode="decimal" name="mg" value="${esc(f.mg)}" ${e.mg ? 'aria-invalid="true" aria-describedby="ferr-mg"' : ''}>${e.mg ? `<p class="field-error" id="ferr-mg">${esc(e.mg)}</p>` : ''}</label>
      <div class="field"><span class="field-label" id="fsrc-l">Amount comes from</span>
        <div class="seg" role="group" aria-labelledby="fsrc-l">
          <button type="button" data-action="favform-src" data-src="estimate" aria-pressed="${f.source === 'estimate'}">Estimate</button>
          <button type="button" data-action="favform-src" data-src="label" aria-pressed="${f.source === 'label'}">Product label</button>
        </div></div>
      <button type="submit" class="btn">${f.id ? 'Save favourite' : 'Add favourite'}</button>
      ${f.id ? `<button type="button" class="btn red" data-action="fav-delete" data-id="${f.id}">${icon('trash')}Delete favourite</button>` : ''}
    </form>`;
}

function readFavForm() {
  const form = $('#fav-form');
  if (!form) return;
  favForm.name = form.elements.name.value;
  favForm.portion = form.elements.portion.value;
  favForm.mg = form.elements.mg.value;
}

function rerenderFavs() { if (favEntry) setSheetBody(favEntry, renderFavs()); }

function submitFavForm() {
  readFavForm();
  const errors = {};
  if (!favForm.name.trim()) errors.name = 'Give it a name.';
  const mg = parseNum(favForm.mg);
  if (mg == null || mg < 0 || mg > 2000) errors.mg = 'Enter a number from 0 to 2000.';
  favForm.errors = errors;
  if (Object.keys(errors).length) { rerenderFavs(); return; }
  const rec = { name: favForm.name.trim(), category: favForm.category, portion: favForm.portion.trim(), mgPerServing: mg, source: favForm.source };
  const id = favForm.id;
  const ok = save(d => {
    if (id) Object.assign(d.favorites.find(f => f.id === id), rec);
    else d.favorites.push({ id: S.uid(), ...rec });
  });
  if (!ok) return;
  favForm = null;
  rerenderFavs();
  toast(id ? 'Favourite updated. Logged drinks stay as they were.' : 'Favourite added.');
  refreshUnderSheets();
}

function refreshUnderSheets() {
  // re-render the add sheet's pick list or the screen behind when favourites change
  if (addEntry && add.step === 'pick') rerenderAdd();
  if (ui.route === 'sleep') { ui.whatif = null; }
  render();
}

/* =========================================================
   Settings
   ========================================================= */

let settingsEntry = null;

function updateSettings(patch) {
  const k = todayKey();
  return save(d => {
    const cur = M.settingsFor(d.settingsHistory, k);
    const next = { bedtime: cur.bedtime, dailyLimit: cur.dailyLimit, cutoff: cur.cutoff, ...patch, from: k };
    const i = d.settingsHistory.findIndex(h => h.from === k);
    if (i >= 0) d.settingsHistory[i] = next; else d.settingsHistory.push(next);
  });
}

function openSettings() {
  settingsEntry = openSheet({ title: 'Settings', body: renderSettings() });
}

function reminderSupport() {
  return {
    notify: 'Notification' in window && 'serviceWorker' in navigator,
    perm: 'Notification' in window ? Notification.permission : 'unsupported'
  };
}

function renderSettings() {
  const s = st();
  const k = todayKey();
  const set = settingsFor(k);
  const rs = reminderSupport();
  const rem = s.prefs.reminder;
  return `
    <div class="section-title" style="margin-top:4px">Your numbers</div>
    <div class="panel">
      <label class="field"><span>Usual bedtime</span><input type="time" value="${esc(set.bedtime)}" data-setting="bedtime"></label>
      <p class="field-hint">00:00 to 11:59 counts as after midnight. Changes apply from today on, so past recaps keep their old bedtime.</p>
      <label class="field"><span>Daily limit (mg), optional</span><input type="text" inputmode="decimal" value="${set.dailyLimit == null ? '' : esc(M.fmtNum(set.dailyLimit))}" data-setting="dailyLimit" placeholder="No limit"></label>
      <p class="field-hint">Your own number for "consumed today". Not a medical target, and not related to the tank. Leave empty for no limit.</p>
      <label class="field"><span>Last-caffeine time, optional</span><input type="time" value="${esc(set.cutoff || '')}" data-setting="cutoff"></label>
      ${set.cutoff ? `<button type="button" class="btn small quiet" data-action="clear-cutoff">Clear last-caffeine time</button>` : ''}
    </div>

    <div class="section-title">Reminders</div>
    <div class="panel">
      <div class="seg wrap" role="group" aria-label="Reminder">
        <button type="button" data-action="reminder" data-v="off" aria-pressed="${rem === 'off'}">Off</button>
        <button type="button" data-action="reminder" data-v="inapp" aria-pressed="${rem === 'inapp'}">In the app</button>
        ${rs.notify ? `<button type="button" data-action="reminder" data-v="notify" aria-pressed="${rem === 'notify'}">Plus notification</button>` : ''}
      </div>
      <p class="small">A heads-up 30 minutes before your last-caffeine time${set.cutoff ? ` (${esc(set.cutoff)})` : ', once you set one'}.</p>
      <p class="small"><strong>What works here:</strong> the in-app reminder shows on Home when you open the app in that window. ${rs.notify ? 'A notification can only appear while the app is open or still running in the background. If the app is closed, no notification arrives. That is a limitation of web apps, so do not rely on it.' : 'System notifications are not supported in this browser, so reminders stay inside the app.'}${rem === 'notify' && rs.perm === 'denied' ? ' Notifications are blocked for this site in your browser settings.' : ''}</p>
    </div>

    <div class="section-title">Morning</div>
    <div class="panel">
      <div class="toggle"><span class="lede" id="sc-l">Ask "How did you sleep?"</span><button type="button" class="switch" role="switch" aria-checked="${s.prefs.sleepCheck}" aria-labelledby="sc-l" data-action="toggle-sleepcheck"></button></div>
      <p class="small">Optional and skippable. Answers sit next to your caffeine estimates in History.</p>
    </div>

    <div class="section-title">Drinks</div>
    <button type="button" class="menu-item" data-action="manage-favs"><span class="ico yellow">${icon('star')}</span><span class="grow"><span class="t">Favourites</span><span class="d">${s.favorites.length} saved. Add, edit, reorder, delete.</span></span></button>

    <div class="section-title">How it works</div>
    <details class="panel more"><summary>How the estimate works</summary>
      <div class="explain-text">
        <p>Each drink is calculated separately and the results are added up: remaining = dose × 0.5 ^ (hours since drinking ÷ 5).</p>
        <p>The 5-hour half-life is a general model assumption. Real clearance varies a lot between people. Genes, age, pregnancy, smoking, medication and liver health all change it. This is not a measurement and not calibrated to you.</p>
        <p>Absorption is simplified: the model starts the decline at the logged time. In reality caffeine takes a while to be absorbed.</p>
        <p>Numbers are rounded to whole milligrams. Below 1 mg, the app says "Less than 1 mg" instead of claiming zero.</p>
        <p>The tank shows 0 to ${M.TANK_SCALE_MG} mg. That range is only for display. A full tank isn't automatically unsafe, an empty one doesn't guarantee sleep.</p>
        <p>The app can't tell you when it's safe to have more caffeine or when you'll fall asleep.</p>
      </div>
    </details>
    <details class="panel more" style="margin-top:10px"><summary>Where your data lives</summary>
      <div class="explain-text">
        <p>Everything is stored only in this browser on this device. No account, no server, no sync between devices.</p>
        <p>Clearing your browser's site data, or removing the app, can delete it. Export a copy now and then if you want to keep it.</p>
      </div>
    </details>

    <div class="section-title">Your data</div>
    <div class="stack">
      <button type="button" class="menu-item" data-action="export-json"><span class="ico mint">${icon('download')}</span><span class="grow"><span class="t">Export everything (JSON)</span><span class="d">All drinks, favourites, settings history, sleep checks and saved cards.</span></span></button>
      <button type="button" class="menu-item" data-action="export-csv"><span class="ico sky">${icon('download')}</span><span class="grow"><span class="t">Export drinks (CSV)</span><span class="d">For a spreadsheet. Local date and time plus UTC.</span></span></button>
      <label class="menu-item" style="cursor:pointer"><span class="ico lila">${icon('upload')}</span><span class="grow"><span class="t">Restore from JSON export</span><span class="d">Replaces everything on this device.</span></span><input type="file" accept="application/json,.json" data-import class="sr-only"></label>
      <button type="button" class="menu-item" data-action="wipe"><span class="ico red">${icon('trash')}</span><span class="grow"><span class="t">Delete all my data</span><span class="d">Drinks, favourites, sleep checks, settings, card history and saved cards.</span></span></button>
    </div>

    <div class="section-title">Card sources</div>
    <details class="panel more"><summary>All ${Object.keys(SOURCES).length} sources behind the cards</summary>
      <div class="sources">${Object.values(SOURCES).map(src => `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.label)}</a>`).join('')}</div>
    </details>
    <p class="small muted" style="margin-top:18px">CAFFEINE ${APP_VERSION}. An awareness tool, not medical advice.</p>`;
}

function rerenderSettings() {
  if (!settingsEntry || !settingsEntry.sheet.isConnected) return;
  const body = settingsEntry.sheet.querySelector('.sheet-body');
  const y = body.scrollTop;
  setSheetBody(settingsEntry, renderSettings());
  body.scrollTop = y;
}

function applySetting(name, value, el) {
  if (name === 'bedtime') {
    if (!M.parseHM(value)) return;
    if (updateSettings({ bedtime: value })) toast(`Bedtime set to ${value}, from today.`);
  } else if (name === 'cutoff') {
    if (value && !M.parseHM(value)) return;
    if (updateSettings({ cutoff: value || null })) toast(value ? `Last-caffeine time set to ${value}.` : 'Last-caffeine time cleared.');
  } else if (name === 'dailyLimit') {
    const v = value.trim() === '' ? null : parseNum(value);
    if (v != null && (v <= 0 || v > 5000)) { toast('Enter a limit between 1 and 5000 mg, or leave it empty.'); return; }
    if (updateSettings({ dailyLimit: v })) toast(v == null ? 'No daily limit.' : `Daily limit set to ${M.fmtNum(v)} mg, from today.`);
  }
  ui.whatif && (ui.whatif = { ...ui.whatif });
  if (sheetStack.length) rerenderSettings();
  render();
}

/* ---------- export / import / wipe ---------- */

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportJSON() {
  const s = st();
  const out = {
    app: 'CAFFEINE', appVersion: APP_VERSION, exportedAt: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    notes: 'Times "at", "createdAt", "updatedAt" are milliseconds since 1970-01-01 UTC. Day keys are local calendar dates. settingsHistory entries apply from their "from" date on.',
    savedCards: s.discover.saved.map(x => ({ ...x, title: ITEM[x.id] ? ITEM[x.id].title : null })),
    data: s
  };
  download(`caffeine-export-${todayKey()}.json`, JSON.stringify(out, null, 2), 'application/json');
  toast('JSON export ready.');
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCSV() {
  const rows = [['id', 'product', 'category', 'portion', 'caffeine_mg_per_serving', 'servings', 'total_caffeine_mg', 'amount_source', 'consumed_local_date', 'consumed_local_time', 'consumed_utc_iso', 'created_utc_iso', 'updated_utc_iso']];
  for (const c of [...st().consumptions].sort((a, b) => a.at - b.at)) {
    rows.push([c.id, c.name, c.category, c.portion, c.mgPerServing, c.servings, c.totalMg, c.source === 'label' ? 'product label' : 'estimate',
      M.dayKey(c.at), M.fmtTime(c.at), new Date(c.at).toISOString(), new Date(c.createdAt).toISOString(), new Date(c.updatedAt || c.createdAt).toISOString()]);
  }
  download(`caffeine-drinks-${todayKey()}.csv`, rows.map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv');
  toast(`CSV export ready, ${rows.length - 1} ${rows.length === 2 ? 'drink' : 'drinks'}.`);
}

async function importFile(file) {
  let obj;
  try { obj = JSON.parse(await file.text()); } catch (e) { toast('That file could not be read as JSON.'); return; }
  const err = S.validateImport(obj);
  if (err) { toast(err); return; }
  const data = obj.data || obj;
  const go = await confirmModal({ title: 'Replace everything?', text: `This replaces all data on this device with the file (${data.consumptions.length} drinks).`, ok: 'Replace', cancel: 'Cancel', danger: true, face: 'shock' });
  if (!go) return;
  const r = S.replaceAll({ ...data, onboarded: true });
  if (!r.ok) { toast('Couldn\'t save the restored data on this device.'); return; }
  closeSheet({ all: true });
  ui.whatif = null;
  render();
  toast('Restored from export.');
}

async function wipeAll() {
  const go = await confirmModal({ title: 'Delete everything?', text: 'All drinks, favourites, sleep checks, settings, card history and saved cards on this device will be deleted. This can\'t be undone. The built-in cards stay.', ok: 'Delete everything', cancel: 'Keep my data', danger: true, face: 'shock' });
  if (!go) return;
  const r = S.wipe();
  if (!r.ok) { toast('Couldn\'t delete the data. Try clearing site data in your browser.'); return; }
  closeSheet({ all: true });
  Object.assign(ui, { historyMode: 'day', historyKey: null, discoverView: 'today', archiveCat: 'all', archiveTopic: 'all', whatif: null, openArchive: null });
  location.hash = '#home';
  render();
  showOnboarding();
  toast('All personal data deleted.');
}

/* =========================================================
   Onboarding
   ========================================================= */

const ob = { step: 0, bedtime: '23:00', limit: '' };

function showOnboarding() {
  ob.step = 0;
  let el = $('#onboard');
  if (!el) { el = document.createElement('div'); el.id = 'onboard'; document.body.append(el); }
  setInert(true);
  renderOnboarding();
}

function renderOnboarding() {
  const el = $('#onboard');
  const dots = `<div class="dots" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i === ob.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const steps = [
    () => `<div class="onboard ob-yellow" role="dialog" aria-modal="true" aria-labelledby="ob-h"><div class="ob-in">
      ${dots}
      ${faceSVG('smirk', { size: 120, cls: 'pop' })}
      <h1 id="ob-h">The tank is a guess.</h1>
      <p class="lede">A well-informed one. You log what you drink, the app estimates how much caffeine is still in you. Same simple model for everyone, so your real body may differ.</p>
      <div class="spacer"></div>
      <button type="button" class="btn" data-ob="next">Got it</button>
    </div></div>`,
    () => `<div class="onboard ob-lila" role="dialog" aria-modal="true" aria-labelledby="ob-h"><div class="ob-in">
      ${dots}
      ${faceSVG('sleepy', { size: 120, cls: 'pop' })}
      <h1 id="ob-h">When's bed?</h1>
      <p class="lede">Used to estimate what's left at bedtime. After midnight is fine.</p>
      <label class="field"><span>Usual bedtime</span><input type="time" id="ob-bed" value="${esc(ob.bedtime)}"></label>
      <div class="spacer"></div>
      <button type="button" class="btn" data-ob="next">Next</button>
      <button type="button" class="btn quiet" data-ob="back">Back</button>
    </div></div>`,
    () => `<div class="onboard ob-mint" role="dialog" aria-modal="true" aria-labelledby="ob-h"><div class="ob-in">
      ${dots}
      ${faceSVG('relieved', { size: 120, cls: 'pop' })}
      <h1 id="ob-h">A daily limit?</h1>
      <p class="lede">Optional. Your own number for what you drink per day. Not a medical target. Skip it and the app just shows your total.</p>
      <label class="field"><span>Daily limit in mg</span><input type="text" inputmode="decimal" id="ob-limit" value="${esc(ob.limit)}" placeholder="e.g. 300"></label>
      <p class="field-error" id="ob-err" role="alert"></p>
      <div class="spacer"></div>
      <button type="button" class="btn" data-ob="next">Use this limit</button>
      <button type="button" class="btn quiet" data-ob="skip">Skip, no limit</button>
    </div></div>`,
    () => `<div class="onboard ob-cobalt" role="dialog" aria-modal="true" aria-labelledby="ob-h"><div class="ob-in">
      ${dots}
      ${faceSVG('happy', { size: 120, cls: 'pop' })}
      <h1 id="ob-h">Your data stays here.</h1>
      <ul class="bullets">
        <li>Stored only on this device, in this browser.</li>
        <li>No account. No automatic sync between devices.</li>
        <li>Clearing browser data can delete it.</li>
        <li>Export a copy any time in Settings.</li>
      </ul>
      <div class="spacer"></div>
      <button type="button" class="btn" data-ob="finish-add">Add your first caffeine</button>
      <button type="button" class="btn quiet" data-ob="finish">Not now</button>
    </div></div>`
  ];
  el.innerHTML = steps[ob.step]();
  bringToLife(el);
  setTimeout(() => { const h = $('#ob-h', el); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }, 50);
}

function onboardAction(a) {
  if (ob.step === 1) { const v = $('#ob-bed').value; if (M.parseHM(v)) ob.bedtime = v; }
  if (a === 'back') { ob.step = Math.max(0, ob.step - 1); renderOnboarding(); return; }
  if (a === 'next' && ob.step === 2) {
    const v = $('#ob-limit').value.trim();
    const n = parseNum(v);
    if (v === '' ) { $('#ob-err').textContent = 'Enter a number, or tap Skip.'; return; }
    if (n == null || n <= 0 || n > 5000) { $('#ob-err').textContent = 'Enter a number between 1 and 5000, or tap Skip.'; return; }
    ob.limit = String(n);
  }
  if (a === 'skip') ob.limit = '';
  if (a === 'next' || a === 'skip') { ob.step++; renderOnboarding(); return; }
  if (a === 'finish' || a === 'finish-add') {
    const k = todayKey();
    const ok = save(d => {
      d.onboarded = true;
      d.createdAt = d.createdAt || now();
      d.settingsHistory = [{ from: k, bedtime: ob.bedtime, dailyLimit: ob.limit ? parseNum(ob.limit) : null, cutoff: null }];
    });
    if (!ok) return;
    $('#onboard').remove();
    setInert(false);
    location.hash = '#home';
    ui.focusOnRender = false;
    render();
    if (a === 'finish-add') openAdd(); else $('#add-main') && $('#add-main').focus();
  }
}

/* =========================================================
   Events
   ========================================================= */

const actions = {
  route: el => { location.hash = '#' + el.dataset.route; },
  settings: () => openSettings(),
  add: () => openAdd(),
  'add-for-day': el => openAdd({ dayKey: el.dataset.day }),
  'go-history-today': () => { ui.historyMode = 'day'; ui.historyKey = todayKey(); location.hash = '#history'; if (ui.route === 'history') render(); },
  'add-cat': el => { add.cat = el.dataset.cat; rerenderAdd(); },
  preset: el => {
    const p = PRESETS[add.cat][+el.dataset.i];
    add.draft = newDraft({ name: p.name, category: add.cat, portion: p.portion, mg: p.mg, source: 'estimate', note: 'Estimate: ' + p.note }, add.defaultAt || now());
    add.step = 'form'; add.errors = {}; rerenderAdd();
    setTimeout(() => { const i = $('#add-form [name=mgPerServing]'); if (i) i.focus(); }, 30);
  },
  'custom-drink': () => {
    add.draft = newDraft({ category: add.cat, source: 'label' }, add.defaultAt || now());
    add.step = 'form'; add.errors = {}; rerenderAdd();
    setTimeout(() => { const i = $('#add-form [name=name]'); if (i) i.focus(); }, 30);
  },
  'fav-details': el => {
    const f = st().favorites.find(x => x.id === el.dataset.id);
    if (!f) return;
    add.draft = newDraft({ ...f, servings: 1 }, add.defaultAt || now());
    add.step = 'form'; add.errors = {}; rerenderAdd();
  },
  'fav-quick': el => {
    const f = st().favorites.find(x => x.id === el.dataset.id);
    if (!f) return;
    el.disabled = true;
    const at = add.defaultAt || now();
    logConsumption({ name: f.name, category: f.category, portion: f.portion, mgPerServing: f.mgPerServing, servings: 1, totalMg: M.roundMg(f.mgPerServing), at, source: f.source })
      .finally(() => { if (el.isConnected) el.disabled = false; });
  },
  'add-back': () => { add.step = 'pick'; rerenderAdd(); },
  'draft-cat': el => { readDraftFromForm(); add.draft.category = el.dataset.cat; rerenderAdd(); },
  'draft-src': el => { readDraftFromForm(); add.draft.source = el.dataset.src; rerenderAdd(); },
  'toggle-savefav': () => { readDraftFromForm(); add.draft.saveFav = !add.draft.saveFav; rerenderAdd(); },
  'time-shift': el => {
    readDraftFromForm();
    add.draft.at = M.toLocalInput(now() + (+el.dataset.min) * 60000);
    rerenderAdd();
  },
  'delete-consumption': () => deleteConsumption(add.editId),
  'fav-from-consumption': () => {
    readDraftFromForm();
    const dr = add.draft;
    const mg = parseNum(dr.mgPerServing);
    if (!dr.name.trim() || mg == null) { toast('Fill in a name and amount first.'); return; }
    if (save(d => d.favorites.push({ id: S.uid(), name: dr.name.trim(), category: dr.category, portion: dr.portion.trim(), mgPerServing: mg, source: dr.source }))) toast('Added to favourites.');
  },
  'edit-consumption': el => openEditConsumption(el.dataset.id),
  'manage-favs': () => openFavs(),
  'fav-new': () => { favForm = { id: null, name: '', category: 'coffee', portion: '', mg: '', source: 'estimate' }; rerenderFavs(); },
  'fav-edit': el => { const f = st().favorites.find(x => x.id === el.dataset.id); favForm = { id: f.id, name: f.name, category: f.category, portion: f.portion, mg: String(f.mgPerServing), source: f.source }; rerenderFavs(); },
  'fav-back': () => { favForm = null; rerenderFavs(); },
  'favform-cat': el => { readFavForm(); favForm.category = el.dataset.cat; rerenderFavs(); },
  'favform-src': el => { readFavForm(); favForm.source = el.dataset.src; rerenderFavs(); },
  'fav-move': el => {
    const id = el.dataset.id, dir = +el.dataset.dir;
    if (save(d => { const i = d.favorites.findIndex(f => f.id === id); const j = i + dir; if (j < 0 || j >= d.favorites.length) return; [d.favorites[i], d.favorites[j]] = [d.favorites[j], d.favorites[i]]; })) {
      rerenderFavs();
      const b = $(`[data-action="fav-move"][data-id="${id}"][data-dir="${dir}"]`);
      (b && !b.disabled ? b : $(`[data-action="fav-edit"][data-id="${id}"]`))?.focus();
      refreshUnderSheets();
    }
  },
  'fav-delete': el => {
    const id = el.dataset.id;
    const idx = st().favorites.findIndex(f => f.id === id);
    const f = st().favorites[idx];
    if (!save(d => { d.favorites = d.favorites.filter(x => x.id !== id); })) return;
    favForm = null; rerenderFavs(); refreshUnderSheets();
    toast(`Deleted favourite ${f.name}. Logged drinks are untouched.`, { undo: () => { if (save(d => d.favorites.splice(idx, 0, f))) { rerenderFavs(); refreshUnderSheets(); } } });
  },
  'mark-free': el => {
    const k = el.dataset.day;
    if (M.consumptionsOn(st().consumptions, k).length) return;
    if (save(d => { if (!d.caffeineFreeDays.includes(k)) d.caffeineFreeDays.push(k); })) {
      render();
      toast(`${M.fmtDay(k)} marked caffeine-free.`, { undo: () => { if (save(d => { d.caffeineFreeDays = d.caffeineFreeDays.filter(x => x !== k); })) render(); } });
    }
  },
  'unmark-free': el => { const k = el.dataset.day; if (save(d => { d.caffeineFreeDays = d.caffeineFreeDays.filter(x => x !== k); })) render(); },
  'recap-done': el => { const k = el.dataset.day; if (save(d => { if (!d.recapsSeen.includes(k)) d.recapsSeen.push(k); })) render(); },
  'sleep-answer': el => {
    const n = el.dataset.night, a = el.dataset.answer;
    if (save(d => { d.sleepChecks[n] = { answer: a, at: now() }; })) {
      render();
      toast(a === 'skipped' ? 'Skipped. You can still answer in History.' : `Saved for the ${M.nightLabel(n).toLowerCase()}.`);
    }
  },
  'reminder-dismiss': () => { const k = todayKey(); if (save(d => { d.reminderLog[k] = true; })) render(); },
  'clear-cutoff': () => applySetting('cutoff', ''),
  'toggle-sleepcheck': () => { if (save(d => { d.prefs.sleepCheck = !d.prefs.sleepCheck; })) { rerenderSettings(); render(); } },
  reminder: async el => {
    let v = el.dataset.v;
    if (v === 'notify') {
      const rs = reminderSupport();
      if (!rs.notify) { v = 'inapp'; toast('Notifications are not supported here. Using in-app reminders.'); }
      else {
        let p = Notification.permission;
        if (p === 'default') { try { p = await Notification.requestPermission(); } catch (e) { p = 'denied'; } }
        if (p !== 'granted') { v = 'inapp'; toast('No permission for notifications. Using in-app reminders.'); }
      }
    }
    if (save(d => { d.prefs.reminder = v; })) { rerenderSettings(); render(); if (v !== 'off' && !settingsFor(todayKey()).cutoff) toast('Set a last-caffeine time to get reminders.'); }
  },
  'export-json': () => exportJSON(),
  'export-csv': () => exportCSV(),
  wipe: () => wipeAll(),
  flip: el => flip(el.dataset.card),
  'save-card': el => {
    const id = el.dataset.card;
    const was = isSaved(id);
    if (save(d => { if (was) d.discover.saved = d.discover.saved.filter(x => x.id !== id); else d.discover.saved.push({ id, savedAt: now() }); })) {
      $$(`[data-action="save-card"][data-card="${id}"]`).forEach(b => {
        b.setAttribute('aria-pressed', String(!was));
        b.innerHTML = `${icon('bookmark')}${!was ? 'Saved' : 'Save'}`;
      });
      haptic();
      toast(was ? 'Removed from Saved.' : 'Saved. Find it under Saved.');
      if (ui.discoverView === 'saved') render();
    }
  },
  'discover-view': el => { ui.discoverView = el.dataset.view; ui.openArchive = null; ui.focusOnRender = true; render(); },
  'archive-cat': el => { ui.archiveCat = el.dataset.cat; render(); $(`[data-action="archive-cat"][data-cat="${ui.archiveCat}"]`)?.focus(); },
  'arch-toggle': el => { const k = el.dataset.key; ui.openArchive = ui.openArchive === k ? null : k; render(); $(`[data-action="arch-toggle"][data-key="${CSS.escape(k)}"]`)?.focus(); },
  'hist-mode': el => { ui.historyMode = el.dataset.mode; render(); $(`[data-action="hist-mode"][data-mode="${ui.historyMode}"]`)?.focus(); },
  'hist-nav': el => {
    const dir = +el.dataset.dir;
    const k = ui.historyKey || todayKey();
    if (ui.historyMode === 'day') ui.historyKey = M.addDays(k, dir);
    else if (ui.historyMode === 'week') ui.historyKey = M.addDays(k, dir * 7);
    else { const d = M.keyToDate(k); d.setDate(1); d.setMonth(d.getMonth() + dir); ui.historyKey = M.dayKey(d.getTime()); }
    if (ui.historyKey > todayKey()) ui.historyKey = todayKey();
    render();
    const b = $(`[data-action="hist-nav"][data-dir="${dir}"]`);
    (b && !b.disabled ? b : $(`[data-action="hist-nav"][data-dir="${-dir}"]`))?.focus();
  },
  'hist-open-day': el => { ui.historyMode = 'day'; ui.historyKey = el.dataset.day; ui.focusOnRender = true; render(); },
  'wi-pick': el => {
    const v = el.dataset.pick;
    if (v.startsWith('fav:')) { const f = st().favorites.find(x => x.id === v.slice(4)); if (f) ui.whatif = { ...ui.whatif, pick: v, name: f.name, mg: String(f.mgPerServing) }; }
    else ui.whatif = { ...ui.whatif, pick: 'custom', name: 'Custom drink' };
    render();
    $(`[data-action="wi-pick"][data-pick="${CSS.escape(v)}"]`)?.focus();
  },
  'wi-log': () => {
    const w = ui.whatif;
    const f = w.pick.startsWith('fav:') ? st().favorites.find(x => x.id === w.pick.slice(4)) : null;
    add.step = 'form'; add.editId = null; add.errors = {}; add.defaultAt = null;
    add.draft = newDraft(f ? { ...f, servings: 1 } : { name: '', mg: parseNum(w.mg), category: 'coffee', source: 'estimate' }, now());
    addEntry = openSheet({ title: 'Add caffeine', body: renderAddForm() });
  }
};

function flip(id) {
  const card = $(`.flip[data-card="${id}"]`);
  if (!card) return;
  const front = $('.front', card), back = $('.back', card);
  const toBack = back.getAttribute('aria-hidden') === 'true';
  const swap = () => {
    const show = toBack ? back : front, hide = toBack ? front : back;
    hide.setAttribute('aria-hidden', 'true'); hide.setAttribute('inert', '');
    show.removeAttribute('aria-hidden'); show.removeAttribute('inert');
    card.classList.toggle('wiggle', !toBack);
    card.classList.toggle('flipped', toBack);
  };
  const focusAfter = () => {
    if (toBack) { const h = $('.back-title', card); h && h.focus({ preventScroll: true }); }
    else $('.flip-btn', card).focus({ preventScroll: true });
  };
  haptic();
  if (reduceMotion() || !card.animate) { swap(); setTimeout(focusAfter, 60); return; }
  const a = card.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 160, easing: 'cubic-bezier(.4,0,1,1)' });
  a.onfinish = () => {
    swap();
    card.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    setTimeout(focusAfter, 60);
  };
}

document.addEventListener('click', e => {
  const ob = e.target.closest('[data-ob]');
  if (ob) { haptic(); onboardAction(ob.dataset.ob); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (!actions[a]) return;
  if (el.tagName === 'A') e.preventDefault();
  if (el.disabled) return;
  haptic();
  actions[a](el, e);
});

document.addEventListener('submit', e => {
  if (e.target.id === 'add-form') { e.preventDefault(); submitDraft(); }
  if (e.target.id === 'fav-form') { e.preventDefault(); submitFavForm(); }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.closest('#add-form')) {
    readDraftFromForm();
    const p = $('#add-preview');
    if (p) p.innerHTML = previewHTML();
  }
  if (t.dataset.wi) {
    ui.whatif[t.dataset.wi] = t.value;
    if (t.dataset.wi === 'mg') ui.whatif.pick = 'custom';
    const nb = M.nextBedtime(now(), settingsFor);
    const r = $('#wi-result');
    if (r) r.innerHTML = renderWhatIfResult(whatIfData(nb));
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting) applySetting(t.dataset.setting, t.value, t);
  if (t.matches('[data-archive-topic]')) { ui.archiveTopic = t.value; render(); $('[data-archive-topic]')?.focus(); }
  if (t.matches('[data-import]') && t.files && t.files[0]) importFile(t.files[0]);
  // defer so a click that caused this blur (e.g. on another button) still lands
  if (t.dataset.wi) setTimeout(() => { if (!sheetStack.length && ui.route === 'sleep' && document.activeElement !== t) render(); }, 250);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheetStack.length && !$('.modal-wrap')) { closeSheet(); }
});

$('#tabbar').addEventListener('click', e => {
  const b = e.target.closest('button[data-route]');
  if (!b) return;
  haptic();
  if (b.dataset.route === 'discover') ui.discoverView = 'today';
  if (b.dataset.route === 'history' && ui.route !== 'history') { ui.historyKey = todayKey(); }
  ui.focusOnRender = true;
  if (location.hash === '#' + b.dataset.route) render(); else location.hash = '#' + b.dataset.route;
});

window.addEventListener('hashchange', () => { ui.focusOnRender = true; render(); });

/* =========================================================
   Live updates (timestamps, not a running timer)
   ========================================================= */

function tick() {
  if (document.hidden) { checkSystemReminder(); return; }
  if (!st().onboarded) return;
  if (ui.lastToday !== todayKey()) { render(); return; }
  const idle = !sheetStack.length && (!document.activeElement || document.activeElement === document.body);
  if (ui.route === 'home') patchHome();
  else if (idle && (ui.route === 'sleep' || (ui.route === 'history' && ui.historyMode === 'day' && ui.historyKey === todayKey()))) render();
  // reminder banner appearing
  if (ui.route === 'home') {
    const w = reminderWindow();
    const t = now();
    const shouldShow = w && t >= w.start && t < w.at && !st().reminderLog[w.k];
    if (!!shouldShow !== !!$('[aria-label="Reminder"]')) render();
  }
  checkSystemReminder();
}

function checkSystemReminder() {
  const s = st();
  if (s.prefs.reminder !== 'notify' || !('Notification' in window) || Notification.permission !== 'granted') return;
  const w = reminderWindow();
  if (!w) return;
  const t = now();
  const key = w.k + ':n';
  if (t >= w.start && t < w.at && !s.reminderLog[key]) {
    if (!save(d => { d.reminderLog[key] = true; })) return;
    navigator.serviceWorker?.ready.then(reg => reg.showNotification('CAFFEINE', {
      body: `Heads-up: your chosen last-caffeine time is ${w.cutoff}.`, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'cutoff-' + w.k
    })).catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
window.addEventListener('focus', () => tick());
window.addEventListener('pageshow', () => tick());
setInterval(tick, 30000);

/* =========================================================
   Service worker
   ========================================================= */

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadControllerAtStart = !!navigator.serviceWorker.controller;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      const promptUpdate = w => {
        toast('A new version is ready.', { undo: () => { w.postMessage('skipWaiting'); }, undoLabel: 'Reload', ms: 15000 });
      };
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(w); });
      });
    }).catch(() => {});
    // only reload when an existing version is replaced, not on the very first install
    const hadController = hadControllerAtStart;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  });
}

/* =========================================================
   Start
   ========================================================= */

S.load();
if (S.getLoadError()) toast('Saved data on this device could not be read. Starting fresh; nothing was overwritten yet.', { ms: 9000 });
if (!location.hash) history.replaceState(null, '', '#home');
render();
if (!st().onboarded) showOnboarding();

// exposed for automated checks only
window.__caffeine = { M, S, ui, render };
