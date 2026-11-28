-- CU-12 Registrar el pago de una cita y CU-13 Mis ingresos.
-- La previsión la indica la paciente (al reservar o en su cuenta). El pago lo registra la
-- profesional al marcar la cita como atendida, con un toque: el monto sale del precio de la
-- prestación y el medio se propone según la previsión. El folio del bono es opcional.

create type public.prevision as enum ('fonasa', 'isapre', 'particular');
create type public.medio_pago as enum ('efectivo', 'transferencia', 'tarjeta', 'bono_fonasa', 'bono_isapre');

-- Previsión de la paciente: dato propio, editable por ella.
alter table public.perfiles
  add column prevision public.prevision,
  add column isapre text constraint perfiles_isapre_largo check (length(isapre) <= 60);
grant update (prevision, isapre) on public.perfiles to authenticated;

-- Si la profesional recibe bonos (convenio con Fonasa o Isapres). Sin convenio no se proponen bonos.
alter table public.profesionales
  add column recibe_bono_fonasa boolean not null default false,
  add column recibe_bono_isapre boolean not null default false;
grant update (recibe_bono_fonasa, recibe_bono_isapre) on public.profesionales to authenticated;

-- Un pago por cita. Solo la profesional lo ve; los cambios pasan por las funciones de abajo.
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null unique references public.citas (id) on delete restrict,
  profesional_id uuid not null references public.profesionales (id) on delete restrict,
  paciente_id uuid not null references public.perfiles (id) on delete restrict,
  -- Fecha de la atención (inicio de la cita), para agrupar por mes sin cruzar tablas.
  fecha timestamptz not null,
  medio public.medio_pago not null,
  monto integer not null check (monto between 0 and 10000000),
  folio_bono text check (length(folio_bono) <= 40),
  boleta_emitida boolean not null default false,
  boleta_numero text check (length(boleta_numero) <= 20),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index on public.pagos (profesional_id, fecha);
create trigger pagos_actualizado before update on public.pagos
  for each row execute function public.tocar_actualizado();
create trigger pagos_auditoria after insert or update on public.pagos
  for each row execute function public.auditar();

alter table public.pagos enable row level security;
create policy "ver mis cobros" on public.pagos for select to authenticated
  using (profesional_id = (select auth.uid()));
revoke all on public.pagos from anon;
revoke insert, update, delete, truncate on public.pagos from authenticated;

-- Atender y cobrar en un solo paso: marca la cita como completada y guarda (o corrige) el pago.
create function public.registrar_pago(
  p_cita uuid,
  p_medio public.medio_pago,
  p_monto integer,
  p_folio text default null
) returns public.pagos
language plpgsql security definer set search_path = '' as $$
declare
  v_cita public.citas;
  v_pago public.pagos;
begin
  select * into v_cita from public.citas where id = p_cita and profesional_id = auth.uid() for update;
  if not found then raise exception 'Cita no encontrada'; end if;
  if v_cita.estado not in ('confirmada', 'completada') then
    raise exception 'Solo se cobra una cita atendida';
  end if;
  if p_monto is null or p_monto < 0 or p_monto > 10000000 then raise exception 'Revisa el monto cobrado'; end if;
  if v_cita.estado = 'confirmada' then
    if v_cita.inicio > now() then raise exception 'La cita aún no empieza'; end if;
    update public.citas set estado = 'completada' where id = p_cita;
  end if;
  insert into public.pagos (cita_id, profesional_id, paciente_id, fecha, medio, monto, folio_bono)
  values (p_cita, v_cita.profesional_id, v_cita.paciente_id, v_cita.inicio, p_medio, p_monto,
          nullif(left(btrim(p_folio), 40), ''))
  on conflict (cita_id) do update
    set medio = excluded.medio, monto = excluded.monto, folio_bono = excluded.folio_bono
  returning * into v_pago;
  return v_pago;
end;
$$;

-- Marcar varios cobros como "boleta emitida" (o deshacerlo). El número de boleta es opcional.
create function public.marcar_boletas(p_pagos uuid[], p_emitida boolean, p_numero text default null)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_n integer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if coalesce(array_length(p_pagos, 1), 0) > 500 then raise exception 'Demasiados cobros de una vez'; end if;
  update public.pagos
     set boleta_emitida = p_emitida,
         boleta_numero = case when p_emitida then nullif(left(btrim(p_numero), 20), '') else null end
   where id = any (p_pagos) and profesional_id = auth.uid();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Si una cita cobrada vuelve a "no asistió" o "confirmada", el cobro deja de existir: no se
-- puede cobrar algo que no ocurrió. Se borra aquí (la bitácora guarda que existió).
create function public.anular_pago_si_no_atendida() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.estado = 'completada' and new.estado <> 'completada' then
    delete from public.pagos where cita_id = new.id;
  end if;
  return new;
end;
$$;
create trigger citas_anular_pago after update of estado on public.citas
  for each row execute function public.anular_pago_si_no_atendida();
create trigger pagos_auditoria_borrado after delete on public.pagos
  for each row execute function public.auditar();

revoke execute on function public.registrar_pago(uuid, public.medio_pago, integer, text) from anon, public;
revoke execute on function public.marcar_boletas(uuid[], boolean, text) from anon, public;
revoke execute on function public.anular_pago_si_no_atendida() from anon, authenticated, public;
grant execute on function public.registrar_pago(uuid, public.medio_pago, integer, text) to authenticated;
grant execute on function public.marcar_boletas(uuid[], boolean, text) to authenticated;
