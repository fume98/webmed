// Pruebas del servidor: cuenta inicial, permisos de secretaría, sincronización y conflictos.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-'));
const { server } = require('../server/server.js');

let base;
const call = async (p, body, token, method) => {
  const r = await fetch(base + p, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json() };
};

test('flujo completo', async () => {
  await new Promise((r) => server.listen(0, r));
  base = 'http://localhost:' + server.address().port;
  try {
    assert.equal((await call('/api/status')).body.needsSetup, true);
    const setup = await call('/api/setup', { nombre: 'Dra', email: 'dra@x.com', password: 'clave1234' });
    assert.equal(setup.status, 200);
    const admin = setup.body.token;
    assert.equal((await call('/api/setup', { nombre: 'X', email: 'x@x.com', password: 'clave1234' })).status, 409);
    assert.equal((await call('/api/login', { email: 'dra@x.com', password: 'mal' })).status, 401);
    assert.equal((await call('/api/sync', { since: 0 })).status, 401);

    const t1 = '2026-01-01T10:00:00.000Z';
    let s = await call('/api/sync', { since: 0, changes: [
      { col: 'patients', doc: { id: 'p1', nombre: 'Ana', hc: { alergias: 'Penicilina' }, updatedAt: t1 } },
      { col: 'sessions', doc: { id: 's1', pacienteId: 'p1', numero: 1, updatedAt: t1 } },
    ] }, admin);
    assert.equal(s.body.changes.length, 2);

    await call('/api/users', { nombre: 'Sofi', email: 'sofi@x.com', password: 'clave5678', rol: 'secretaria' }, admin);
    const sec = (await call('/api/login', { email: 'sofi@x.com', password: 'clave5678' })).body.token;
    s = await call('/api/sync', { since: 0 }, sec);
    assert.deepEqual(s.body.changes.map((c) => c.col), ['patients']);
    assert.equal(s.body.changes[0].doc.hc, undefined);

    // la secretaria edita el paciente: la historia clínica se conserva
    s = await call('/api/sync', { since: s.body.since, changes: [{ col: 'patients', doc: { id: 'p1', nombre: 'Ana María', updatedAt: '2026-01-02T00:00:00.000Z' } }, { col: 'config', doc: { id: 'main', x: 1 } }, { col: 'sessions', doc: { id: 's2' } }] }, sec);
    assert.equal(s.body.rejected.length, 2);
    s = await call('/api/sync', { since: 0 }, admin);
    const p1 = s.body.changes.find((c) => c.doc.id === 'p1').doc;
    assert.equal(p1.nombre, 'Ana María');
    assert.equal(p1.hc.alergias, 'Penicilina');

    // un cambio más viejo no pisa uno más nuevo
    await call('/api/sync', { since: 0, changes: [{ col: 'patients', doc: { id: 'p1', nombre: 'Viejo', updatedAt: '2025-01-01T00:00:00.000Z' } }] }, admin);
    s = await call('/api/sync', { since: 0 }, admin);
    assert.equal(s.body.changes.find((c) => c.doc.id === 'p1').doc.nombre, 'Ana María');

    // borrado
    await call('/api/sync', { since: 0, changes: [{ col: 'sessions', doc: { id: 's1', _deleted: true, updatedAt: '2026-02-01T00:00:00.000Z' } }] }, admin);
    s = await call('/api/sync', { since: 0 }, admin);
    assert.equal(s.body.changes.find((c) => c.doc.id === 's1').doc._deleted, true);

    assert.equal((await call('/api/users', null, sec)).status, 403);
    assert.ok((await call('/api/audit', null, admin)).body.audit.length > 3);

    // documentos adjuntos: se suben, se descargan, la secretaria no los ve y se borran con la ficha
    const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
    const up = await fetch(base + '/api/files/adj_1', { method: 'PUT', headers: { Authorization: 'Bearer ' + admin, 'Content-Type': 'image/png' }, body: png });
    assert.equal(up.status, 200);
    await call('/api/sync', { since: 0, changes: [{ col: 'attachments', doc: { id: 'adj_1', pacienteId: 'p1', sesionId: 's2', nombre: 'estudio.png', tipo: 'image/png', updatedAt: '2026-03-01T00:00:00.000Z' } }] }, admin);
    const dl = await fetch(base + '/api/files/adj_1', { headers: { Authorization: 'Bearer ' + admin } });
    assert.equal(dl.status, 200);
    assert.equal(dl.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await dl.arrayBuffer()), png);
    assert.equal((await fetch(base + '/api/files/adj_1')).status, 401);
    assert.equal((await fetch(base + '/api/files/adj_1', { headers: { Authorization: 'Bearer ' + sec } })).status, 403);
    assert.equal((await fetch(base + '/api/files/..%2Fagenda.sqlite', { headers: { Authorization: 'Bearer ' + admin } })).status, 400);
    s = await call('/api/sync', { since: 0 }, sec);
    assert.ok(!s.body.changes.some((c) => c.col === 'attachments'));
    await call('/api/sync', { since: 0, changes: [{ col: 'attachments', doc: { id: 'adj_1', _deleted: true, updatedAt: '2026-03-02T00:00:00.000Z' } }] }, admin);
    await new Promise((r) => setTimeout(r, 50));
    assert.equal((await fetch(base + '/api/files/adj_1', { headers: { Authorization: 'Bearer ' + admin } })).status, 404);
    // calendario para Google Calendar: enlace privado de solo lectura
    await call('/api/sync', { since: 0, changes: [
      { col: 'professionals', doc: { id: 'pr1', nombre: 'Dra Paulina Lopez', updatedAt: t1 } },
      { col: 'locations', doc: { id: 'l1', nombre: 'Consultorio', direccion: 'San Martín 123, piso 2', ciudad: 'Santa Fe', updatedAt: t1 } },
      { col: 'appointments', doc: { id: 'a1', pacienteId: 'p1', profesionalId: 'pr1', lugarId: 'l1', fecha: '2099-05-04', hora: '9:30', duracion: 45, motivo: 'Control; dolor, lumbar', estado: 'pendiente', updatedAt: t1 } },
      { col: 'appointments', doc: { id: 'a2', pacienteId: 'p1', fecha: '2099-05-05', hora: '10:00', estado: 'cancelado', updatedAt: t1 } },
    ] }, admin);
    assert.equal((await call('/api/calendario', null, sec)).status, 403);
    const c1 = await call('/api/calendario', null, admin);
    assert.match(c1.body.path, /^\/api\/cal\/[\w-]{20,}\.ics$/);
    assert.equal((await call('/api/calendario', null, admin)).body.path, c1.body.path);
    const ics = await fetch(base + c1.body.path);
    assert.equal(ics.status, 200);
    assert.match(ics.headers.get('content-type'), /text\/calendar/);
    const txt = await ics.text();
    assert.match(txt, /^BEGIN:VCALENDAR\r\n/);
    assert.match(txt, /UID:a1@agenda-dra-lopez/);
    assert.match(txt, /DTSTART:20990504T123000Z\r\nDTEND:20990504T131500Z/);
    assert.match(txt, /SUMMARY:Turno: Ana María \(a confirmar\)/);
    assert.match(txt, /LOCATION:Consultorio\\, San Martín 123\\, piso 2\\, Santa Fe/);
    assert.ok(!txt.includes('a2@'));
    assert.ok(txt.split('\r\n').every((l) => Buffer.byteLength(l) <= 75));
    const c2 = await call('/api/calendario/nuevo', {}, admin);
    assert.notEqual(c2.body.path, c1.body.path);
    assert.equal((await fetch(base + c1.body.path)).status, 404);
    assert.equal((await fetch(base + c2.body.path)).status, 200);
  } finally { server.close(); }
});
