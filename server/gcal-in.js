// Google Calendar → plataforma.
// El servidor lee la "dirección secreta en formato iCal" de un calendario de Google cada tantos minutos,
// expande los eventos repetidos y deja una lista simple de eventos en hora de Argentina.
// Es solo lectura: la plataforma nunca escribe en Google por acá.
'use strict';

const AR = 'America/Argentina/Buenos_Aires';

/* ---------- lectura del archivo .ics ---------- */
function unfold(text) { return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, ''); }
function unesc(v) { return String(v).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
function parseLine(line) {
  // NOMBRE;PARAM=X;PARAM2="a:b":valor  (los dos puntos dentro de comillas no cortan)
  let i = 0, q = false;
  for (; i < line.length; i++) { const c = line[i]; if (c === '"') q = !q; else if (c === ':' && !q) break; }
  const head = line.slice(0, i), value = line.slice(i + 1);
  const parts = head.split(';'), name = parts.shift().toUpperCase(), params = {};
  for (const p of parts) { const k = p.indexOf('='); if (k > 0) params[p.slice(0, k).toUpperCase()] = p.slice(k + 1).replace(/^"|"$/g, ''); }
  return { name, params, value };
}
function parseIcs(text) {
  const events = []; let cur = null, depth = 0;
  for (const line of unfold(text).split('\n')) {
    if (!line) continue;
    const { name, params, value } = parseLine(line);
    if (name === 'BEGIN') { if (value.toUpperCase() === 'VEVENT') { cur = { exdate: [] }; depth = 0; } else if (cur) depth++; continue; }
    if (name === 'END') { if (value.toUpperCase() === 'VEVENT' && cur) { events.push(cur); cur = null; } else if (cur) depth--; continue; }
    if (!cur || depth > 0) continue; // ignora VALARM y otros bloques internos
    if (name === 'UID') cur.uid = value;
    else if (name === 'SUMMARY') cur.summary = unesc(value);
    else if (name === 'LOCATION') cur.location = unesc(value);
    else if (name === 'STATUS') cur.status = value.toUpperCase();
    else if (name === 'DTSTART') cur.start = { value, params };
    else if (name === 'DTEND') cur.end = { value, params };
    else if (name === 'DURATION') cur.duration = value;
    else if (name === 'RRULE') cur.rrule = value;
    else if (name === 'RECURRENCE-ID') cur.recurrenceId = { value, params };
    else if (name === 'EXDATE') for (const v of value.split(',')) cur.exdate.push({ value: v, params });
  }
  return events;
}

/* ---------- fechas y husos horarios ---------- */
const fmtCache = new Map();
function tzOffset(ms, tz) { // minutos que el huso está adelantado respecto de UTC en ese instante
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); fmtCache.set(tz, f); }
  const p = {}; for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000) / 60000;
}
function validTz(tz) { try { tzOffset(0, tz); return true; } catch (e) { return false; } }
// hora de reloj en un huso → instante UTC (ms)
function wallToUtc(w, tz) {
  const guess = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s);
  let off = tzOffset(guess, tz), utc = guess - off * 60000;
  const off2 = tzOffset(utc, tz); if (off2 !== off) utc = guess - off2 * 60000;
  return utc;
}
// lee un DTSTART/DTEND/EXDATE: { allDay, wall:{y,m,d,h,mi,s}, tz }
function readTime(t, fallbackTz) {
  if (!t || !t.value) return null;
  const v = t.value.trim(), m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const wall = { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] || 0), mi: +(m[5] || 0), s: +(m[6] || 0) };
  if (!m[4] || (t.params && t.params.VALUE === 'DATE')) return { allDay: true, wall, tz: 'UTC' };
  let tz = m[7] ? 'UTC' : (t.params && t.params.TZID) || fallbackTz || AR;
  if (!validTz(tz)) tz = AR;
  return { allDay: false, wall, tz };
}
const toUtc = (t) => (t.allDay ? Date.UTC(t.wall.y, t.wall.m - 1, t.wall.d) : wallToUtc(t.wall, t.tz));
function durMs(s) { // PT1H30M, P1D, P1W
  const m = String(s || '').match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  return (((+m[2] || 0) * 7 + (+m[3] || 0)) * 86400 + (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)) * 1000;
}

