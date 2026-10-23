// App de escritorio: abre la misma agenda web desde archivos locales, así funciona sin internet.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 880, minWidth: 380, minHeight: 600,
    title: 'Agenda Dra Paulina Lopez',
    backgroundColor: '#F3EBE1',
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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
