-- Endurecimiento (hallazgos del pentest, ver docs/SEGURIDAD.md) --------------------------

-- H-01: cualquiera (incluso sin sesión) leía email, RUT, teléfono y fecha de nacimiento
-- de las profesionales publicadas, porque la política de perfiles era por fila.
-- Ahora el nombre público vive en profesionales.nombre (copia mantenida por trigger) y el
-- teléfono de contacto público es profesionales.telefono_consulta, que ella decide publicar.
alter table public.profesionales
  add column nombre text,
  add column telefono_consulta text check (length(telefono_consulta) <= 30);
update public.profesionales p set nombre = pf.nombre from public.perfiles pf where pf.id = p.id;
alter table public.profesionales alter column nombre set not null;

drop policy "ver perfiles de profesionales publicados" on public.perfiles;
-- H-02: la paciente veía RUT, email y fecha de nacimiento de su profesional.
drop policy "paciente ve a sus profesionales" on public.perfiles;

grant update (telefono_consulta) on public.profesionales to authenticated;

create function public.sincronizar_nombre_profesional() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profesionales set nombre = new.nombre where id = new.id and nombre is distinct from new.nombre;
  return new;
end;
$$;
revoke execute on function public.sincronizar_nombre_profesional() from anon, authenticated, public;
create trigger perfiles_nombre_profesional after update of nombre on public.perfiles
  for each row execute function public.sincronizar_nombre_profesional();

create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_especialidad smallint;
  v_nombre text := left(coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)), 120);
begin
  insert into public.perfiles (id, rol, nombre, email, telefono, rut)
  values (
    new.id,
    case when new.raw_user_meta_data->>'rol' = 'profesional' then 'profesional'::public.rol_usuario
         else 'paciente'::public.rol_usuario end,
    v_nombre,
    new.email,
    left(new.raw_user_meta_data->>'telefono', 30),
    left(new.raw_user_meta_data->>'rut', 12)
  );
  if new.raw_user_meta_data->>'rol' = 'profesional' then
    select id into v_especialidad from public.especialidades
    where slug = new.raw_user_meta_data->>'especialidad' and activa;
    if v_especialidad is null then
      select id into v_especialidad from public.especialidades where activa order by orden, id limit 1;
    end if;
    insert into public.profesionales (id, especialidad_id, nombre) values (new.id, v_especialidad, v_nombre);
  end if;
  return new;
end;
$$;
revoke execute on function public.crear_perfil() from anon, authenticated, public;

-- La profesional que recibe una derivación ve a la colega que la envió, aunque no esté publicada.
create policy "ver colegas de mis derivaciones" on public.profesionales for select to authenticated
  using (exists (
    select 1 from public.derivaciones d
    where (d.a_profesional = (select auth.uid()) and d.de_profesional = profesionales.id)
       or (d.paciente_id = (select auth.uid()) and profesionales.id in (d.de_profesional, d.a_profesional))
  ));

-- H-03: largo máximo de los textos libres (evita filas gigantes desde la API).
alter table public.perfiles
  add constraint perfiles_nombre_largo check (length(nombre) between 1 and 120),
  add constraint perfiles_telefono_largo check (length(telefono) <= 30),
  add constraint perfiles_rut_largo check (length(rut) <= 12);
alter table public.profesionales
  add constraint profesionales_textos_largo check (
    length(titulo) <= 120 and length(registro_sis) <= 30 and length(bio) <= 2000
    and length(direccion) <= 200 and length(comuna) <= 80
  );
alter table public.servicios
  add constraint servicios_textos_largo check (length(nombre) between 1 and 120 and length(descripcion) <= 300),
  add constraint servicios_precio_max check (precio <= 10000000);
alter table public.bloqueos add constraint bloqueos_motivo_largo check (length(motivo) <= 200);
alter table public.fichas add constraint fichas_textos_largo check (
  length(antecedentes) <= 4000 and length(alergias) <= 1000 and length(medicamentos) <= 1000
  and length(diagnostico) <= 4000 and length(tratamiento) <= 4000 and length(observaciones) <= 4000
);
alter table public.atenciones add constraint atenciones_textos_largo check (
  length(motivo) <= 300 and length(diagnostico) <= 4000 and length(indicaciones) <= 4000 and length(notas) <= 8000
);

-- H-04: una atención solo puede apuntar a una cita de la misma profesional y paciente.
drop policy "gestionar mis atenciones" on public.atenciones;
create policy "gestionar mis atenciones" on public.atenciones for all to authenticated
  using (profesional_id = (select auth.uid()))
  with check (
    profesional_id = (select auth.uid())
    and exists (select 1 from public.fichas f where f.id = atenciones.ficha_id and f.profesional_id = (select auth.uid()) and f.paciente_id = atenciones.paciente_id)
    and (cita_id is null or exists (
      select 1 from public.citas c where c.id = atenciones.cita_id and c.profesional_id = (select auth.uid()) and c.paciente_id = atenciones.paciente_id
    ))
  );