/* ---------- eventos repetidos (RRULE) ---------- */
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function parseRule(s) { const r = {}; for (const p of String(s).split(';')) { const [k, v] = p.split('='); if (k && v) r[k.toUpperCase()] = v; } return r; }
const addDaysW = (w, n) => { const d = new Date(Date.UTC(w.y, w.m - 1, w.d + n)); return { ...w, y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
const dow = (w) => new Date(Date.UTC(w.y, w.m - 1, w.d)).getUTCDay();
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
// devuelve las horas de reloj de cada repetición, en orden, hasta `toMs` (máx. 2000)
function expand(ev, start, toMs) {
  const r = parseRule(ev.rrule), freq = r.FREQ, interval = Math.max(1, +r.INTERVAL || 1), count = r.COUNT ? +r.COUNT : Infinity;
  let until = Infinity;
  if (r.UNTIL) { const u = readTime({ value: r.UNTIL, params: {} }, start.tz); if (u) until = u.allDay ? Date.UTC(u.wall.y, u.wall.m - 1, u.wall.d, 23, 59, 59) : toUtc(u); }
  const byday = r.BYDAY ? r.BYDAY.split(',').map((x) => { const mm = x.match(/^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/); return mm && { n: mm[1] ? +mm[1] : 0, d: DAYS.indexOf(mm[2]) }; }).filter(Boolean) : null;
  const bymd = r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number) : null;
  const out = []; const w0 = start.wall; let n = 0;
  const push = (w) => {
    const ms = toUtc({ ...start, wall: w });
    if (ms < toUtc(start)) return true;
    if (ms > until || n >= count) return false;
    n++; if (ms > toMs) return false; out.push(w); return out.length < 2000;
  };
  if (freq === 'DAILY') {
    for (let i = 0; ; i += interval) { if (!push(addDaysW(w0, i))) break; }
  } else if (freq === 'WEEKLY') {
    const days = byday ? byday.map((b) => b.d).sort() : [dow(w0)];
    const wk = addDaysW(w0, -dow(w0)); // domingo de esa semana
    outer: for (let k = 0; ; k += interval) {
      for (const d of days) { const w = addDaysW(wk, k * 7 + d); if (!push(w)) break outer; }
      if (k > 5200) break;
    }
  } else if (freq === 'MONTHLY' || freq === 'YEARLY') {
    const step = freq === 'MONTHLY' ? interval : interval * 12;
    outer: for (let k = 0; k < 1200; k += step) {
      const mm = w0.m - 1 + k, y = w0.y + Math.floor(mm / 12), m = (mm % 12) + 1, dim = daysIn(y, m);
      let cands = [];
      if (freq === 'YEARLY' && !byday && !bymd) cands = [w0.d];
      else if (bymd) cands = bymd.map((d) => (d < 0 ? dim + d + 1 : d));
      else if (byday) {
        for (const b of byday) {
          const all = []; for (let d = 1; d <= dim; d++) if (dow({ y, m, d }) === b.d) all.push(d);
          if (!b.n) cands.push(...all); else { const x = b.n > 0 ? all[b.n - 1] : all[all.length + b.n]; if (x) cands.push(x); }
        }
      } else cands = [w0.d];
      if (r.BYSETPOS && cands.length) { const s = [...new Set(cands)].sort((a, b) => a - b), p = +r.BYSETPOS; cands = [p > 0 ? s[p - 1] : s[s.length + p]].filter(Boolean); }
      for (const d of [...new Set(cands)].filter((d) => d >= 1 && d <= dim).sort((a, b) => a - b)) {
        if (!push({ ...w0, y, m, d })) break outer;
      }
    }
  } else out.push(w0); // frecuencia no soportada: solo la primera vez
  return out;
}

/* ---------- de .ics a eventos de la agenda ---------- */
const pad = (n) => String(n).padStart(2, '0');
// instante UTC → fecha y minutos en hora de Argentina (UTC-3 todo el año)
function arLocal(ms) { const d = new Date(ms - 3 * 3600e3); return { fecha: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, min: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
const isoDay = (w) => `${w.y}-${pad(w.m)}-${pad(w.d)}`;

function eventsFromIcs(text, { fromMs, toMs, skipUid } = {}) {
  const evs = parseIcs(text).filter((e) => e.uid && e.start && !(skipUid && skipUid.test(e.uid)));
  const overrides = new Map(); // uid|inicio original → evento que lo reemplaza
  for (const e of evs) if (e.recurrenceId) { const t = readTime(e.recurrenceId); if (t) overrides.set(e.uid + '|' + toUtc(t), e); }
  const out = [];
  const add = (e, sMs, eMs, allDay, key) => {
    if (e.status === 'CANCELLED') return;
    if (eMs <= fromMs || sMs > toMs) return;
    const base = { titulo: (e.summary || '').trim() || '(Sin título)', lugar: (e.location || '').trim(), uid: e.uid, key };
    if (allDay) {
      for (let t = sMs; t < Math.max(eMs, sMs + 1); t += 864e5) {
        const d = new Date(t), fecha = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
        out.push({ ...base, fecha, hora: '', duracion: 0, allDay: true, seg: fecha });
        if (out.length > 5000) return;
      }
      return;
    }
    // un evento que pasa la medianoche se parte en un tramo por día
    let s = sMs;
    while (s < eMs) {
      const L = arLocal(s), endOfDay = s + (1440 - L.min) * 60000, e2 = Math.min(eMs, endOfDay);
      out.push({ ...base, fecha: L.fecha, hora: `${pad(Math.floor(L.min / 60))}:${pad(L.min % 60)}`, duracion: Math.max(5, Math.round((e2 - s) / 60000)), allDay: false, seg: L.fecha });
      s = e2; if (out.length > 5000) return;
    }
    if (eMs === sMs) { const L = arLocal(s); out.push({ ...base, fecha: L.fecha, hora: `${pad(Math.floor(L.min / 60))}:${pad(L.min % 60)}`, duracion: 15, allDay: false, seg: L.fecha }); }
  };
  for (const e of evs) {
    if (e.recurrenceId) continue;
    const st = readTime(e.start); if (!st) continue;
    const en = readTime(e.end, st.tz);
    const sMs0 = toUtc(st);
    const len = en ? toUtc(en) - sMs0 : e.duration ? durMs(e.duration) : st.allDay ? 864e5 : 0;
    const ex = new Set(e.exdate.map((x) => readTime(x, st.tz)).filter(Boolean).map(toUtc));
    const walls = e.rrule ? expand(e, st, toMs) : [st.wall];
    for (const w of walls) {
      const t = { ...st, wall: w }, sMs = toUtc(t), k = e.uid + '|' + sMs;
      if (ex.has(sMs)) continue;
      if (overrides.has(k)) continue; // la versión modificada se agrega abajo
      add(e, sMs, sMs + len, st.allDay, k);
    }
  }
  for (const [k, o] of overrides) { // repeticiones movidas o editadas
    const st = readTime(o.start); if (!st) continue;
    const en = readTime(o.end, st.tz), sMs = toUtc(st);
    const len = en ? toUtc(en) - sMs : o.duration ? durMs(o.duration) : st.allDay ? 864e5 : 0;
    add(o, sMs, sMs + len, st.allDay, k);
  }
  return out;
}

module.exports = { eventsFromIcs, parseIcs, tzOffset, wallToUtc, isoDay };
