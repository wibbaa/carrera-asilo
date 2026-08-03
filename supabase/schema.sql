-- ============================================================
-- Nogales Altruistamente Locos — 4K con Causa + Carrera de Botargas
-- Esquema de Supabase (ejecutar completo en el SQL Editor)
-- ============================================================

-- 1) Tabla principal de registros
create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  modalidad text not null check (modalidad in ('4k', 'botargas')),
  nombre text not null,
  apellidos text not null,
  telefono text not null,
  edad int not null check (edad between 5 and 99),
  metodo_pago text not null check (metodo_pago in ('transferencia', 'panales')),
  comprobante_path text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado')),
  created_at timestamptz not null default now()
);

create index if not exists registros_modalidad_idx on public.registros (modalidad);
create index if not exists registros_estado_idx on public.registros (estado);

-- Si ya habías corrido este schema antes (con email/contacto de emergencia),
-- esto los quita sin tronar nada. Si es tu primera vez, no hace nada.
alter table public.registros
  drop column if exists email,
  drop column if exists contacto_emergencia_nombre,
  drop column if exists contacto_emergencia_telefono;

-- 2) Contador atómico de folios por modalidad
create table if not exists public.folio_counters (
  modalidad text primary key,
  contador int not null default 0
);

insert into public.folio_counters (modalidad, contador) values ('4k', 0), ('botargas', 0)
  on conflict (modalidad) do nothing;

-- Prefijos de folio por modalidad
create or replace function public.prefijo_folio(p_modalidad text)
returns text
language sql
immutable
as $$
  select case p_modalidad when '4k' then '4K' when 'botargas' then 'BOT' else upper(p_modalidad) end;
$$;

-- Genera el siguiente folio de forma atómica (evita duplicados en registros simultáneos)
create or replace function public.generar_folio(p_modalidad text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
begin
  update public.folio_counters
     set contador = contador + 1
   where modalidad = p_modalidad
   returning contador into v_next;

  if v_next is null then
    raise exception 'Modalidad inválida: %', p_modalidad;
  end if;

  return public.prefijo_folio(p_modalidad) || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- Cualquiera (incluido anónimo) puede ejecutar la función para registrarse
grant execute on function public.generar_folio(text) to anon, authenticated;

-- 3) Vista pública limitada (para que la página de confirmación pueda
--    recuperar un folio tras un refresh, sin exponer datos sensibles)
create or replace view public.registros_publicos as
  select folio, modalidad, nombre, apellidos, estado, created_at
  from public.registros;

-- 4) Row Level Security
alter table public.registros enable row level security;
alter table public.folio_counters enable row level security;

-- Cualquiera puede insertar un registro (el formulario público)
drop policy if exists "Insertar registro publico" on public.registros;
create policy "Insertar registro publico"
  on public.registros for insert
  to anon, authenticated
  with check (estado = 'pendiente');

-- Solo usuarios autenticados (el equipo admin) pueden ver todos los datos
drop policy if exists "Admin puede ver todo" on public.registros;
create policy "Admin puede ver todo"
  on public.registros for select
  to authenticated
  using (true);

-- Solo usuarios autenticados pueden actualizar el estado
drop policy if exists "Admin puede actualizar" on public.registros;
create policy "Admin puede actualizar"
  on public.registros for update
  to authenticated
  using (true)
  with check (true);

-- La vista pública hereda de la tabla; permitimos select a todos sobre la vista
grant select on public.registros_publicos to anon, authenticated;

-- 5) Storage: bucket para comprobantes (crea el bucket desde el dashboard
--    Storage > New bucket > name: "comprobantes" > Public: NO)
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Cualquiera puede subir su comprobante (insert), nadie puede listar/leer
-- directamente salvo el admin autenticado (via signed URLs desde el panel)
drop policy if exists "Subir comprobante publico" on storage.objects;
create policy "Subir comprobante publico"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'comprobantes');

drop policy if exists "Admin lee comprobantes" on storage.objects;
create policy "Admin lee comprobantes"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprobantes');

-- 6) Verificación por WhatsApp (flujo invertido: el usuario envía el
--    mensaje al número del evento, en vez de que el evento le escriba a
--    él — así evitamos que WhatsApp marque el número organizador como spam)
alter table public.registros
  add column if not exists whatsapp_click_at timestamptz,
  add column if not exists whatsapp_verificado boolean not null default false;

-- El botón de "Confirmar por WhatsApp" en la página de confirmación llama
-- esta función (por folio) justo antes de abrir el link de wa.me. Solo
-- toca esa columna puntual, sin dar permiso de UPDATE abierto a anónimos.
create or replace function public.marcar_whatsapp_click(p_folio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.registros
     set whatsapp_click_at = now()
   where folio = p_folio;
end;
$$;

grant execute on function public.marcar_whatsapp_click(text) to anon, authenticated;

-- ============================================================
-- 7) Crea tu usuario admin desde:
--    Authentication > Users > Add user (email + password)
--    Con eso ya puedes entrar a /admin en la app.
-- ============================================================
