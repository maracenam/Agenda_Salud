-- Corrige generate_series: usar timestamps en vez de intervalos
-- Bloques libres de un día para un servicio (RF-03)
create or replace function public.bloques_disponibles(p_servicio uuid, p_fecha date)
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
    select (t at time zone v_tz) as ini
    from generate_series(
      p_fecha + h.hora_inicio,
      p_fecha + h.hora_fin - make_interval(mins => v_srv.duracion_min),
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

