-- Agenda Salud: esquema inicial del MVP (RF-01 a RF-08)
create extension if not exists btree_gist;

create type public.rol_usuario as enum ('paciente', 'profesional');
create type public.estado_cita as enum ('confirmada', 'cancelada', 'completada', 'no_asistio');

-- RF-01: usuarios y roles ---------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_usuario not null default 'paciente',
  nombre text not null,
  email text,
  rut text,
  telefono text,
  fecha_nacimiento date,
  creado_en timestamptz not null default now()
);

-- RF-02: especialidades y profesionales ----------------------------------------
create table public.especialidades (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  slug text not null unique,
  activa boolean not null default true
);

insert into public.especialidades (nombre, slug, activa) values
  ('Matronería', 'matroneria', true),
  ('Nutrición', 'nutricion', false),
  ('Psicología', 'psicologia', false),
  ('Kinesiología', 'kinesiologia', false);

create table public.profesionales (
  id uuid primary key references public.perfiles (id) on delete cascade,
  especialidad_id smallint not null references public.especialidades (id),
  titulo text,
  registro_sis text,
  bio text,
  direccion text,
  comuna text,
  zona_horaria text not null default 'America/Santiago',
  horas_min_cambio smallint not null default 2 check (horas_min_cambio between 0 and 72),
  publicado boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  nombre text not null,
  descripcion text,
  duracion_min integer not null check (duracion_min between 10 and 240),
  precio integer check (precio >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create index on public.servicios (profesional_id);

-- Horario semanal en hora local del profesional (0 = domingo ... 6 = sábado)
create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  check (hora_fin > hora_inicio)
);
create index on public.horarios (profesional_id, dia_semana);

-- Vacaciones, feriados o bloques no disponibles
create table public.bloqueos (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz not null,
  motivo text,
  check (fin > inicio)
);
create index on public.bloqueos (profesional_id, inicio);

-- RF-03/04: citas, sin dobles reservas ------------------------------------------
create table public.citas (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  paciente_id uuid not null references public.perfiles (id) on delete cascade,
  servicio_id uuid references public.servicios (id) on delete set null,
  inicio timestamptz not null,
  fin timestamptz not null,
  estado public.estado_cita not null default 'confirmada',
  motivo text,
  cancelada_por uuid references public.perfiles (id),
  recordatorio_enviado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fin > inicio),
  constraint sin_dobles_citas_profesional exclude using gist (
    profesional_id with =, tstzrange(inicio, fin) with &&
  ) where (estado <> 'cancelada'),
  constraint sin_dobles_citas_paciente exclude using gist (
    paciente_id with =, tstzrange(inicio, fin) with &&
  ) where (estado <> 'cancelada')
);
create index on public.citas (profesional_id, inicio);
create index on public.citas (paciente_id, inicio);

-- RF-06/07: ficha clínica e historial ------------------------------------------
create table public.fichas (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  paciente_id uuid not null references public.perfiles (id) on delete cascade,
  antecedentes text,
  alergias text,
  medicamentos text,
  diagnostico text,
  tratamiento text,
  observaciones text,
  -- Datos gineco-obstétricos (matronería)
  gestas smallint check (gestas >= 0),
  partos smallint check (partos >= 0),
  abortos smallint check (abortos >= 0),
  cesareas smallint check (cesareas >= 0),
  fur date,
  metodo_anticonceptivo text,
  ultimo_pap date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (profesional_id, paciente_id)
);

create table public.atenciones (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas (id) on delete cascade,
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  paciente_id uuid not null references public.perfiles (id) on delete cascade,
  cita_id uuid references public.citas (id) on delete set null,
  fecha timestamptz not null default now(),
  motivo text,
  diagnostico text,
  indicaciones text,
  notas text,
  creado_en timestamptz not null default now()
);
create index on public.atenciones (ficha_id, fecha desc);

-- RF-08: registro de notificaciones enviadas -------------------------------------
create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid references public.citas (id) on delete cascade,
  destinatario text not null,
  tipo text not null,
  ok boolean not null,
  error text,
  creado_en timestamptz not null default now()
);

-- Funciones auxiliares ----------------------------------------------------------
create function public.es_profesional() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'profesional');
$$;

-- Crea el perfil al registrarse. El rol viene de los metadatos del registro.
create function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, rol, nombre, email, telefono, rut)
  values (
    new.id,
    case when new.raw_user_meta_data->>'rol' = 'profesional' then 'profesional'::public.rol_usuario
         else 'paciente'::public.rol_usuario end,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'rut'
  );
  if new.raw_user_meta_data->>'rol' = 'profesional' then
    insert into public.profesionales (id, especialidad_id)
    values (new.id, (select id from public.especialidades where slug = 'matroneria'));
  end if;
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

