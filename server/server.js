// Servidor de la Agenda Dra Paulina Lopez.
// Sin dependencias externas: Node 22.13+ (usa node:sqlite y node:crypto).
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
// Base de datos: node:sqlite (Node 22.13+) o better-sqlite3 (app de escritorio).
function openDb(file) {
  try { const { DatabaseSync } = require('node:sqlite'); return new DatabaseSync(file); }
  catch (e) { const Database = require('better-sqlite3'); return new Database(file); }
}

const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = process.env.AGENDA_DATA_DIR || process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const WEB_DIR = process.env.AGENDA_WEB_DIR || path.join(__dirname, '..', 'web');
const TOKEN_DAYS = Number(process.env.TOKEN_DAYS || 30);
const COLS = ['professionals', 'locations', 'patients', 'appointments', 'sessions', 'payments', 'config', 'attachments'];
const MAX_FILE = Number(process.env.MAX_FILE_MB || 20) * 1024 * 1024;
const ROLES = ['admin', 'medico', 'secretaria'];

fs.mkdirSync(DATA_DIR, { recursive: true });
const FILES_DIR = path.join(DATA_DIR, 'files');
fs.mkdirSync(FILES_DIR, { recursive: true });
const db = openDb(path.join(DATA_DIR, 'agenda.sqlite'));
db.exec(`
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, nombre TEXT, email TEXT UNIQUE COLLATE NOCASE, pass TEXT, rol TEXT, activo INTEGER DEFAULT 1, profesionalId TEXT, creado TEXT);
CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY, userId TEXT, creado TEXT, visto TEXT);
CREATE TABLE IF NOT EXISTS docs(col TEXT, id TEXT, data TEXT, updatedAt TEXT, deleted INTEGER DEFAULT 0, seq INTEGER, updatedBy TEXT, PRIMARY KEY(col,id));
CREATE INDEX IF NOT EXISTS docs_seq ON docs(seq);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, userId TEXT, accion TEXT, col TEXT, docId TEXT, detalle TEXT);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS calfeeds(token TEXT PRIMARY KEY, userId TEXT UNIQUE, creado TEXT);
`);

/* ---------- utilidades ---------- */
const now = () => new Date().toISOString();
const uid = (p) => p + '_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function hashPass(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt.toString('hex') + '$' + key.toString('hex');
}
function checkPass(pw, stored) {
  const [alg, salt, key] = String(stored || '').split('$');
  if (alg !== 'scrypt') return false;
  const k = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(k, Buffer.from(key, 'hex'));
}
const nextSeq = () => {
  const r = db.prepare('SELECT v FROM meta WHERE k=?').get('seq');
  const n = (r ? Number(r.v) : 0) + 1;
  db.prepare('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run('seq', String(n));
  return n;
};
const audit = (userId, accion, col = '', docId = '', detalle = '') =>
  db.prepare('INSERT INTO audit(ts,userId,accion,col,docId,detalle) VALUES(?,?,?,?,?,?)').run(now(), userId, accion, col, docId, detalle);
const publicUser = (u) => u && ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: !!u.activo, profesionalId: u.profesionalId || '' });

/* ---------- permisos por rol ---------- */
// La secretaria no ve historia clínica, sesiones ni sus documentos adjuntos. Solo admin y médico cambian configuración, profesionales y lugares.
const canRead = (u, col) => !(u.rol === 'secretaria' && (col === 'sessions' || col === 'attachments'));
const canWrite = (u, col) => {
  if (u.rol === 'admin') return true;
  if (['config', 'professionals', 'locations'].includes(col)) return u.rol === 'medico';
  return canRead(u, col);
};
function shapeOut(u, col, doc) {
  if (u.rol === 'secretaria' && col === 'patients' && doc) { const { hc, hcUpdated, ...rest } = doc; return rest; }
  return doc;
}

