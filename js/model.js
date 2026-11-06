// Pure calculation and date helpers. No DOM, no storage.
// Everything works from timestamps (ms since epoch) and local calendar keys
// ("YYYY-MM-DD" in the device's current time zone).

export const HALF_LIFE_H = 5;          // explicit, general model assumption
export const TANK_SCALE_MG = 300;      // display range of the tank, not a limit
const HOUR = 3600000;

/* ---------- caffeine model ---------- */

// Remaining caffeine from one consumption at time t.
// Nothing is added before the logged moment.
export function remainingFrom(c, t) {
  if (!c || c.at > t) return 0;
  return c.totalMg * Math.pow(0.5, (t - c.at) / HOUR / HALF_LIFE_H);
}

// Sum of every consumption separately. `extra` lets previews add
// hypothetical drinks without touching the log.
export function remainingAt(consumptions, t, extra = []) {
  let sum = 0;
  for (const c of consumptions) sum += remainingFrom(c, t);
  for (const c of extra) sum += remainingFrom(c, t);
  return sum;
}

export function anyBefore(consumptions, t, extra = []) {
  return consumptions.some(c => c.at <= t && c.totalMg > 0) || extra.some(c => c.at <= t && c.totalMg > 0);
}

// Whole milligrams; never a fake zero once caffeine was logged.
export function formatMg(v, hasAny = true) {
  if (!hasAny || v <= 0) return { num: '0', unit: 'mg', text: '0 mg', tiny: false };
  if (v < 1) return { num: '<1', unit: 'mg', text: 'Less than 1 mg', tiny: true };
  const n = Math.round(v);
  return { num: String(n), unit: 'mg', text: `${n} mg`, tiny: false };
}

export function roundMg(v) {
  return Math.round(v * 10) / 10;
}

// Points for a curve chart, including vertical jumps at each intake.
export function curve(consumptions, from, to, stepMin = 10, extra = []) {
  const all = consumptions.concat(extra);
  const times = new Set();
  for (let t = from; t <= to; t += stepMin * 60000) times.add(t);
  times.add(to);
  for (const c of all) {
    if (c.at > from && c.at <= to) { times.add(c.at - 1); times.add(c.at); }
  }
  return [...times].sort((a, b) => a - b).map(t => ({ t, v: remainingAt(consumptions, t, extra) }));
}

/* ---------- local calendar helpers ---------- */

const pad = n => String(n).padStart(2, '0');

export function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function keyToDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function dayStart(k) { return keyToDate(k).getTime(); }

export function addDays(k, n) {
  const d = keyToDate(k);
  d.setDate(d.getDate() + n);
  return dayKey(d.getTime());
}

export function dayEnd(k) { return dayStart(addDays(k, 1)); }

