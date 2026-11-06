// Lafbekken faces: eyes + mouth only, one colour (currentColor).
// viewBox "8 10 84 84". Eyes live in .eyes > .blink, mouth in .mouth.

const LINE = 'fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"';
const FILL = 'fill="currentColor" stroke="currentColor" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"';

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" ${FILL}/>`;
}

const dotEyes = r => `<circle cx="34" cy="38" r="${r}" ${FILL}/><circle cx="66" cy="38" r="${r}" ${FILL}/>`;

export const FACES = {
  relieved: { eyes: `<path d="M26 40 q8 -8 16 0 M58 40 q8 -8 16 0" ${LINE}/>`, mouth: `<path d="M30 62 q20 16 40 0" ${LINE}/>` },
  sleepy: { eyes: `<path d="M27 40 q7 6 14 0 M59 40 q7 6 14 0" ${LINE}/>`, mouth: `<path d="M44 66 q6 4 12 0" ${LINE}/>` },
  meh: { eyes: `<path d="M29 37.5 h10" ${LINE}/><circle cx="66" cy="38" r="5" ${FILL}/>`, mouth: `<path d="M34 66 h32" ${LINE}/>` },
  happy: { eyes: dotEyes(4), mouth: `<path d="M24 54 q26 36 52 0 z" ${FILL}/>` },
  smirk: { eyes: dotEyes(4), mouth: `<path d="M32 62 q18 12 38 -6" ${LINE}/>` },
  stars: { eyes: star(34, 38, 9) + star(66, 38, 9), mouth: `<path d="M26 62 q24 32 48 0 z" ${FILL}/>` },
  shock: { eyes: dotEyes(6), mouth: `<ellipse cx="50" cy="70" rx="7" ry="10" ${FILL}/>` },
  panic: { eyes: `<path d="M25 31 q15 7 15 9 q0 2 -15 9 M75 31 q-15 7 -15 9 q0 2 15 9" ${LINE}/>`, mouth: `<path d="M26 76 q6 -12 12 0 q6 12 12 0 q6 -12 12 0 q6 12 12 0" ${LINE}/>` }
};

// Inner markup (groups) for embedding inside another SVG.
export function faceGroups(expr) {
  const f = FACES[expr] || FACES.meh;
  return `<g class="eyes"><g class="blink">${f.eyes}</g></g><g class="mouth">${f.mouth}</g>`;
}

// Standalone face SVG. Decorative by default.
export function faceSVG(expr, { size = 64, cls = '', label = '' } = {}) {
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="face ${cls}" data-face="${expr}" viewBox="8 10 84 84" width="${size}" height="${size}" ${aria}>${faceGroups(expr)}</svg>`;
}

/* ---------- life: blinking and looking around ---------- */

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const rigs = new Map(); // key: root element -> state

// A rig groups one or more face copies that move together
// (the tank draws the same face twice, clipped to two colours).
function partsOf(root) {
  return {
    eyes: [...root.querySelectorAll('.eyes')],
    blinks: [...root.querySelectorAll('.blink')],
    mouths: [...root.querySelectorAll('.mouth')]
  };
}

function blink(rig, twice = false) {
  const dur = rand(170, 230);
  for (const b of rig.parts.blinks) {
    b.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }],
      { duration: dur, easing: 'cubic-bezier(.4,0,.2,1)' });
  }
  if (twice) setTimeout(() => rig.alive && blink(rig), 280);
}

const SPOTS = [[0, 0], [-7, 0], [6, 0], [-4, -4], [5, -3], [0, -4], [0, 0]];

function look(rig) {
  const [x, y] = SPOTS[Math.floor(Math.random() * SPOTS.length)];
  const dist = Math.hypot(x - rig.gaze[0], y - rig.gaze[1]);
  const dur = 380 + dist * 18;
  const from = `translate(${rig.gaze[0]}px, ${rig.gaze[1]}px)`;
  const to = `translate(${x}px, ${y}px)`;
  const mf = `translate(${rig.gaze[0] * 0.3}px, ${rig.gaze[1] * 0.3}px)`;
  const mt = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  for (const e of rig.parts.eyes) e.animate([{ transform: from }, { transform: to }], { duration: dur, easing: 'cubic-bezier(.33,0,.15,1)', fill: 'forwards' });
  for (const m of rig.parts.mouths) m.animate([{ transform: mf }, { transform: mt }], { duration: dur, delay: 60, easing: 'cubic-bezier(.33,0,.15,1)', fill: 'forwards' });
  if (dist > 8 && Math.random() < 0.4) setTimeout(() => rig.alive && blink(rig), dur * 0.4);
  rig.gaze = [x, y];
}

function schedule(rig) {
  const loopBlink = () => {
    rig.tb = setTimeout(() => {
      if (!rig.alive) return;
      if (!document.hidden) blink(rig, Math.random() < 0.18);
      loopBlink();
    }, rand(2400, 6500));
  };
  const loopLook = () => {
    rig.tl = setTimeout(() => {
      if (!rig.alive) return;
      if (!document.hidden) look(rig);
      loopLook();
    }, rand(1300, 3800));
  };
  loopBlink();
  loopLook();
}

export function bringToLife(container = document) {
  // drop rigs whose elements left the DOM
  for (const [el, rig] of rigs) {
    if (!el.isConnected) { rig.alive = false; clearTimeout(rig.tb); clearTimeout(rig.tl); rigs.delete(el); }
  }
  if (reduce()) return;
  const roots = [...container.querySelectorAll('svg.face:not(.still), svg.tank-svg')]
    .filter(el => !el.closest('svg.tank-svg') || el.matches('svg.tank-svg'));
  for (const el of roots) {
    if (rigs.has(el)) continue;
    const rig = { alive: true, gaze: [0, 0], parts: partsOf(el) };
    if (!rig.parts.eyes.length) continue;
    rigs.set(el, rig);
    schedule(rig);
  }
}