/* ---------- http ---------- */
function send(res, code, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(data);
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 25 * 1024 * 1024) { reject(Object.assign(new Error('Demasiado grande'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(Object.assign(new Error('JSON inválido'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function authUser(req, queryToken) {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : (queryToken || '');
  if (!tok) return null;
  const t = db.prepare('SELECT * FROM tokens WHERE hash=?').get(sha(tok));
  if (!t) return null;
  if (Date.now() - Date.parse(t.visto) > TOKEN_DAYS * 864e5) { db.prepare('DELETE FROM tokens WHERE hash=?').run(t.hash); return null; }
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(t.userId);
  if (!u || !u.activo) return null;
  db.prepare('UPDATE tokens SET visto=? WHERE hash=?').run(now(), t.hash);
  u._tok = t.hash;
  return u;
}
const fails = new Map(); // intentos de login por IP
function tooMany(ip) { const f = fails.get(ip); return f && f.n >= 8 && Date.now() - f.t < 10 * 60e3; }
function failed(ip) { const f = fails.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - f.t > 10 * 60e3) { f.n = 0; f.t = Date.now(); } f.n++; fails.set(ip, f); }

function issueToken(u) {
  const tok = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO tokens(hash,userId,creado,visto) VALUES(?,?,?,?)').run(sha(tok), u.id, now(), now());
  return tok;
}

/* ---------- API ---------- */
const routes = {
  'GET /api/status': () => ({ ok: true, app: 'agenda-dra-paulina-lopez', version: 1, needsSetup: !db.prepare('SELECT 1 FROM users LIMIT 1').get() }),

  'POST /api/setup': async (req) => {
    if (db.prepare('SELECT 1 FROM users LIMIT 1').get()) throw Object.assign(new Error('El servidor ya está configurado.'), { status: 409 });
    const b = await readJson(req);
    if (!b.nombre || !b.email || !b.password || String(b.password).length < 8) throw Object.assign(new Error('Completá nombre, email y una contraseña de al menos 8 caracteres.'), { status: 400 });
    const u = { id: uid('usr'), nombre: b.nombre, email: b.email, pass: hashPass(b.password), rol: 'admin', activo: 1, profesionalId: '', creado: now() };
    db.prepare('INSERT INTO users(id,nombre,email,pass,rol,activo,profesionalId,creado) VALUES(?,?,?,?,?,?,?,?)').run(u.id, u.nombre, u.email, u.pass, u.rol, u.activo, u.profesionalId, u.creado);
    audit(u.id, 'setup');
    return { token: issueToken(u), user: publicUser(u) };
  },

  'POST /api/login': async (req) => {
    const ip = req.socket.remoteAddress;
    if (tooMany(ip)) throw Object.assign(new Error('Demasiados intentos. Esperá 10 minutos.'), { status: 429 });
    const b = await readJson(req);
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(b.email || '').trim());
    if (!u || !u.activo || !checkPass(String(b.password || ''), u.pass)) { failed(ip); throw Object.assign(new Error('Email o contraseña incorrectos.'), { status: 401 }); }
    fails.delete(ip);
    audit(u.id, 'login');
    return { token: issueToken(u), user: publicUser(u) };
  },

  'POST /api/logout': (req, u) => { db.prepare('DELETE FROM tokens WHERE hash=?').run(u._tok); return { ok: true }; },
  'GET /api/me': (req, u) => ({ user: publicUser(u) }),

  'POST /api/me/password': async (req, u) => {
    const b = await readJson(req);
    if (!checkPass(String(b.actual || ''), u.pass)) throw Object.assign(new Error('La contraseña actual no es correcta.'), { status: 400 });
    if (String(b.nueva || '').length < 8) throw Object.assign(new Error('La nueva contraseña debe tener al menos 8 caracteres.'), { status: 400 });
    db.prepare('UPDATE users SET pass=? WHERE id=?').run(hashPass(b.nueva), u.id);
    audit(u.id, 'cambio de contraseña');
    return { ok: true };
  },

  // Sincronización: el equipo manda sus cambios y recibe los de los demás desde `since`.
  'POST /api/sync': async (req, u) => {
    const b = await readJson(req);
    const since = Number(b.since || 0);
    const changes = Array.isArray(b.changes) ? b.changes.slice(0, 5000) : [];
    const rejected = [];
    db.exec('BEGIN');
    try {
      for (const ch of changes) {
        const col = ch && ch.col, doc = ch && ch.doc;
        if (!COLS.includes(col) || !doc || typeof doc.id !== 'string' || !/^[\w.:@+-]{1,120}$/.test(doc.id)) { rejected.push({ col, id: doc && doc.id, motivo: 'inválido' }); continue; }
        if (!canWrite(u, col)) { rejected.push({ col, id: doc.id, motivo: 'sin permiso' }); continue; }
        const cur = db.prepare('SELECT * FROM docs WHERE col=? AND id=?').get(col, doc.id);
        const upd = String(doc.updatedAt || now());
        if (cur && cur.updatedAt > upd) continue; // gana el cambio más nuevo
        let data = { ...doc };
        if (u.rol === 'secretaria' && col === 'patients' && cur) { // no pisar la historia clínica que la secretaria no ve
          const old = JSON.parse(cur.data || '{}');
          if (old.hc !== undefined) data.hc = old.hc;
          if (old.hcUpdated !== undefined) data.hcUpdated = old.hcUpdated;
        }
        const deleted = doc._deleted ? 1 : 0;
        db.prepare(`INSERT INTO docs(col,id,data,updatedAt,deleted,seq,updatedBy) VALUES(?,?,?,?,?,?,?)
          ON CONFLICT(col,id) DO UPDATE SET data=excluded.data,updatedAt=excluded.updatedAt,deleted=excluded.deleted,seq=excluded.seq,updatedBy=excluded.updatedBy`)
          .run(col, doc.id, JSON.stringify(data), upd, deleted, nextSeq(), u.id);
        if (deleted && col === 'attachments') for (const x of ['', '.type']) fs.rm(filePath(doc.id) + x, { force: true }, () => {});
        audit(u.id, deleted ? 'eliminó' : cur ? 'modificó' : 'creó', col, doc.id);
      }
      db.exec('COMMIT');
      if (changes.length) notify();
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    const rows = db.prepare('SELECT col,id,data,deleted,seq FROM docs WHERE seq>? ORDER BY seq LIMIT 5000').all(since);
    const out = [];
    let max = since;
    for (const r of rows) {
      max = Math.max(max, r.seq);
      if (!canRead(u, r.col)) continue;
      out.push({ col: r.col, doc: r.deleted ? { id: r.id, _deleted: true } : shapeOut(u, r.col, JSON.parse(r.data)) });
    }
    const more = rows.length === 5000;
    return { since: max, changes: out, rejected, more, gcalVer: metaGet('gcalEvents', { ver: '' }).ver || '' };
  },

  'GET /api/calendario': (req, u) => calToken(u, false),
  'GET /api/gcal': (req, u) => {
    const d = metaGet('gcalEvents', { ver: '', events: [] });
    const events = d.events.map(({ feed, ...e }) => (u.rol === 'secretaria' ? { ...e, titulo: 'Ocupado', lugar: '' } : e));
    return { ver: d.ver || '', events };
  },
  'GET /api/gcal-config': (req, u) => { notSec(u); return gcalConfigOut(); },
  'POST /api/gcal-config': async (req, u) => {
    notSec(u);
    const b = await readJson(req), cfg = metaGet('gcalIn', { feeds: [] });
    if (b.remove) { cfg.feeds = cfg.feeds.filter((f) => f.id !== b.remove); audit(u.id, 'quitó calendario de Google'); }
    else if (b.id && 'profesionalId' in b) { const f = cfg.feeds.find((x) => x.id === b.id); if (f) f.profesionalId = String(b.profesionalId || ''); }
    else {
      const url = String(b.url || '').trim().replace(/^webcal:/i, 'https:');
      if (!gcalUrlOk(url)) throw Object.assign(new Error('Esa no es la dirección secreta en formato iCal de Google Calendar. Tiene que empezar con https://calendar.google.com/calendar/ical/ y terminar en basic.ics.'), { status: 400 });
      if (cfg.feeds.some((f) => f.url === url)) throw Object.assign(new Error('Ese calendario ya está conectado.'), { status: 409 });
      if (cfg.feeds.length >= 5) throw Object.assign(new Error('Podés conectar hasta 5 calendarios.'), { status: 400 });
      cfg.feeds.push({ id: uid('gc'), url, profesionalId: String(b.profesionalId || ''), creado: now() });
      audit(u.id, 'conectó calendario de Google');
    }
    metaSet('gcalIn', cfg);
    await gcalRefresh();
    return gcalConfigOut();
  },
  'POST /api/gcal-refresh': async (req, u) => { notSec(u); await gcalRefresh(); return gcalConfigOut(); },
  'POST /api/calendario/nuevo': (req, u) => calToken(u, true),
  'GET /api/users': (req, u) => { need(u, 'admin'); return { users: db.prepare('SELECT * FROM users ORDER BY nombre').all().map(publicUser) }; },
  'POST /api/users': async (req, u) => {
    need(u, 'admin');
    const b = await readJson(req);
    if (!b.nombre || !b.email || String(b.password || '').length < 8) throw Object.assign(new Error('Completá nombre, email y una contraseña de al menos 8 caracteres.'), { status: 400 });
    if (!ROLES.includes(b.rol)) throw Object.assign(new Error('Rol inválido.'), { status: 400 });
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(b.email)) throw Object.assign(new Error('Ya existe un usuario con ese email.'), { status: 409 });
    const nu = { id: uid('usr'), nombre: b.nombre, email: b.email, pass: hashPass(b.password), rol: b.rol, activo: 1, profesionalId: b.profesionalId || '', creado: now() };
    db.prepare('INSERT INTO users(id,nombre,email,pass,rol,activo,profesionalId,creado) VALUES(?,?,?,?,?,?,?,?)').run(nu.id, nu.nombre, nu.email, nu.pass, nu.rol, nu.activo, nu.profesionalId, nu.creado);
    audit(u.id, 'creó usuario', 'users', nu.id, nu.email);
    return { user: publicUser(nu) };
  },
  'GET /api/audit': (req, u) => {
    need(u, 'admin');
    const rows = db.prepare('SELECT a.*, u.nombre FROM audit a LEFT JOIN users u ON u.id=a.userId ORDER BY a.id DESC LIMIT 300').all();
    return { audit: rows };
  },
};
function need(u, rol) { if (u.rol !== rol) throw Object.assign(new Error('No tenés permiso para esto.'), { status: 403 }); }

// PATCH /api/users/:id
async function patchUser(req, u, id) {
  need(u, 'admin');
  const b = await readJson(req);
  const t = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  if (!t) throw Object.assign(new Error('Usuario no encontrado.'), { status: 404 });
  if (b.rol !== undefined && !ROLES.includes(b.rol)) throw Object.assign(new Error('Rol inválido.'), { status: 400 });
  if (t.id === u.id && (b.activo === false || (b.rol && b.rol !== 'admin'))) throw Object.assign(new Error('No podés quitarte el rol de administrador ni desactivarte.'), { status: 400 });
  if (b.password !== undefined && String(b.password).length < 8) throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres.'), { status: 400 });
  db.prepare('UPDATE users SET nombre=?, rol=?, activo=?, profesionalId=?, pass=? WHERE id=?').run(
    b.nombre ?? t.nombre, b.rol ?? t.rol, b.activo === undefined ? t.activo : (b.activo ? 1 : 0), b.profesionalId ?? t.profesionalId, b.password ? hashPass(b.password) : t.pass, id);
  if (b.activo === false || b.password) db.prepare('DELETE FROM tokens WHERE userId=?').run(id);
  audit(u.id, 'modificó usuario', 'users', id, Object.keys(b).filter((k) => k !== 'password').join(',') + (b.password ? ',contraseña' : ''));
  return { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)) };
}

/* ---------- documentos adjuntos (fotos, escaneos, PDF) ---------- */
const FILE_ID = /^[\w-]{1,120}$/;
const filePath = (id) => path.join(FILES_DIR, id);
async function files(req, res, u, id) {
  if (!FILE_ID.test(id)) return send(res, 400, { error: 'Archivo inválido.' });
  if (!canRead(u, 'attachments')) return send(res, 403, { error: 'No tenés permiso para ver documentos.' });
  const f = filePath(id);
  if (req.method === 'GET') {
    if (!fs.existsSync(f)) return send(res, 404, { error: 'El archivo todavía no se subió.' });
    let tipo = 'application/octet-stream';
    try { tipo = fs.readFileSync(f + '.type', 'utf8') || tipo; } catch (e) {}
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': fs.statSync(f).size, 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox", 'Access-Control-Allow-Origin': '*' });
    return fs.createReadStream(f).pipe(res);
  }
  if (req.method === 'PUT') {
    const chunks = []; let size = 0;
    await new Promise((resolve, reject) => {
      req.on('data', (c) => { size += c.length; if (size > MAX_FILE) { reject(Object.assign(new Error('El archivo es demasiado grande.'), { status: 413 })); req.destroy(); } else chunks.push(c); });
      req.on('end', resolve); req.on('error', reject);
    });
    const tmp = f + '.tmp-' + crypto.randomBytes(4).toString('hex');
    fs.writeFileSync(tmp, Buffer.concat(chunks));
    fs.renameSync(tmp, f);
    fs.writeFileSync(f + '.type', String(req.headers['content-type'] || 'application/octet-stream').slice(0, 100));
    audit(u.id, 'subió archivo', 'attachments', id, String(size));
    return send(res, 200, { ok: true, size });
  }
  return send(res, 405, { error: 'Método no permitido' });
}

/* ---------- archivos de la app web ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  let p = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(WEB_DIR, p);
  if (!file.startsWith(WEB_DIR)) return send(res, 403, 'Prohibido');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB_DIR, 'index.html');
  const ext = path.extname(file);
  // html, js y css sin caché del navegador: así cada publicación nueva se ve al recargar.
  const noCache = ['.html', '.js', '.css', '.webmanifest'].includes(ext);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  fs.createReadStream(file).pipe(res);
}

/* ---------- calendario para Google Calendar (solo de ida: la agenda se publica, Google no escribe nada acá) ---------- */
// Cada usuario tiene un enlace secreto /api/cal/<clave>.ics que Google Calendar lee cada tantas horas.
function calToken(u, nuevo) {
  if (u.rol === 'secretaria') throw Object.assign(new Error('No tenés permiso para esto.'), { status: 403 });
  if (nuevo) db.prepare('DELETE FROM calfeeds WHERE userId=?').run(u.id);
  let r = db.prepare('SELECT token FROM calfeeds WHERE userId=?').get(u.id);
  if (!r) { r = { token: crypto.randomBytes(24).toString('base64url') }; db.prepare('INSERT INTO calfeeds(token,userId,creado) VALUES(?,?,?)').run(r.token, u.id, now()); audit(u.id, nuevo ? 'renovó enlace de calendario' : 'creó enlace de calendario'); }
  return { path: '/api/cal/' + r.token + '.ics' };
}
const icsEsc = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function icsFold(line) { // líneas de hasta 75 bytes, como pide el estándar
  const out = []; let cur = '';
  for (const ch of line) { if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) { out.push(cur); cur = ''; } cur += ch; }
  out.push(cur); return out.join('\r\n ');
}
// Argentina está en UTC-3 todo el año: la hora local se pasa a UTC sumando 3 horas.
function icsTime(fecha, min) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, min)).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}
const ESTADOS = { pendiente: 'A confirmar', confirmado: 'Confirmado', atendido: 'Atendido', ausente: 'Ausente', cancelado: 'Cancelado' };
function calendarFeed(res, token) {
  const f = db.prepare('SELECT * FROM calfeeds WHERE token=?').get(token);
  const u = f && db.prepare('SELECT * FROM users WHERE id=?').get(f.userId);
  if (!u || !u.activo || u.rol === 'secretaria') return send(res, 404, 'No encontrado');
  const all = (col) => {
    const m = new Map();
    for (const r of db.prepare('SELECT id,data FROM docs WHERE col=? AND deleted=0').all(col)) { try { m.set(r.id, JSON.parse(r.data)); } catch (e) {} }
    return m;
  };
  const pats = all('patients'), pros = all('professionals'), locs = all('locations');
  const desde = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Agenda Dra Paulina Lopez//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Agenda Dra Paulina Lopez', 'X-WR-TIMEZONE:America/Argentina/Buenos_Aires', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  const stamp = icsTime(now().slice(0, 10), 0);
  for (const a of all('appointments').values()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') || !/^\d{1,2}:\d{2}$/.test(a.hora || '') || a.estado === 'cancelado' || a.fecha < desde) continue;
    const [h, mi] = a.hora.split(':').map(Number), ini = h * 60 + mi, fin = ini + (Number(a.duracion) || 30);
    const p = pats.get(a.pacienteId) || {}, pr = pros.get(a.profesionalId) || {}, l = locs.get(a.lugarId) || {};
    const nom = [p.apellido, p.nombre].filter(Boolean).join(', ') || 'Paciente';
    const det = [pr.nombre && 'Profesional: ' + pr.nombre, a.motivo && 'Motivo: ' + a.motivo, p.telefono && 'Teléfono: ' + p.telefono, p.obraSocial && 'Obra social: ' + p.obraSocial, ESTADOS[a.estado] && 'Estado: ' + ESTADOS[a.estado]].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT', 'UID:' + a.id + '@agenda-dra-lopez', 'DTSTAMP:' + stamp, 'DTSTART:' + icsTime(a.fecha, ini), 'DTEND:' + icsTime(a.fecha, fin),
      'SUMMARY:' + icsEsc('Turno: ' + nom + (a.estado === 'pendiente' ? ' (a confirmar)' : '')), 'DESCRIPTION:' + icsEsc(det),
      'LOCATION:' + icsEsc([l.nombre, l.direccion, l.ciudad].filter(Boolean).join(', ')), 'STATUS:' + (a.estado === 'pendiente' ? 'TENTATIVE' : 'CONFIRMED'), 'TRANSP:OPAQUE', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' });
  res.end(L.map(icsFold).join('\r\n') + '\r\n');
}

/* ---------- Google Calendar → plataforma: lee la dirección secreta iCal y trae los eventos (solo lectura) ---------- */
const gcalIn = require('./gcal-in.js');
const GCAL_EVERY_MIN = Number(process.env.GCAL_EVERY_MIN || 10);
const metaGet = (k, d) => { const r = db.prepare('SELECT v FROM meta WHERE k=?').get(k); try { return r ? JSON.parse(r.v) : d; } catch (e) { return d; } };
const metaSet = (k, v) => db.prepare('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k, JSON.stringify(v));
const gcalUrlOk = (u) => /^https:\/\/calendar\.google\.com\/calendar\/ical\/[^\s?#]+\/basic\.ics$/.test(u) || (process.env.AGENDA_GCAL_ANY_URL === '1' && /^https?:\/\/\S+$/.test(u));
const maskUrl = (u) => u.replace(/(private-)[0-9a-f]+/i, '$1••••••').replace(/(\/ical\/)([^/]{3})[^/]*(@|%40)/, '$1$2•••$3');
let gcalBusy = null;
function gcalRefresh() {
  if (gcalBusy) return gcalBusy;
  gcalBusy = (async () => {
    const cfg = metaGet('gcalIn', { feeds: [] }), prev = metaGet('gcalEvents', { ver: '', events: [], status: {} });
    const fromMs = Date.now() - 60 * 864e5, toMs = Date.now() + 400 * 864e5;
    const events = [], status = {};
    for (const f of cfg.feeds) {
      try {
        const r = await fetch(f.url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'agenda-dra-paulina-lopez' } });
        if (!r.ok) throw new Error(r.status === 404 ? 'Google no encontró ese calendario. Revisá que la dirección esté completa.' : 'Google respondió con un error (' + r.status + ').');
        const text = await r.text();
        if (text.length > 15 * 1024 * 1024) throw new Error('El calendario es demasiado grande.');
        if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('La dirección no es un calendario iCal.');
        const evs = gcalIn.eventsFromIcs(text, { fromMs, toMs, skipUid: /@agenda-dra-lopez$/ });
        for (const e of evs) events.push({ id: 'g' + sha(f.id + '|' + e.key + '|' + e.seg).slice(0, 18), fecha: e.fecha, hora: e.hora, duracion: e.duracion, allDay: e.allDay, titulo: e.titulo, lugar: e.lugar, profesionalId: f.profesionalId || '', feed: f.id });
        status[f.id] = { ok: true, at: now(), count: evs.length };
      } catch (e) {
        // si Google no responde se mantienen los eventos que ya teníamos de ese calendario
        for (const ev of prev.events) if (ev.feed === f.id) events.push({ ...ev, profesionalId: f.profesionalId || '' });
        status[f.id] = { ok: false, at: now(), error: e.name === 'TimeoutError' ? 'Google tardó demasiado en responder.' : e.message, lastOk: prev.status && prev.status[f.id] && (prev.status[f.id].ok ? prev.status[f.id].at : prev.status[f.id].lastOk) };
      }
    }
    events.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora) || a.id.localeCompare(b.id));
    const ver = events.length || cfg.feeds.length ? sha(JSON.stringify(events)).slice(0, 12) : '';
    metaSet('gcalEvents', { ver, events, status });
    if (ver !== prev.ver) notify();
    return ver;
  })().finally(() => { gcalBusy = null; });
  return gcalBusy;
}
function gcalConfigOut() {
  const cfg = metaGet('gcalIn', { feeds: [] }), ev = metaGet('gcalEvents', { status: {} });
  return { feeds: cfg.feeds.map((f) => ({ id: f.id, url: maskUrl(f.url), profesionalId: f.profesionalId || '', ...(ev.status && ev.status[f.id]) })) };
}
const notSec = (u) => { if (u.rol === 'secretaria') throw Object.assign(new Error('No tenés permiso para esto.'), { status: 403 }); };
setTimeout(() => { if (metaGet('gcalIn', { feeds: [] }).feeds.length) gcalRefresh().catch((e) => console.error(e)); }, 3000).unref();
setInterval(() => { if (metaGet('gcalIn', { feeds: [] }).feeds.length) gcalRefresh().catch((e) => console.error(e)); }, GCAL_EVERY_MIN * 60e3).unref();

