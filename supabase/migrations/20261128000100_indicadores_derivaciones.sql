-- CU-10 (RF-09): indicadores básicos del profesional ---------------------------------
-- Cuenta citas por estado en un rango de fechas (hora de Chile), pacientes atendidos y
-- fichas completas (con diagnóstico y al menos una atención). Corre con los permisos de
-- quien llama (security invoker), así que RLS limita todo a sus propias citas y fichas.
create function public.indicadores_profesional(p_desde date, p_hasta date)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with c as (
    select estado, paciente_id
    from public.citas
    where profesional_id = (select auth.uid())
      and inicio >= (p_desde::timestamp at time zone 'America/Santiago')
      and inicio < ((p_hasta + 1)::timestamp at time zone 'America/Santiago')
  ),
  atendidos as (select distinct paciente_id from c where estado = 'completada')
  select jsonb_build_object(
    'agendadas', (select count(*) from c),
    'confirmadas', (select count(*) from c where estado = 'confirmada'),
    'completadas', (select count(*) from c where estado = 'completada'),
    'canceladas', (select count(*) from c where estado = 'cancelada'),
    'no_asistio', (select count(*) from c where estado = 'no_asistio'),
    'pacientes_atendidos', (select count(*) from atendidos),
    'fichas_completas', (
      select count(*) from public.fichas f
      where f.profesional_id = (select auth.uid())
        and f.paciente_id in (select paciente_id from atendidos)
        and nullif(trim(f.diagnostico), '') is not null
        and exists (select 1 from public.atenciones a where a.ficha_id = f.id)
    )
  );
$$;
revoke execute on function public.indicadores_profesional(date, date) from anon, public;
grant execute on function public.indicadores_profesional(date, date) to authenticated;

-- CU-11: red de derivación entre colegas -----------------------------------------------
create type public.estado_derivacion as enum ('pendiente', 'aceptada', 'rechazada');

create table public.derivaciones (
  id uuid primary key default gen_random_uuid(),
  de_profesional uuid not null references public.profesionales (id) on delete cascade,
  a_profesional uuid not null references public.profesionales (id) on delete cascade,
  paciente_id uuid not null references public.perfiles (id) on delete cascade,
  motivo text not null check (length(motivo) between 3 and 1000),
  -- Resumen clínico que la profesional decide compartir con su colega (opcional).
  resumen text check (length(resumen) <= 4000),
  estado public.estado_derivacion not null default 'pendiente',
  creado_en timestamptz not null default now(),
  respondida_en timestamptz,
  check (de_profesional <> a_profesional)
);
create index on public.derivaciones (a_profesional, creado_en desc);
create index on public.derivaciones (de_profesional, creado_en desc);
create index on public.derivaciones (paciente_id);
alter table public.derivaciones enable row level security;

create policy "ver mis derivaciones" on public.derivaciones for select to authenticated
  using ((select auth.uid()) in (de_profesional, a_profesional, paciente_id));
-- Sin políticas de insert/update/delete: se crean y responden solo con las funciones de abajo.
revoke insert, update, delete on public.derivaciones from anon, authenticated;

-- Derivar: solo a una profesional publicada y solo pacientes con cita propia.
create function public.derivar_paciente(p_paciente uuid, p_a_profesional uuid, p_motivo text, p_resumen text default null)
returns public.derivaciones
language plpgsql security definer set search_path = '' as $$
declare
  v public.derivaciones;
begin
  if not public.es_profesional() then raise exception 'Solo profesionales pueden derivar'; end if;
  if p_a_profesional = auth.uid() then raise exception 'No puedes derivarte a ti misma'; end if;
  if not exists (select 1 from public.citas c where c.paciente_id = p_paciente and c.profesional_id = auth.uid()) then
    raise exception 'Paciente no encontrada';
  end if;
  if not exists (select 1 from public.profesionales p where p.id = p_a_profesional and p.publicado) then
    raise exception 'Profesional no disponible';
  end if;
  if exists (
    select 1 from public.derivaciones d
    where d.de_profesional = auth.uid() and d.a_profesional = p_a_profesional
      and d.paciente_id = p_paciente and d.estado = 'pendiente'
  ) then
    raise exception 'Ya hay una derivación pendiente a esa profesional';
  end if;
  insert into public.derivaciones (de_profesional, a_profesional, paciente_id, motivo, resumen)
  values (auth.uid(), p_a_profesional, p_paciente, left(trim(p_motivo), 1000), nullif(left(trim(p_resumen), 4000), ''))
  returning * into v;
  return v;
end;
$$;

-- Responder: solo la profesional que recibe la derivación.
create function public.responder_derivacion(p_derivacion uuid, p_aceptar boolean)
returns public.derivaciones
language plpgsql security definer set search_path = '' as $$
declare
  v public.derivaciones;
begin
  update public.derivaciones
  set estado = case when p_aceptar then 'aceptada'::public.estado_derivacion else 'rechazada'::public.estado_derivacion end,
      respondida_en = now()
  where id = p_derivacion and a_profesional = auth.uid() and estado = 'pendiente'
  returning * into v;
  if not found then raise exception 'Derivación no encontrada'; end if;
  return v;
end;
$$;

revoke execute on function public.derivar_paciente(uuid, uuid, text, text) from anon, public;
revoke execute on function public.responder_derivacion(uuid, boolean) from anon, public;
grant execute on function public.derivar_paciente(uuid, uuid, text, text) to authenticated;
grant execute on function public.responder_derivacion(uuid, boolean) to authenticated;

-- La profesional que recibe una derivación ve los datos de contacto de esa paciente.
create policy "profesional ve pacientes derivadas" on public.perfiles for select to authenticated
  using (exists (
    select 1 from public.derivaciones d
    where d.paciente_id = perfiles.id and d.a_profesional = (select auth.uid())
  ));
