// App de escritorio: abre la agenda desde archivos locales (funciona sin internet).
// Opcionalmente hace de servidor en el WiFi del consultorio para que el celular use los mismos datos.
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'config.json');
const readConfig = () => { try { return JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')); } catch (e) { return {}; } };
const writeConfig = (c) => fs.writeFileSync(CONFIG_FILE(), JSON.stringify(c, null, 2));

let lan = null; // { port }

function lanAddresses(port) {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && !/^169\.254\./.test(a.address)) out.push({ nombre: name, url: `http://${a.address}:${port}` });
    }
  }
  // Primero las direcciones típicas de un WiFi hogareño
  return out.sort((x, y) => Number(!/\/\/192\.168\./.test(x.url)) - Number(!/\/\/192\.168\./.test(y.url)));
}

function startLan() {
  if (lan) return Promise.resolve(lan);
  process.env.AGENDA_DATA_DIR = path.join(app.getPath('userData'), 'datos');
  process.env.AGENDA_WEB_DIR = path.join(__dirname, 'web');
  const { server } = require('./server/server.js');
  const ports = [8080, 8081, 8090, 18080];
  const prefer = readConfig().port;
  if (prefer) ports.unshift(prefer);
  return new Promise((resolve, reject) => {
    const tryPort = (i) => {
      if (i >= ports.length) return reject(new Error('No hay un puerto libre para compartir la agenda.'));
      const onErr = (e) => { server.removeListener('listening', onOk); if (e.code === 'EADDRINUSE') tryPort(i + 1); else reject(e); };
      const onOk = () => { server.removeListener('error', onErr); lan = { port: ports[i] }; writeConfig({ ...readConfig(), lan: true, port: ports[i] }); resolve(lan); };
      server.once('error', onErr);
      server.once('listening', onOk);
      server.listen(ports[i], '0.0.0.0');
    };
    tryPort(0);
  });
}

async function lanInfo() {
  if (!lan) return null;
  const urls = lanAddresses(lan.port);
  let qr = '';
  try { if (urls[0]) qr = await require('qrcode').toDataURL(urls[0].url, { margin: 1, width: 240, color: { dark: '#3B2C24', light: '#FBF7F2' } }); } catch (e) {}
  return { port: lan.port, local: `http://localhost:${lan.port}`, urls, qr };
}

ipcMain.handle('lan:start', async () => { await startLan(); return lanInfo(); });
ipcMain.handle('lan:info', () => lanInfo());

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 380, minHeight: 600,
    title: 'Agenda Dra Paulina Lopez',
    backgroundColor: '#F5EEE4',
    icon: path.join(__dirname, 'web', 'icon-512.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  // Los links externos (WhatsApp, etc.) se abren en el navegador o en la app de WhatsApp.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:|^whatsapp:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  win.loadFile(path.join(__dirname, 'web', 'index.html'));
}

Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: 'Agenda', submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'togglefullscreen', label: 'Pantalla completa' }, { type: 'separator' }, { role: 'quit', label: 'Salir' }] },
  { label: 'Editar', submenu: [{ role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' }, { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' }] },
  { label: 'Ver', submenu: [{ role: 'zoomIn', label: 'Agrandar' }, { role: 'zoomOut', label: 'Achicar' }, { role: 'resetZoom', label: 'Tamaño normal' }] },
]));

app.whenReady().then(async () => {
  if (readConfig().lan) { try { await startLan(); } catch (e) { console.error(e); } }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
