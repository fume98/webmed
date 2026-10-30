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

## Versión web en internet con Railway (lo más simple, sin comandos)

1. Hacé el Merge de las PR pendientes: Railway publica lo que está en `main`.
2. Entrá a [railway.com](https://railway.com) e ingresá con tu cuenta de GitHub.
3. **New Project › Deploy from GitHub repo** y elegí `webmed` (si no aparece, tocá *Configure GitHub App* y dale acceso a ese repositorio). Railway detecta el `Dockerfile` solo.
4. En el servicio, agregá un **Volume** (disco) con *Mount path* `/data`. Ahí se guardan los datos. Sin esto se borrarían en cada actualización.
5. En **Settings › Networking** tocá **Generate Domain**. Te da una dirección tipo `https://webmed-production.up.railway.app`.
6. Abrí esa dirección y creá la cuenta de administración. Después, en Configuración › Usuarios, creá los demás.
7. En cada PC y celular, abrí la dirección e instalala desde el navegador (Chrome: ícono *Instalar*; iPhone: Compartir › *Agregar a inicio*).

Costo: Railway da 5 USD de prueba gratis; después el plan Hobby cuesta 5 USD por mes, y el disco cuesta 0,15 USD por GB al mes. Cada vez que se actualiza `main`, Railway se actualiza solo. Para usar un dominio propio: Settings › Networking › *Custom Domain*.

## Versión web en internet con Render (alternativa a Railway)
1. Creá una cuenta en https://render.com con **Sign in with GitHub** y dale acceso al repositorio `webmed`.
2. En el panel: **New › Blueprint** › elegí `webmed` › **Apply**. Render lee `render.yaml` y crea todo solo: el servidor y un disco de 1 GB en `/data` para los datos y los documentos.
3. Pide una tarjeta: el plan *Starter* cuesta USD 7 por mes, más unos centavos por el disco. El plan gratis no sirve porque no tiene disco y se perderían los datos.
4. Cuando termine (unos 5 minutos), arriba aparece la dirección `https://agenda-dra-lopez.onrender.com`. Ese es el link para la PC, el celular y la web. Entrá y creá la cuenta de administración.
5. Cada cambio que se una a `main` se publica solo.

## Ver la agenda en Google Calendar

En **Configuración › Google Calendar** cada usuario (administración o profesional) obtiene un enlace privado `/api/cal/<clave>.ics`. Con **Agregar a Google Calendar** aparece como un calendario aparte, también en el celular.

- Es solo de ida: los turnos van de la plataforma a Google Calendar; los eventos de Google no entran a la plataforma.
- Google lo actualiza cada algunas horas (no es al instante). Incluye los turnos de los últimos 3 meses en adelante, sin los cancelados.
- Necesita el servidor publicado en internet (Render, VPS). En modo "solo en este equipo" o por WiFi Google no puede leerlo.
- Quien tenga el enlace ve los turnos: **Generar enlace nuevo** anula el anterior.

## 1. Poner el servidor en un VPS propio (alternativa avanzada)

Recomendado: un servidor virtual (VPS) chico, por ejemplo DigitalOcean, Hetzner o Vultr, desde unos 5 USD por mes, con un dominio (por ejemplo `agenda.drapaulinalopez.com.ar`).

1. Instalá Docker en el servidor.
2. Copiá este repositorio y editá `docker-compose.yml`: cambiá `agenda.midominio.com` por tu dominio.
3. Apuntá el dominio a la IP del servidor (registro DNS tipo A).
4. Ejecutá `docker compose up -d`. Caddy saca solo el certificado HTTPS.
5. Entrá a `https://tu-dominio` y creá la cuenta de administración (solo se puede la primera vez).

Sin Docker: `npm start` con Node 22.13+ (variables `PORT` y `DATA_DIR`), detrás de un proxy con HTTPS.

### Copias de seguridad
Los datos están en `agenda.sqlite` y los documentos adjuntos de las sesiones en la carpeta `files/`, ambos dentro del volumen de datos. Copiá la carpeta completa seguido a otro lugar (por ejemplo con un cron diario). La copia que se descarga desde la app (Configuración › Datos y copias) guarda los datos pero no los archivos adjuntos.

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