/* ---------- tiempo real: avisa a los equipos conectados cuando hay cambios ---------- */
const listeners = new Set();
let notifyTimer = null;
function notify() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    const r = db.prepare('SELECT v FROM meta WHERE k=?').get('seq');
    const msg = `event: cambio\ndata: ${r ? r.v : 0}\n\n`;
    for (const l of listeners) { try { l.write(msg); } catch (e) { listeners.delete(l); } }
  }, 150);
}
setInterval(() => { for (const l of listeners) { try { l.write(': ping\n\n'); } catch (e) { listeners.delete(l); } } }, 25000).unref();
function events(req, res, url) {
  const u = authUser(req, url.searchParams.get('token'));
  if (!u) return send(res, 401, { error: 'Tu sesión venció. Volvé a ingresar.' });
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no', 'Access-Control-Allow-Origin': '*' });
  res.write('retry: 3000\n\n');
  listeners.add(res);
  req.on('close', () => listeners.delete(res));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (req.method === 'GET' && url.pathname === '/api/events') return events(req, res, url);
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  const cm = req.method === 'GET' && url.pathname.match(/^\/api\/cal\/([\w-]{20,80})\.ics$/);
  if (cm) { try { return calendarFeed(res, cm[1]); } catch (e) { console.error(e); return send(res, 500, 'Error'); } }
  try {
    const key = req.method + ' ' + url.pathname;
    const open = ['GET /api/status', 'POST /api/setup', 'POST /api/login'];
    const fm = url.pathname.match(/^\/api\/files\/([^/]+)$/);
    if (fm) { const u = authUser(req); if (!u) return send(res, 401, { error: 'Tu sesión venció. Volvé a ingresar.' }); return await files(req, res, u, decodeURIComponent(fm[1])); }
    const m = url.pathname.match(/^\/api\/users\/([\w-]+)$/);
    const handler = routes[key] || (m && req.method === 'PATCH' ? (rq, u) => patchUser(rq, u, m[1]) : null);
    if (!handler) return send(res, 404, { error: 'No encontrado' });
    let u = null;
    if (!open.includes(key)) { u = authUser(req); if (!u) return send(res, 401, { error: 'Tu sesión venció. Volvé a ingresar.' }); }
    const out = await handler(req, u);
    send(res, 200, out);
  } catch (e) {
    if (!e.status) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : 'Error interno del servidor.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Agenda lista en http://localhost:${PORT}  (datos en ${DATA_DIR})`));
}
module.exports = { server, db, DATA_DIR };