export function parseHM(hm) {
  const [h, m] = String(hm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return { h, m };
}

// Bedtimes from 00:00 to 11:59 belong to the night that started the
// evening before ("after midnight"); 12:00 and later are the same evening.
export function isAfterMidnight(hm) {
  const p = parseHM(hm);
  return !!p && p.h < 12;
}

// Bedtime timestamp for the night that starts on calendar day k.
export function bedtimeFor(k, hm) {
  const p = parseHM(hm) || { h: 23, m: 0 };
  const base = p.h < 12 ? addDays(k, 1) : k;
  const d = keyToDate(base);
  d.setHours(p.h, p.m, 0, 0);
  return d.getTime();
}

// The upcoming intended bedtime and which night it belongs to.
export function nextBedtime(now, settingsForKey) {
  const today = dayKey(now);
  for (const k of [addDays(today, -1), today, addDays(today, 1)]) {
    const at = bedtimeFor(k, settingsForKey(k).bedtime);
    if (at > now) return { nightKey: k, at };
  }
  const k = addDays(today, 1);
  return { nightKey: k, at: bedtimeFor(k, settingsForKey(k).bedtime) };
}

/* ---------- settings history ---------- */

// history: [{ from: 'YYYY-MM-DD', bedtime, dailyLimit, cutoff }], applies from that day on.
export function settingsFor(history, k) {
  if (!history || !history.length) return { from: k, bedtime: '23:00', dailyLimit: null, cutoff: null };
  const sorted = [...history].sort((a, b) => a.from.localeCompare(b.from));
  let found = sorted[0];
  for (const h of sorted) if (h.from <= k) found = h;
  return found;
}

/* ---------- per-day summaries ---------- */

export function consumptionsOn(consumptions, k) {
  const a = dayStart(k), b = dayEnd(k);
  return consumptions.filter(c => c.at >= a && c.at < b).sort((x, y) => x.at - y.at);
}

export function consumedOn(consumptions, k) {
  return consumptionsOn(consumptions, k).reduce((s, c) => s + c.totalMg, 0);
}

export function dayStatus(state, k) {
  if (consumptionsOn(state.consumptions, k).length) return 'logged';
  if (state.caffeineFreeDays.includes(k)) return 'free';
  return 'none';
}

export function daySummary(state, k) {
  const list = consumptionsOn(state.consumptions, k);
  const s = settingsFor(state.settingsHistory, k);
  const total = list.reduce((a, c) => a + c.totalMg, 0);
  const bedAt = bedtimeFor(k, s.bedtime);
  const status = dayStatus(state, k);
  return {
    key: k,
    status,
    count: list.length,
    total,
    last: list.length ? list[list.length - 1] : null,
    limit: s.dailyLimit,
    over: s.dailyLimit != null && total > s.dailyLimit,
    bedtime: s.bedtime,
    bedAt,
    atBedtime: remainingAt(state.consumptions, bedAt),
    atBedtimeAny: anyBefore(state.consumptions, bedAt),
    sleep: state.sleepChecks[k] || null
  };
}

// Averages only use days with a record (logged or confirmed caffeine-free).
export function rangeSummary(state, keys) {
  const days = keys.map(k => daySummary(state, k));
  const recorded = days.filter(d => d.status !== 'none');
  const sum = recorded.reduce((a, d) => a + d.total, 0);
  return {
    days,
    recordedCount: recorded.length,
    noneCount: days.length - recorded.length,
    loggedCount: days.filter(d => d.status === 'logged').length,
    freeCount: days.filter(d => d.status === 'free').length,
    average: recorded.length ? sum / recorded.length : null,
    overCount: days.filter(d => d.over).length,
    limitDays: days.filter(d => d.limit != null && d.status !== 'none').length
  };
}

export function weekKeys(k) {
  // Monday-based week containing k
  const d = keyToDate(k);
  const dow = (d.getDay() + 6) % 7;
  const start = addDays(k, -dow);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthKeys(k) {
  const d = keyToDate(k);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const keys = [];
  for (let x = new Date(first); x.getMonth() === first.getMonth(); x.setDate(x.getDate() + 1)) keys.push(dayKey(x.getTime()));
  return keys;
}

/* ---------- discover selection ---------- */

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Picks one id per category for a day, avoiding repeats until the collection
// is exhausted, then restarting while skipping the most recent picks.
export function pickDaily(itemsByCat, discover, k) {
  if (discover.daily[k]) return discover.daily[k];
  const earlier = Object.keys(discover.daily).filter(d => d < k).sort();
  const pick = cat => {
    const all = itemsByCat[cat];
    const valid = new Set(all);
    const history = earlier.map(d => discover.daily[d][cat]).filter(id => valid.has(id));
    // Walk the history in cycles: a cycle ends once every item has been shown.
    let seen = new Set();
    for (const id of history) {
      seen.add(id);
      if (seen.size >= all.length) seen = new Set();
    }
    let pool = all.filter(id => !seen.has(id));
    if (seen.size === 0 && history.length) {
      // fresh cycle: keep the most recent picks out for a while
      const recent = new Set(history.slice(-Math.min(7, Math.floor(all.length / 2))));
      const filtered = pool.filter(id => !recent.has(id));
      if (filtered.length) pool = filtered;
    }
    return pool[hashStr(k + cat) % pool.length];
  };
  return { fact: pick('fact'), myth: pick('myth') };
}

/* ---------- formatting ---------- */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtTime(t) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtDay(k, withYear = false) {
  const d = keyToDate(k);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}
export function fmtDayShort(k) {
  const d = keyToDate(k);
  return `${DAYS[d.getDay()]} ${d.getDate()}`;
}
export function fmtMonth(k) {
  const d = keyToDate(k);
  return `${['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]} ${d.getFullYear()}`;
}
export function nightLabel(k) {
  const n = addDays(k, 1);
  const a = keyToDate(k), b = keyToDate(n);
  return `Night of ${DAYS[a.getDay()]} ${a.getDate()} ${MONTHS[a.getMonth()]} to ${DAYS[b.getDay()]} ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}
export function toLocalInput(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromLocalInput(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0).getTime();
}
export function fmtNum(v) {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
