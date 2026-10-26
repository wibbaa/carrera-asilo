# LANDING PAGE — CARRERA 4KM CON CAUSA + CARRERA DE BOTARGAS

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