create function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;
create trigger citas_actualizado before update on public.citas
  for each row execute function public.tocar_actualizado();
create trigger fichas_actualizado before update on public.fichas
  for each row execute function public.tocar_actualizado();

-- ¿Cabe [inicio, fin) dentro del horario del profesional, sin bloqueos ni otras citas?
create function public.bloque_valido(
  p_profesional uuid, p_inicio timestamptz, p_fin timestamptz, p_excluir_cita uuid default null
) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz text;
  v_ini_local timestamp;
  v_fin_local timestamp;
begin
  select zona_horaria into v_tz from public.profesionales where id = p_profesional;
  if v_tz is null then return false; end if;
  v_ini_local := p_inicio at time zone v_tz;
  v_fin_local := p_fin at time zone v_tz;
  if v_ini_local::date <> v_fin_local::date and v_fin_local::time <> '00:00' then
    return false;
  end if;
  return exists (
      select 1 from public.horarios h
      where h.profesional_id = p_profesional
        and h.dia_semana = extract(dow from v_ini_local)
        and h.hora_inicio <= v_ini_local::time
        and h.hora_fin >= v_fin_local::time
    )
    and not exists (
      select 1 from public.bloqueos b
      where b.profesional_id = p_profesional
        and tstzrange(b.inicio, b.fin) && tstzrange(p_inicio, p_fin)
    )
    and not exists (
      select 1 from public.citas c
      where c.profesional_id = p_profesional
        and c.estado <> 'cancelada'
        and (p_excluir_cita is null or c.id <> p_excluir_cita)
        and tstzrange(c.inicio, c.fin) && tstzrange(p_inicio, p_fin)
    );
end;
$$;

-- Bloques libres de un día para un servicio (RF-03)
create function public.bloques_disponibles(p_servicio uuid, p_fecha date)
returns table (inicio timestamptz, fin timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_srv record;
  v_tz text;
begin
  select s.*, p.zona_horaria, p.publicado into v_srv
  from public.servicios s join public.profesionales p on p.id = s.profesional_id
  where s.id = p_servicio and s.activo;
  if not found then return; end if;
  if not v_srv.publicado and v_srv.profesional_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) then
    return;
  end if;
  v_tz := v_srv.zona_horaria;

  return query
  select g.ini, g.ini + make_interval(mins => v_srv.duracion_min)
  from public.horarios h,
  lateral (
    select ((p_fecha + t)::timestamp at time zone v_tz) as ini
    from generate_series(
      h.hora_inicio::interval,
      h.hora_fin::interval - make_interval(mins => v_srv.duracion_min),
      make_interval(mins => v_srv.duracion_min)
    ) as t
  ) g
  where h.profesional_id = v_srv.profesional_id
    and h.dia_semana = extract(dow from p_fecha)
    and g.ini > now() + interval '30 minutes'
    and public.bloque_valido(v_srv.profesional_id, g.ini, g.ini + make_interval(mins => v_srv.duracion_min))
  order by 1;
end;
$$;

-- Reservar (RF-03): la paciente autenticada reserva un bloque
create function public.reservar_cita(p_servicio uuid, p_inicio timestamptz, p_motivo text default null)
returns public.citas
language plpgsql security definer set search_path = '' as $$
declare
  v_srv record;
  v_fin timestamptz;
  v_cita public.citas;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select s.*, p.publicado into v_srv
  from public.servicios s join public.profesionales p on p.id = s.profesional_id
  where s.id = p_servicio and s.activo;
  if not found or not v_srv.publicado then raise exception 'Servicio no disponible'; end if;
  if v_srv.profesional_id = auth.uid() then raise exception 'No puedes reservar contigo misma'; end if;
  if p_inicio < now() + interval '30 minutes' then raise exception 'El horario ya no está disponible'; end if;
  v_fin := p_inicio + make_interval(mins => v_srv.duracion_min);
  if not public.bloque_valido(v_srv.profesional_id, p_inicio, v_fin) then
    raise exception 'El horario ya no está disponible';
  end if;
  insert into public.citas (profesional_id, paciente_id, servicio_id, inicio, fin, motivo)
  values (v_srv.profesional_id, auth.uid(), p_servicio, p_inicio, v_fin, left(p_motivo, 500))
  returning * into v_cita;
  return v_cita;
