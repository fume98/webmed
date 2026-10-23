# Agenda Dra Paulina Lopez

Agenda de turnos, fichas de pacientes, historia clínica por sesión, pagos y envío de turnos por WhatsApp.
Un solo programa que funciona como **página web**, **app del celular** (instalable desde el navegador), **app de escritorio** y **servidor propio**. Funciona **sin internet** y sincroniza cuando vuelve la conexión.

## Cómo está armado

| Parte | Carpeta | Qué hace |
|---|---|---|
| Servidor | `server/` | Usuarios, permisos, sincronización, registro de cambios y base de datos (SQLite). Sirve también la página web. Sin dependencias: solo Node 22.13 o superior. |
| Web y celular | `web/` | La agenda. Guarda todo en el equipo (IndexedDB) y se sincroniza con el servidor. Se instala en el celular como app (PWA). |
| Escritorio | `desktop/` | La misma agenda empaquetada para Windows, Mac y Linux (Electron). Se puede usar **solo en la computadora, sin internet**, o **conectada al servidor**. |

### Usuarios y permisos
- **Administración**: todo, más crear usuarios y ver el registro de cambios.
- **Profesional**: agenda, pacientes, historia clínica, sesiones, pagos y configuración.
- **Secretaría**: agenda, datos personales de pacientes y pagos. **No recibe** la historia clínica ni las sesiones (el servidor no se las envía).

Cada alta, cambio o borrado queda registrado con usuario y hora (Configuración › Registro de cambios). Las contraseñas se guardan cifradas (scrypt) y hay bloqueo temporal tras varios intentos fallidos.

## Uso recomendado sin internet: computadora + celular por WiFi

La app de escritorio puede hacer de servidor dentro del consultorio. No hace falta contratar nada ni subir datos de pacientes a internet.

1. Instalá la app de escritorio en la computadora del consultorio (ver punto 3) y elegí **"En esta computadora y en el celular (por WiFi)"**.
2. Creá la cuenta de administración.
3. En Configuración › Conexión aparece un **código QR** y una dirección tipo `http://192.168.0.10:8080`.
4. Con el celular conectado al **mismo WiFi**, escaneá el QR o escribí esa dirección, e ingresá con tu usuario.
5. Para tenerla como app: Android › menú ⋮ › *Agregar a pantalla de inicio*; iPhone › Compartir › *Agregar a inicio*.

Límites de este modo: la computadora tiene que estar prendida y con la agenda abierta, y el celular solo funciona dentro de ese WiFi. Si la dirección cambia (porque el router le asigna otra a la compu), la pantalla de Conexión muestra la nueva. Los datos quedan en la carpeta de la app en la computadora: hacé copias desde Configuración › Datos y copias.

## 1. Poner el servidor en internet (opcional, para más adelante)

Recomendado: un servidor virtual (VPS) chico, por ejemplo DigitalOcean, Hetzner o Vultr, desde unos 5 USD por mes, con un dominio (por ejemplo `agenda.drapaulinalopez.com.ar`).

1. Instalá Docker en el servidor.
2. Copiá este repositorio y editá `docker-compose.yml`: cambiá `agenda.midominio.com` por tu dominio.
3. Apuntá el dominio a la IP del servidor (registro DNS tipo A).
4. Ejecutá `docker compose up -d`. Caddy saca solo el certificado HTTPS.
5. Entrá a `https://tu-dominio` y creá la cuenta de administración (solo se puede la primera vez).

Sin Docker: `npm start` con Node 22.13+ (variables `PORT` y `DATA_DIR`), detrás de un proxy con HTTPS.

### Copias de seguridad
Todo está en un solo archivo: `agenda.sqlite` dentro del volumen de datos. Copialo seguido a otro lugar (por ejemplo con un cron diario). Además, desde la app: Configuración › Datos y copias › Descargar copia.

## 2. Instalar en el celular
- **Android (Chrome)**: abrí la dirección del servidor → menú ⋮ → *Instalar app*.
- **iPhone (Safari)**: abrí la dirección → botón Compartir → *Agregar a pantalla de inicio*.

Queda con su ícono, abre sin barra del navegador y funciona sin señal.

## 3. App de escritorio
Los instaladores se arman solos en GitHub: pestaña **Actions** → *Pruebas y app de escritorio* → *Run workflow* (o publicando un tag `v1.0.0`). Al terminar, descargá el instalador de Windows (`.exe`), Mac (`.dmg`) o Linux (`.AppImage`).

Al abrirla por primera vez pregunta:
- **En esta computadora y en el celular (por WiFi)**: ver arriba.
- **Solo en este equipo**: funciona sin internet y los datos quedan en la computadora.
- **Conectada a un servidor**: escribís la dirección del servidor e ingresás con tu usuario.

Si empezás en modo "solo en este equipo", después podés conectarla a un servidor desde Configuración › Conexión y todo lo cargado se sube.

> Los instaladores no están firmados digitalmente: Windows puede mostrar "Windows protegió su PC" (Más información → Ejecutar de todos modos) y en Mac hay que abrirla con clic derecho → Abrir la primera vez.

Para probarla localmente: `cd desktop && npm install && npm start`.

## Probar en tu computadora
```bash
npm start           # abre el servidor en http://localhost:8080
npm test            # pruebas del servidor
```

## Datos de salud
La historia clínica digital está alcanzada por la Ley 26.529 (derechos del paciente e historia clínica) y la Ley 25.326 (protección de datos personales). Este sistema ayuda con control de acceso por usuario, registro de cambios y copias de seguridad, pero el uso responsable (contraseñas fuertes, HTTPS, copias guardadas, inscripción de la base ante la AAIP si corresponde) queda a cargo del consultorio.
