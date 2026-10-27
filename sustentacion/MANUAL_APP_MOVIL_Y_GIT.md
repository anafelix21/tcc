# 📱 Manual — App Móvil conectada a la nube + Git en una PC nueva

Paso a paso para: **(1)** preparar Git en una PC (borrar credenciales viejas y poner las tuyas), **(2)** bajar el proyecto (clonar o ZIP), **(3)** conectar la app móvil a los backends en AWS y **(4)** levantarla en el celular.

---

## 1. 🔐 Git: borrar credenciales viejas y poner las tuyas

Hazlo **siempre que uses una PC del laboratorio o prestada**: si quedó la sesión de otra persona, tus commits saldrán a su nombre o GitHub te rechazará el push.

### 1.1 Ver quién está configurado
```bash
git config --global user.name
git config --global user.email
```

### 1.2 Borrar las credenciales guardadas de GitHub (Windows)
**Opción A — con la ventana de Windows (más fácil):**
1. Menú Inicio → busca **"Administrador de credenciales"** → ábrelo.
2. Pestaña **Credenciales de Windows**.
3. En "Credenciales genéricas" busca las que digan **`git:https://github.com`** (o `github.com`).
4. Clic en la flecha → **Quitar** → **Sí**.

**Opción B — con comandos (PowerShell):**
```powershell
cmdkey /list | findstr /i github
```
```powershell
cmdkey /delete:git:https://github.com
```
**Opción C — desde Git:**
```bash
printf "protocol=https\nhost=github.com\n\n" | git credential reject
```

### 1.3 Poner tu nombre y correo
El **nombre** y el **correo** son los que aparecen en cada commit. Usa los de tu cuenta de GitHub:
```bash
git config --global user.name "anafelix21"
git config --global user.email "ana.felix@vallegrande.edu.pe"
```
Comprobar:
```bash
git config --global --list
```
> La **contraseña no se escribe aquí**. La primera vez que hagas `git push`, se abre el navegador para iniciar sesión en GitHub (o te pide un **token**). Usa tu cuenta.

### 1.4 Al terminar en una PC que no es tuya
Borra tus credenciales otra vez (paso 1.2) y tu identidad:
```bash
git config --global --unset user.name
git config --global --unset user.email
```

---

## 2. 📥 Bajar el proyecto de la app móvil

El código está en la rama **`develop`** (en `main` solo está el README).

### 2.1 Opción normal: clonar
```bash
cd C:/dev
git clone -b develop https://github.com/vallegrande/ASE251S4_T05-mo.git
cd ASE251S4_T05-mo
```
> Usa una carpeta **corta y sin espacios ni tildes** (`C:\dev`). Las rutas largas de OneDrive o "Imágenes" dan errores de *Filename too long* y npm falla.

### 2.2 Si NO puedes clonar → descargar ZIP
1. Abre https://github.com/vallegrande/ASE251S4_T05-mo
2. Arriba a la izquierda cambia la rama de **`main`** a **`develop`** ⚠️ (si bajas `main` solo viene el README).
3. Botón verde **Code → Download ZIP**.
4. Extrae el ZIP en `C:\dev\` (no en Descargas ni en OneDrive).
5. Entra a la carpeta extraída (se llama `ASE251S4_T05-mo-develop`):
```bash
cd C:/dev/ASE251S4_T05-mo-develop
```

### 2.3 Si quedaron cosas antiguas y no deja ejecutar (limpieza total)
Pasa cuando copias una carpeta vieja, cambias de versión o se cortó un `npm install`. Borra lo generado y vuelve a instalar:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules, .expo -ErrorAction SilentlyContinue
```
```powershell
npm cache clean --force
```
```powershell
npm install --legacy-peer-deps
```
```powershell
npx expo start -c
```

**Git Bash:**
```bash
rm -rf node_modules .expo && npm cache clean --force && npm install --legacy-peer-deps && npx expo start -c
```

| Problema | Solución |
| :-- | :-- |
| `npm ERR! ERESOLVE` (conflicto de dependencias) | `npm install --legacy-peer-deps` |
| `EPERM` / `operation not permitted` al borrar | Cierra VS Code y la terminal que tenga Expo abierto, y repite |
| `Filename too long` | Mueve el proyecto a `C:\dev` y repite |
| La app sigue llamando a la IP vieja | `npx expo start -c` (la `-c` borra la caché) |
| Expo Go dice *"Project is incompatible with this version of Expo Go"* | Actualiza **Expo Go** desde la Play Store / App Store |
| `node` no se reconoce | Instala **Node.js 20 o superior** (LTS) desde nodejs.org y reabre la terminal |