exception
  when exclusion_violation then
    raise exception 'El horario ya no está disponible';
end;
$$;

-- Cancelar (RF-04): paciente o profesional
create function public.cancelar_cita(p_cita uuid)
returns public.citas
language plpgsql security definer set search_path = '' as $$
declare
  v_cita public.citas;
  v_horas smallint;
begin
  select * into v_cita from public.citas where id = p_cita for update;
  if not found or auth.uid() not in (v_cita.paciente_id, v_cita.profesional_id) then
    raise exception 'Cita no encontrada';
  end if;
  if v_cita.estado <> 'confirmada' then raise exception 'La cita ya no está activa'; end if;
  if auth.uid() = v_cita.paciente_id then
    select horas_min_cambio into v_horas from public.profesionales where id = v_cita.profesional_id;
    if v_cita.inicio < now() + make_interval(hours => v_horas) then
      raise exception 'Solo puedes cancelar hasta % horas antes. Contacta a tu profesional.', v_horas;
    end if;
  end if;
  update public.citas set estado = 'cancelada', cancelada_por = auth.uid()
  where id = p_cita returning * into v_cita;
  return v_cita;
end;
$$;

-- Reprogramar (RF-04): mueve la cita a otro bloque libre del mismo servicio
create function public.reprogramar_cita(p_cita uuid, p_inicio timestamptz)
returns public.citas
language plpgsql security definer set search_path = '' as $$
declare
  v_cita public.citas;
  v_horas smallint;
  v_fin timestamptz;
begin
  select * into v_cita from public.citas where id = p_cita for update;
  if not found or auth.uid() not in (v_cita.paciente_id, v_cita.profesional_id) then
    raise exception 'Cita no encontrada';
  end if;
  if v_cita.estado <> 'confirmada' then raise exception 'La cita ya no está activa'; end if;
  if auth.uid() = v_cita.paciente_id then
    select horas_min_cambio into v_horas from public.profesionales where id = v_cita.profesional_id;
    if v_cita.inicio < now() + make_interval(hours => v_horas) then
      raise exception 'Solo puedes cambiar la hora hasta % horas antes. Contacta a tu profesional.', v_horas;
    end if;
  end if;
  if p_inicio < now() + interval '30 minutes' then raise exception 'El horario ya no está disponible'; end if;
  v_fin := p_inicio + (v_cita.fin - v_cita.inicio);
  if not public.bloque_valido(v_cita.profesional_id, p_inicio, v_fin, p_cita) then
    raise exception 'El horario ya no está disponible';
  end if;
  update public.citas set inicio = p_inicio, fin = v_fin, recordatorio_enviado_en = null
  where id = p_cita returning * into v_cita;
  return v_cita;
exception
  when exclusion_violation then
    raise exception 'El horario ya no está disponible';
end;
$$;

-- El profesional marca la cita como completada o inasistencia (RF-05)
create function public.marcar_cita(p_cita uuid, p_estado public.estado_cita)
returns public.citas
language plpgsql security definer set search_path = '' as $$
declare
  v_cita public.citas;
begin
  if p_estado not in ('completada', 'no_asistio', 'confirmada') then
    raise exception 'Estado no permitido';
  end if;
  update public.citas set estado = p_estado
  where id = p_cita and profesional_id = auth.uid() and estado <> 'cancelada'
  returning * into v_cita;
  if not found then raise exception 'Cita no encontrada'; end if;
  return v_cita;
end;
$$;

-- Seguridad por filas (RLS) -------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.especialidades enable row level security;
alter table public.profesionales enable row level security;
alter table public.servicios enable row level security;
alter table public.horarios enable row level security;
alter table public.bloqueos enable row level security;
alter table public.citas enable row level security;
alter table public.fichas enable row level security;
alter table public.atenciones enable row level security;
alter table public.notificaciones enable row level security;

-- perfiles
create policy "ver mi perfil" on public.perfiles for select to authenticated
  using (id = (select auth.uid()));
create policy "ver perfiles de profesionales publicados" on public.perfiles for select to anon, authenticated
  using (exists (select 1 from public.profesionales p where p.id = perfiles.id and p.publicado));
create policy "profesional ve a sus pacientes" on public.perfiles for select to authenticated
  using (
    exists (select 1 from public.citas c where c.paciente_id = perfiles.id and c.profesional_id = (select auth.uid()))
    or exists (select 1 from public.fichas f where f.paciente_id = perfiles.id and f.profesional_id = (select auth.uid()))
  );
