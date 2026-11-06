// Local, versioned storage. One JSON document in localStorage.
// Every change goes through commit(): it saves first and only then
// replaces the in-memory state, so the UI never claims a save that failed.

const KEY = 'caffeine.data';
export const SCHEMA_VERSION = 1;

export function emptyState() {
  return {
    schema: SCHEMA_VERSION,
    createdAt: Date.now(),
    onboarded: false,
    consumptions: [],      // {id,name,category,portion,mgPerServing,servings,totalMg,at,source,createdAt,updatedAt}
    favorites: [],         // {id,name,category,portion,mgPerServing,source}
    settingsHistory: [],   // {from:'YYYY-MM-DD', bedtime:'HH:MM', dailyLimit:number|null, cutoff:'HH:MM'|null}
    prefs: { reminder: 'off', sleepCheck: true },
    caffeineFreeDays: [],  // ['YYYY-MM-DD']
    sleepChecks: {},       // nightKey -> {answer, at}
    recapsSeen: [],        // ['YYYY-MM-DD'] days whose recap was shown
    reminderLog: {},       // dayKey -> true
    discover: { daily: {}, saved: [] } // daily: dayKey -> {fact,myth}; saved: [{id,savedAt}]
  };
}

function migrate(s) {
  const base = emptyState();
  if (!s || typeof s !== 'object') return base;
  // v1 is the first version; fill any missing keys defensively.
  const out = { ...base, ...s };
  out.prefs = { ...base.prefs, ...(s.prefs || {}) };
  out.discover = { ...base.discover, ...(s.discover || {}) };
  for (const k of ['consumptions', 'favorites', 'settingsHistory', 'caffeineFreeDays', 'recapsSeen']) {
    if (!Array.isArray(out[k])) out[k] = [];
  }
  for (const k of ['sleepChecks', 'reminderLog']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
  if (!Array.isArray(out.discover.saved)) out.discover.saved = [];
  if (!out.discover.daily || typeof out.discover.daily !== 'object') out.discover.daily = {};
  out.schema = SCHEMA_VERSION;
  return out;
}

let state = emptyState();
let loadError = null;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : emptyState();
  } catch (e) {
    loadError = e;
    // keep the unreadable original so it is not silently lost
    try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem('caffeine-unreadable-backup', raw); } catch (e2) { /* ignore */ }
    state = emptyState();
  }
  return state;
}

export function getLoadError() { return loadError; }
export function get() { return state; }

// mutator receives a deep copy and edits it in place.
export function commit(mutator) {
  const draft = structuredClone(state);
  mutator(draft);
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch (e) {
    return { ok: false, error: e };
  }
  state = draft;
  return { ok: true };
}

export function replaceAll(next) {
  const s = migrate(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    return { ok: false, error: e };
  }
  state = s;
  return { ok: true };
}

export function wipe() {
  try {
    localStorage.removeItem(KEY);
    // remove any other keys this app may have used
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('caffeine')) localStorage.removeItem(k);
    }
  } catch (e) {
    return { ok: false, error: e };
  }
  state = emptyState();
  return { ok: true };
}

export function validateImport(obj) {
  if (!obj || typeof obj !== 'object') return 'This file is not a CAFFEINE export.';
  const data = obj.data || obj;
  if (!Array.isArray(data.consumptions) || !Array.isArray(data.settingsHistory)) return 'This file is not a CAFFEINE export.';
  if (data.schema && data.schema > SCHEMA_VERSION) return 'This export comes from a newer version of the app.';
  for (const c of data.consumptions) {
    if (typeof c.at !== 'number' || typeof c.totalMg !== 'number' || !c.id) return 'Some drinks in this file are incomplete.';
  }
  return null;
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));