---

## 3. 🌐 Conectar la app (en tu PC) con los backends en la nube

La app **no se conecta a la base de datos**: llama a los backends por HTTP. Solo hay que poner sus direcciones en el archivo **`.env`** de la raíz del proyecto.

### 3.1 ¿Qué IP y qué puerto?

| Despliegue | IP a usar | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_ANALYTICS_URL` |
| :-- | :-- | :-- | :-- |
| **Taller Cloud Computing** | Public IPv4 de **`cc-backends`** | `http://<IP>:8081/api` | `http://<IP>:5000/api/v1/analytics` |
| **Kubernetes (orquestadores)** | Public IPv4 de **cualquier nodo** (o la IP elástica del master) | `http://<IP>:30001/api` | `http://<IP>:30002/api/v1/analytics` |
| Local (backends en tu PC, misma wifi) | IP de tu PC (`ipconfig` → IPv4) | `http://<IP>:8081/api` | `http://<IP>:5000/api/v1/analytics` |

> En Kubernetes los puertos NodePort (30001, 30002) responden en **cualquier** nodo del clúster, así que puedes usar **una sola IP** para los dos backends.

### 3.2 Paso a paso
1. **EC2 → Instances** → marca la EC2 de la tabla → copia la **Public IPv4 address**.
2. Abre el archivo **`.env`** (si no existe, copia `.env.example` y renómbralo a `.env`).
3. Déjalo así (ejemplo con el Taller, IP `3.217.104.30`):
```env
EXPO_PUBLIC_API_URL=http://3.217.104.30:8081/api
EXPO_PUBLIC_ANALYTICS_URL=http://3.217.104.30:5000/api/v1/analytics
```
   Reglas: **`http://`** (no `https`), **sin espacios**, **sin `/` al final**, y debe terminar en `/api` y `/api/v1/analytics`.
4. **Prueba antes de abrir la app.** En el navegador del celular o de la PC:
   - `http://3.217.104.30:8081/api/parcelas` → debe mostrar JSON.
   - `http://3.217.104.30:5000/health` → debe decir `UP`.
   Si no abre: revisa que la EC2 esté **Running**, que el grupo de seguridad tenga **8081 y 5000** (Taller) o **30000-30002** (Kubernetes) abiertos, y que la IP no haya cambiado (cambia al reiniciar el Learner Lab).
5. Guarda el `.env` y **reinicia Expo con caché limpia** (obligatorio, porque las variables `EXPO_PUBLIC_` se leen al compilar):
```bash
npx expo start -c
```

---

## 4. ▶️ Levantar la app en el celular

### 4.1 Requisitos
- **Node.js 20 o superior** en la PC (`node -v`).
- App **Expo Go** instalada y actualizada en el celular (Play Store / App Store).

### 4.2 Comandos (en la carpeta del proyecto)
```bash
npm install --legacy-peer-deps
```
```bash
npx expo start -c
```
Aparece un **código QR** en la terminal:
- **Android:** abre **Expo Go** → *Scan QR code*.
- **iPhone:** abre la **cámara** y apunta al QR.

Otras teclas en la terminal de Expo:
| Tecla | Qué hace |
| :-: | :-- |
| `w` | Abre la app en el **navegador** (útil si no hay celular) |
| `a` | Abre en un emulador Android (si tienes Android Studio) |
| `r` | Recarga la app |
| `Ctrl + C` | Detiene Expo |

### 4.3 Si el celular no carga la app (se queda en "Opening project…")
Tu PC y tu celular deben estar en la **misma red wifi**. Si la red del laboratorio no lo permite, usa el **túnel**:
```bash
npx expo start -c --tunnel
```
> Esto solo afecta a cómo el celular descarga la app desde tu PC. Los datos siempre van directo a AWS por la IP del `.env`.

### 4.4 Verificar que está conectada a la nube
1. Inicia sesión (o entra como invitado).
2. Abre **Parcelas** → debe mostrar la lista de la base de datos (160 parcelas).
3. Registra una parcela desde la app → búscala en Swagger (`GET /api/parcelas`) o en el frontend web: es la **misma base de datos** en AWS.
4. Abre el **Dashboard** → los gráficos vienen del Backend 2 analítico.

---

## 5. ✅ Resumen rápido (copiar y pegar)

```bash
cd C:/dev
git clone -b develop https://github.com/vallegrande/ASE251S4_T05-mo.git
cd ASE251S4_T05-mo
npm install --legacy-peer-deps
```
Editar `.env` con la IP pública (paso 3.2), y luego:
```bash
npx expo start -c
```
Escanear el QR con **Expo Go**.
