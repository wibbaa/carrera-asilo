# Registro — 4K con Causa + Carrera de Botargas

App de registro para el evento de **Nogales Altruistamente Locos** a beneficio del
**Asilo de Ancianos Franciscano I.A.P.** (viernes 21 de agosto, 7:00 p.m., Unidad
Deportiva Estrellas Nogalenses).

Stack: **React + Vite + Supabase** (Postgres, Auth, Storage), deploy en **Vercel**.

## Qué incluye

- **Landing** (`/`) con info del evento, countdown y las dos modalidades.
- **Registro** (`/registro`) es un wizard de 3 pasos, no un formulario largo de un jalón:
  1. **Tus datos** → modalidad + datos personales + contacto de emergencia.
  2. **Pago** → banco/CLABE (4K) o instrucciones de donación (Botargas) + subir
     comprobante. Aquí es donde realmente se genera el folio y se sube el
     archivo — si algo falla, el usuario se queda en este paso y puede
     reintentar sin perder lo que ya llenó.
  3. **Tu folio** → se muestra el folio ya generado (ticket tipo dorsal) y
     recién ahí se habilita el botón para confirmar por WhatsApp.
- **Confirmación** (`/confirmacion?folio=...`) — página de respaldo para
  recuperar el folio si el usuario cierra la pestaña; no es parte del flujo
  principal (que ahora vive todo dentro de `/registro`), pero queda viva por
  si alguien pierde su folio y regresa por otro medio.
- **Admin** (`/admin`) → login protegido, tabla de todos los registros con
  filtros, buscador, ver comprobante (URL firmada temporal) y botones para
  confirmar/rechazar pago.

## Verificación por WhatsApp (flujo invertido, anti-spam)

Como ya les pasó que el número organizador se marcó como spam al mandar
mensajes de confirmación a cada corredor, aquí el flujo se invierte:

1. En `/confirmacion`, el registrado ve un botón **"Confirmar mis datos por
   WhatsApp"**. Al darle clic se abre WhatsApp con un mensaje ya escrito
   (folio, nombre, modalidad, teléfono) dirigido al número del evento — el
   usuario solo le da enviar.
2. Ese clic queda guardado como `whatsapp_click_at` en la base (vía la
   función `marcar_whatsapp_click`), como pista de que sí intentó mandarlo —
   no es prueba de que llegó, solo un indicador para el equipo.
3. En `/admin`, cuando el mensaje de WhatsApp efectivamente llega y cuadra
   con el folio, el equipo le da **"Verificar"** en la columna de WhatsApp.

Esto evita que el número del evento mande mensajes salientes en volumen (lo
que causaba los bloqueos) — ahora son los propios usuarios quienes inician
la conversación, uno por uno, desde sus números.

## 1. Crea tu proyecto de Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**.
2. En **SQL Editor**, pega y corre todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Esto crea la tabla `registros`, el contador de folios, las políticas de
   seguridad (RLS) y el bucket de storage `comprobantes`.
3. Verifica en **Storage** que el bucket `comprobantes` haya quedado creado
   (privado, no público — el admin lo lee con URLs firmadas).
4. En **Authentication → Users → Add user**, crea el usuario del equipo
   organizador (correo + contraseña). Con eso entras a `/admin`. Puedes crear
   uno por cada persona que vaya a confirmar pagos.
5. En **Project Settings → API**, copia el **Project URL** y el **anon public key**.

## 2. Configura las variables de entorno

Copia `.env.example` a `.env` y llena tus datos de Supabase:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Completa los datos bancarios para la modalidad 4K

En `src/pages/Registro.jsx` busca el bloque `[completar]` (banco, CLABE,
nombre del titular) y ponle tus datos reales de la cuenta donde van a caer
las transferencias SPEI. Ahorita está en blanco a propósito — no invento
datos bancarios por ti.

## 4. Corre local

```bash
npm install
npm run dev
```

## 5. Deploy a Vercel

1. Sube este proyecto a un repo de GitHub.
2. En Vercel: **New Project** → importa el repo.
3. En **Environment Variables**, agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (las mismas del `.env`).
4. Deploy. El archivo `vercel.json` ya incluye el rewrite para que las rutas
   de React Router (`/registro`, `/admin`, etc.) funcionen al recargar.

## Cosas para ajustar antes de lanzar

- [ ] Datos bancarios reales en el formulario (paso 3 de arriba).
- [ ] Fecha/hora en `src/lib/eventConfig.js` si algo cambia.
- [ ] Revisa el límite de tamaño de archivo del bucket `comprobantes` en
      Supabase Storage si vas a permitir fotos pesadas (por default Supabase
      deja hasta 50 MB en el plan gratuito, de sobra para esto).
- [ ] Si esperas mucho volumen, considera agregar un correo/WhatsApp
      automático de confirmación (se puede hacer con una Supabase Edge
      Function + Resend/WhatsApp Business API — avísame si lo quieres y te
      lo agrego).

## Estructura

```
src/
  components/     Header, Footer
  lib/            cliente de Supabase, config del evento, countdown hook
  pages/          Home, Registro, Confirmacion, Admin
supabase/
  schema.sql      Todo el backend: tablas, RLS, folios, storage
```
