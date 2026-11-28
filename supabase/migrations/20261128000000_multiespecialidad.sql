-- Agenda Salud abierta a todos los profesionales de la salud.
-- Sprints CU-01 a CU-03 y CU-07/CU-08: especialidad configurable, ficha adaptable por especialidad.

-- CU-02: catálogo de especialidades ----------------------------------------------
alter table public.especialidades
  add column profesion text,
  add column descripcion text,
  add column orden smallint not null default 100;

update public.especialidades set activa = true;

insert into public.especialidades (nombre, slug, activa) values
  ('Medicina general', 'medicina-general', true),
  ('Odontología', 'odontologia', true),
  ('Fonoaudiología', 'fonoaudiologia', true),
  ('Terapia ocupacional', 'terapia-ocupacional', true),
  ('Enfermería', 'enfermeria', true),
  ('Podología', 'podologia', true)
on conflict (slug) do nothing;

update public.especialidades e set profesion = v.profesion, descripcion = v.descripcion, orden = v.orden
from (values
  ('matroneria', 'Matrona o matrón', 'Control prenatal, ginecológico, PAP, anticoncepción y lactancia.', 10),
  ('medicina-general', 'Médica o médico general', 'Consultas de medicina general, controles crónicos y certificados.', 20),
  ('psicologia', 'Psicóloga o psicólogo', 'Psicoterapia individual, de pareja y evaluación psicológica.', 30),
  ('nutricion', 'Nutricionista', 'Evaluación nutricional, planes de alimentación y controles de peso.', 40),
  ('kinesiologia', 'Kinesióloga o kinesiólogo', 'Rehabilitación musculoesquelética, respiratoria y deportiva.', 50),
  ('odontologia', 'Dentista', 'Control dental, limpieza, tapaduras y urgencias.', 60),
  ('fonoaudiologia', 'Fonoaudióloga o fonoaudiólogo', 'Lenguaje, habla, voz, deglución y audición.', 70),
  ('terapia-ocupacional', 'Terapeuta ocupacional', 'Autonomía en la vida diaria, integración sensorial y rehabilitación.', 80),
  ('enfermeria', 'Enfermera o enfermero', 'Curaciones, procedimientos, vacunas y educación en salud.', 90),
  ('podologia', 'Podóloga o podólogo', 'Atención podológica, pie diabético y uñas.', 100)
) as v(slug, profesion, descripcion, orden)
where e.slug = v.slug;

alter table public.especialidades alter column profesion set not null;

-- CU-07/CU-08: ficha y atenciones con datos propios de cada especialidad ------------
-- datos_especialidad guarda un objeto por módulo: {"matroneria": {"fur": "...", ...}}
-- Así, si una profesional cambia de especialidad, los datos anteriores no se pierden.
alter table public.fichas
  add column datos_especialidad jsonb not null default '{}'::jsonb,
  add constraint fichas_datos_objeto check (jsonb_typeof(datos_especialidad) = 'object'),
  add constraint fichas_datos_tamano check (pg_column_size(datos_especialidad) < 16384);

alter table public.atenciones
  add column datos_especialidad jsonb not null default '{}'::jsonb,
  add constraint atenciones_datos_objeto check (jsonb_typeof(datos_especialidad) = 'object'),
  add constraint atenciones_datos_tamano check (pg_column_size(datos_especialidad) < 16384);

-- Los datos gineco-obstétricos pasan al módulo de matronería, sin perder nada.
update public.fichas set datos_especialidad = jsonb_build_object('matroneria', jsonb_strip_nulls(jsonb_build_object(
  'gestas', gestas, 'partos', partos, 'abortos', abortos, 'cesareas', cesareas,
  'fur', fur, 'metodo_anticonceptivo', metodo_anticonceptivo, 'ultimo_pap', ultimo_pap
)))
where coalesce(gestas, partos, abortos, cesareas) is not null
   or fur is not null or metodo_anticonceptivo is not null or ultimo_pap is not null;

alter table public.fichas
  drop column gestas, drop column partos, drop column abortos, drop column cesareas,
  drop column fur, drop column metodo_anticonceptivo, drop column ultimo_pap;

-- CU-01: el registro de un profesional elige su especialidad --------------------------
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_especialidad smallint;
begin
  insert into public.perfiles (id, rol, nombre, email, telefono, rut)
  values (
    new.id,
    case when new.raw_user_meta_data->>'rol' = 'profesional' then 'profesional'::public.rol_usuario
         else 'paciente'::public.rol_usuario end,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)), 120),
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
    insert into public.profesionales (id, especialidad_id) values (new.id, v_especialidad);
  end if;
  return new;
end;
$$;
revoke execute on function public.crear_perfil() from anon, authenticated, public;

-- CU-03: la profesional puede cambiar su especialidad, solo a una activa ----------------
grant update (especialidad_id) on public.profesionales to authenticated;
drop policy "editar mi ficha profesional" on public.profesionales;
create policy "editar mi ficha profesional" on public.profesionales for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and exists (select 1 from public.especialidades e where e.id = especialidad_id and e.activa)
  );

create index if not exists profesionales_especialidad_idx on public.profesionales (especialidad_id) where publicado;