create policy "paciente ve a sus profesionales" on public.perfiles for select to authenticated
  using (exists (select 1 from public.citas c where c.profesional_id = perfiles.id and c.paciente_id = (select auth.uid())));
create policy "editar mi perfil" on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- El rol y el email no se pueden cambiar desde el cliente
revoke update on public.perfiles from authenticated, anon;
grant update (nombre, rut, telefono, fecha_nacimiento) on public.perfiles to authenticated;

-- especialidades
create policy "especialidades públicas" on public.especialidades for select to anon, authenticated using (true);

-- profesionales
create policy "ver profesionales publicados" on public.profesionales for select to anon, authenticated
  using (publicado or id = (select auth.uid()));
create policy "paciente ve a sus profesionales" on public.profesionales for select to authenticated
  using (exists (select 1 from public.citas c where c.profesional_id = profesionales.id and c.paciente_id = (select auth.uid())));
create policy "editar mi ficha profesional" on public.profesionales for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profesionales from authenticated, anon;
grant update (titulo, registro_sis, bio, direccion, comuna, horas_min_cambio, publicado) on public.profesionales to authenticated;

-- servicios y horarios: públicos si el profesional está publicado; editables por su dueña
create policy "ver servicios" on public.servicios for select to anon, authenticated
  using (
    profesional_id = (select auth.uid())
    or (activo and exists (select 1 from public.profesionales p where p.id = servicios.profesional_id and p.publicado))
    or exists (select 1 from public.citas c where c.servicio_id = servicios.id and c.paciente_id = (select auth.uid()))
  );
create policy "gestionar mis servicios" on public.servicios for all to authenticated
  using (profesional_id = (select auth.uid())) with check (profesional_id = (select auth.uid()) and public.es_profesional());

create policy "ver horarios" on public.horarios for select to anon, authenticated
  using (
    profesional_id = (select auth.uid())
    or exists (select 1 from public.profesionales p where p.id = horarios.profesional_id and p.publicado)
  );
create policy "gestionar mis horarios" on public.horarios for all to authenticated
  using (profesional_id = (select auth.uid())) with check (profesional_id = (select auth.uid()) and public.es_profesional());

create policy "gestionar mis bloqueos" on public.bloqueos for all to authenticated
  using (profesional_id = (select auth.uid())) with check (profesional_id = (select auth.uid()) and public.es_profesional());

-- citas: solo lectura directa; los cambios pasan por las funciones de arriba
create policy "ver mis citas" on public.citas for select to authenticated
  using (paciente_id = (select auth.uid()) or profesional_id = (select auth.uid()));

-- fichas y atenciones: solo la profesional tratante
create policy "gestionar mis fichas" on public.fichas for all to authenticated
  using (profesional_id = (select auth.uid()))
  with check (
    profesional_id = (select auth.uid())
    and public.es_profesional()
    and exists (select 1 from public.citas c where c.paciente_id = fichas.paciente_id and c.profesional_id = (select auth.uid()))
  );
create policy "gestionar mis atenciones" on public.atenciones for all to authenticated
  using (profesional_id = (select auth.uid()))
  with check (
    profesional_id = (select auth.uid())
    and exists (select 1 from public.fichas f where f.id = atenciones.ficha_id and f.profesional_id = (select auth.uid()) and f.paciente_id = atenciones.paciente_id)
  );

-- notificaciones: solo el servidor (service role) escribe; nadie lee desde el cliente

-- Las funciones de servidor no deben llamarse sin sesión
revoke execute on function public.reservar_cita(uuid, timestamptz, text) from anon, public;
revoke execute on function public.cancelar_cita(uuid) from anon, public;
revoke execute on function public.reprogramar_cita(uuid, timestamptz) from anon, public;
revoke execute on function public.marcar_cita(uuid, public.estado_cita) from anon, public;
revoke execute on function public.bloque_valido(uuid, timestamptz, timestamptz, uuid) from anon, authenticated, public;
revoke execute on function public.crear_perfil() from anon, authenticated, public;
grant execute on function public.reservar_cita(uuid, timestamptz, text) to authenticated;
grant execute on function public.cancelar_cita(uuid) to authenticated;
grant execute on function public.reprogramar_cita(uuid, timestamptz) to authenticated;
grant execute on function public.marcar_cita(uuid, public.estado_cita) to authenticated;
grant execute on function public.bloques_disponibles(uuid, date) to anon, authenticated;
