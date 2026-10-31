// Pruebas del servidor: cuenta inicial, permisos de secretaría, sincronización y conflictos.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'agenda-'));
process.env.AGENDA_GCAL_ANY_URL = '1';
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
    // Google Calendar → plataforma: se conecta la dirección iCal y los eventos llegan a todos (la secretaria solo ve "Ocupado")
    const dd = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), dc = dd.replace(/-/g, '');
    let icsBody = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:g1@google.com\r\nDTSTART;TZID=America/Argentina/Buenos_Aires:' + dc + 'T150000\r\nDTEND;TZID=America/Argentina/Buenos_Aires:' + dc + 'T163000\r\nSUMMARY:Dentista\r\nLOCATION:Centro\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:a1@agenda-dra-lopez\r\nDTSTART:' + dc + 'T120000Z\r\nDTEND:' + dc + 'T130000Z\r\nSUMMARY:Turno propio\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const http = require('node:http');
    const icsSrv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/calendar' }); r.end(icsBody); });
    await new Promise((r) => icsSrv.listen(0, r));
    try {
      process.env.AGENDA_GCAL_ANY_URL = '';
      assert.equal((await call('/api/gcal-config', { url: 'https://evil.example.com/x.ics' }, admin)).status, 400);
      process.env.AGENDA_GCAL_ANY_URL = '1';
      assert.equal((await call('/api/gcal-config', null, sec)).status, 403);
      const icsUrl = 'http://localhost:' + icsSrv.address().port + '/basic.ics';
      let g = await call('/api/gcal-config', { url: icsUrl, profesionalId: 'pr1' }, admin);
      assert.equal(g.status, 200);
      assert.equal(g.body.feeds.length, 1);
      assert.equal(g.body.feeds[0].ok, true);
      assert.equal(g.body.feeds[0].count, 1);
      assert.equal((await call('/api/gcal-config', { url: icsUrl }, admin)).status, 409);
      const sy = await call('/api/sync', { since: 0 }, admin);
      assert.ok(sy.body.gcalVer);
      let ge = await call('/api/gcal', null, admin);
      assert.equal(ge.body.ver, sy.body.gcalVer);
      assert.deepEqual(ge.body.events.map((e) => [e.fecha, e.hora, e.duracion, e.titulo, e.lugar, e.profesionalId]), [[dd, '15:00', 90, 'Dentista', 'Centro', 'pr1']]);
      assert.equal(ge.body.events[0].feed, undefined);
      const gs = await call('/api/gcal', null, sec);
      assert.equal(gs.body.events[0].titulo, 'Ocupado');
      assert.equal(gs.body.events[0].lugar, '');
      // cambia en Google → cambia la versión
      icsBody = icsBody.replace('Dentista', 'Dentista (movido)');
      await call('/api/gcal-refresh', {}, admin);
      ge = await call('/api/gcal', null, admin);
      assert.notEqual(ge.body.ver, sy.body.gcalVer);
      assert.equal(ge.body.events[0].titulo, 'Dentista (movido)');
      // si Google falla, se mantienen los eventos anteriores y se avisa el error
      icsSrv.close();
      g = await call('/api/gcal-refresh', {}, admin);
      assert.equal(g.body.feeds[0].ok, false);
      assert.ok(g.body.feeds[0].error);
      assert.equal((await call('/api/gcal', null, admin)).body.events.length, 1);
      g = await call('/api/gcal-config', { remove: g.body.feeds[0].id }, admin);
      assert.equal(g.body.feeds.length, 0);
      assert.equal((await call('/api/gcal', null, admin)).body.events.length, 0);
    } finally { icsSrv.close(); }
  } finally { server.close(); }
});
