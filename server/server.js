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
const COLS = ['professionals', 'locations', 'patients', 'appointments', 'sessions', 'payments', 'config'];
const ROLES = ['admin', 'medico', 'secretaria'];

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = openDb(path.join(DATA_DIR, 'agenda.sqlite'));
db.exec(`
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, nombre TEXT, email TEXT UNIQUE COLLATE NOCASE, pass TEXT, rol TEXT, activo INTEGER DEFAULT 1, profesionalId TEXT, creado TEXT);
CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY, userId TEXT, creado TEXT, visto TEXT);
CREATE TABLE IF NOT EXISTS docs(col TEXT, id TEXT, data TEXT, updatedAt TEXT, deleted INTEGER DEFAULT 0, seq INTEGER, updatedBy TEXT, PRIMARY KEY(col,id));
CREATE INDEX IF NOT EXISTS docs_seq ON docs(seq);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, userId TEXT, accion TEXT, col TEXT, docId TEXT, detalle TEXT);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
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
// La secretaria no ve historia clínica ni sesiones. Solo admin y médico cambian configuración, profesionales y lugares.
const canRead = (u, col) => !(u.rol === 'secretaria' && col === 'sessions');
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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
function authUser(req) {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
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
        audit(u.id, deleted ? 'eliminó' : cur ? 'modificó' : 'creó', col, doc.id);
      }
      db.exec('COMMIT');
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
    return { since: max, changes: out, rejected, more };
  },

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

/* ---------- archivos de la app web ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  let p = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(WEB_DIR, p);
  if (!file.startsWith(WEB_DIR)) return send(res, 403, 'Prohibido');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB_DIR, 'index.html');
  const ext = path.extname(file);
  const noCache = ext === '.html' || file.endsWith('sw.js');
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': noCache ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  try {
    const key = req.method + ' ' + url.pathname;
    const open = ['GET /api/status', 'POST /api/setup', 'POST /api/login'];
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