-- H-05: el horario debe ser propio de la profesional y no cruzarse con otro bloque del mismo día.
alter table public.horarios add constraint horarios_sin_cruces exclude using gist (
  profesional_id with =, dia_semana with =,
  tsrange('2000-01-01'::date + hora_inicio, '2000-01-01'::date + hora_fin) with &&
);

-- H-06: funciones auxiliares que no deben llamarse desde la API pública.
revoke execute on function public.es_profesional() from anon, public;
grant execute on function public.es_profesional() to authenticated;
revoke execute on function public.tocar_actualizado() from anon, authenticated, public;

-- H-07: las notificaciones las escribe solo el servidor; nadie las lee desde el cliente.
revoke all on public.notificaciones from anon, authenticated;

-- RNF-22: retención de la ficha clínica. Borrar una cuenta ya no borra fichas ni atenciones,
-- y nadie puede borrarlas desde la API. Solo un proceso de purga explícito, pasado el plazo
-- legal, puede hacerlo activando agenda.permitir_borrado_clinico en su transacción.
alter table public.fichas
  drop constraint fichas_paciente_id_fkey,
  drop constraint fichas_profesional_id_fkey,
  add constraint fichas_paciente_id_fkey foreign key (paciente_id) references public.perfiles (id) on delete restrict,
  add constraint fichas_profesional_id_fkey foreign key (profesional_id) references public.profesionales (id) on delete restrict;
alter table public.atenciones
  drop constraint atenciones_ficha_id_fkey,
  drop constraint atenciones_paciente_id_fkey,
  drop constraint atenciones_profesional_id_fkey,
  add constraint atenciones_ficha_id_fkey foreign key (ficha_id) references public.fichas (id) on delete restrict,
  add constraint atenciones_paciente_id_fkey foreign key (paciente_id) references public.perfiles (id) on delete restrict,
  add constraint atenciones_profesional_id_fkey foreign key (profesional_id) references public.profesionales (id) on delete restrict;

create function public.impedir_borrado_clinico() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('agenda.permitir_borrado_clinico', true), '') <> 'on' then
    raise exception 'Los registros clínicos no se pueden borrar (retención legal)';
  end if;
  return old;
end;
$$;
create trigger fichas_sin_borrado before delete on public.fichas for each row execute function public.impedir_borrado_clinico();
create trigger atenciones_sin_borrado before delete on public.atenciones for each row execute function public.impedir_borrado_clinico();

drop policy "gestionar mis fichas" on public.fichas;
create policy "ver mis fichas" on public.fichas for select to authenticated using (profesional_id = (select auth.uid()));
create policy "crear mis fichas" on public.fichas for insert to authenticated
  with check (
    profesional_id = (select auth.uid())
    and public.es_profesional()
    and exists (select 1 from public.citas c where c.paciente_id = fichas.paciente_id and c.profesional_id = (select auth.uid()))
  );
create policy "editar mis fichas" on public.fichas for update to authenticated
  using (profesional_id = (select auth.uid())) with check (profesional_id = (select auth.uid()));
revoke delete on public.fichas from anon, authenticated;

-- Una atención registrada no se edita ni se borra: se agrega otra (registro clínico inmutable).
drop policy "gestionar mis atenciones" on public.atenciones;
create policy "ver mis atenciones" on public.atenciones for select to authenticated using (profesional_id = (select auth.uid()));
create policy "registrar mis atenciones" on public.atenciones for insert to authenticated
  with check (
    profesional_id = (select auth.uid())
    and exists (select 1 from public.fichas f where f.id = atenciones.ficha_id and f.profesional_id = (select auth.uid()) and f.paciente_id = atenciones.paciente_id)
    and (cita_id is null or exists (
      select 1 from public.citas c where c.id = atenciones.cita_id and c.profesional_id = (select auth.uid()) and c.paciente_id = atenciones.paciente_id
    ))
  );
revoke update, delete on public.atenciones from anon, authenticated;

-- RNF-24: la base fija la autoría con la sesión, no la aplicación.
create function public.fijar_autor_clinico() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.profesional_id := auth.uid();
  end if;
  return new;
end;
$$;
create trigger fichas_autor before insert on public.fichas for each row execute function public.fijar_autor_clinico();
create trigger atenciones_autor before insert on public.atenciones for each row execute function public.fijar_autor_clinico();
-- La ficha no cambia de dueña ni de paciente una vez creada.
create function public.ficha_dueno_fijo() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.profesional_id <> old.profesional_id or new.paciente_id <> old.paciente_id then
    raise exception 'No se puede cambiar la profesional ni la paciente de una ficha';
  end if;
  new.creado_en := old.creado_en;
  return new;
end;
$$;
create trigger fichas_dueno_fijo before update on public.fichas for each row execute function public.ficha_dueno_fijo();

-- RNF-23: cada cambio de ficha guarda la versión anterior.
create table public.fichas_versiones (
  id bigint generated always as identity primary key,
  ficha_id uuid not null references public.fichas (id) on delete restrict,
  profesional_id uuid not null,
  version jsonb not null,
  cambiado_por uuid,
  cambiado_en timestamptz not null default now()
);
create index on public.fichas_versiones (ficha_id, cambiado_en desc);
alter table public.fichas_versiones enable row level security;
create policy "ver versiones de mis fichas" on public.fichas_versiones for select to authenticated
  using (profesional_id = (select auth.uid()));
revoke insert, update, delete on public.fichas_versiones from anon, authenticated;

create function public.versionar_ficha() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.fichas_versiones (ficha_id, profesional_id, version, cambiado_por)
  values (old.id, old.profesional_id, to_jsonb(old), auth.uid());
  return new;
end;
$$;
revoke execute on function public.versionar_ficha() from anon, authenticated, public;
create trigger fichas_version before update on public.fichas for each row execute function public.versionar_ficha();

-- RNF-27/28: bitácora de auditoría, solo de agregar. Registra escrituras clínicas, cambios de
-- citas, derivaciones y cada apertura de una ficha.
create table public.auditoria (
  id bigint generated always as identity primary key,
  en timestamptz not null default now(),
  actor uuid,
  accion text not null,
  tabla text not null,
  registro uuid,
  paciente_id uuid,
  detalle jsonb
);
create index on public.auditoria (paciente_id, en desc);
create index on public.auditoria (actor, en desc);
alter table public.auditoria enable row level security;
-- Sin políticas: nadie la lee ni la escribe desde la API. La escriben los triggers.
revoke all on public.auditoria from anon, authenticated;

create function public.auditoria_inmutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'La bitácora de auditoría no se puede modificar';
end;
$$;
create trigger auditoria_solo_agregar before update or delete on public.auditoria
  for each row execute function public.auditoria_inmutable();

create function public.auditar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_fila jsonb := to_jsonb(coalesce(new, old));
  v_detalle jsonb := null;
begin
  if tg_table_name = 'citas' and tg_op = 'UPDATE' then
    v_detalle := jsonb_build_object('estado', new.estado, 'estado_anterior', old.estado, 'inicio', new.inicio, 'inicio_anterior', old.inicio);
  elsif tg_table_name = 'derivaciones' then
    v_detalle := jsonb_build_object('estado', v_fila->>'estado', 'a_profesional', v_fila->>'a_profesional');
  end if;
  insert into public.auditoria (actor, accion, tabla, registro, paciente_id, detalle)
  values (auth.uid(), lower(tg_op), tg_table_name, (v_fila->>'id')::uuid, (v_fila->>'paciente_id')::uuid, v_detalle);
  return coalesce(new, old);
end;
$$;
revoke execute on function public.auditar() from anon, authenticated, public;
create trigger fichas_auditoria after insert or update on public.fichas for each row execute function public.auditar();
create trigger atenciones_auditoria after insert on public.atenciones for each row execute function public.auditar();
create trigger citas_auditoria after insert or update on public.citas for each row execute function public.auditar();
create trigger derivaciones_auditoria after insert or update on public.derivaciones for each row execute function public.auditar();

-- La página de la ficha llama a esta función al abrirse (RNF-28: registro de lecturas).
create function public.registrar_lectura_ficha(p_paciente uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.citas c where c.paciente_id = p_paciente and c.profesional_id = auth.uid()
  ) then
    raise exception 'Paciente no encontrada';
  end if;
  insert into public.auditoria (actor, accion, tabla, paciente_id)
  values (auth.uid(), 'lectura', 'fichas', p_paciente);
end;
$$;
revoke execute on function public.registrar_lectura_ficha(uuid) from anon, public;
grant execute on function public.registrar_lectura_ficha(uuid) to authenticated;

-- H-08 (RNF-10): límite de reservas pendientes por paciente, contra el acaparamiento de horas.
create or replace function public.reservar_cita(p_servicio uuid, p_inicio timestamptz, p_motivo text default null)
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
  if p_inicio > now() + interval '180 days' then raise exception 'Solo se puede reservar hasta 6 meses adelante'; end if;
  if (select count(*) from public.citas c
      where c.paciente_id = auth.uid() and c.profesional_id = v_srv.profesional_id
        and c.estado = 'confirmada' and c.inicio > now()) >= 3 then
    raise exception 'Ya tienes 3 horas pendientes con esta profesional. Cancela una para reservar otra.';
  end if;
  if (select count(*) from public.citas c
      where c.paciente_id = auth.uid() and c.estado = 'confirmada' and c.inicio > now()) >= 10 then
    raise exception 'Tienes demasiadas horas pendientes. Cancela alguna para reservar otra.';
  end if;
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
revoke execute on function public.reservar_cita(uuid, timestamptz, text) from anon, public;
grant execute on function public.reservar_cita(uuid, timestamptz, text) to authenticated;
