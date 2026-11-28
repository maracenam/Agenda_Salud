-- RF-05: agenda del profesional, horarios y bloqueos
begin;
\ir _ayuda.psql
select plan(9);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.profesional_lista('otra@t.cl', 'nutricion') as otra \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select id as cita from reservar_cita(:'srv', :'l9') \gset
select throws_ok(format($$ select marcar_cita(%L, 'completada') $$, :'cita'), 'P0001', 'Cita no encontrada', 'la paciente no puede marcar su cita como atendida');

select pg_temp.como(:'otra');
select is((select count(*)::int from citas where profesional_id = :'pro'), 0, 'otra profesional no ve la agenda ajena');
select throws_ok(format($$ select marcar_cita(%L, 'no_asistio') $$, :'cita'), 'P0001', 'Cita no encontrada', 'ni puede marcar citas ajenas');

select pg_temp.como(:'pro');
select is((select count(*)::int from citas where profesional_id = auth.uid()), 1, 'la profesional ve su agenda');
select lives_ok(format($$ select marcar_cita(%L, 'no_asistio') $$, :'cita'), 'la profesional marca la inasistencia');
select throws_ok(format($$ select marcar_cita(%L, 'cancelada') $$, :'cita'), 'P0001', 'Estado no permitido', 'marcar no sirve para cancelar');
select throws_ok($$ insert into horarios (profesional_id, dia_semana, hora_inicio, hora_fin) values (auth.uid(), 1, '12:00', '14:00') $$,
  '23P01', null, 'un horario que se cruza con otro del mismo día se rechaza');
select lives_ok(format($$ insert into bloqueos (profesional_id, inicio, fin, motivo) values (auth.uid(), %L, %L, 'Feriado') $$, :'l9', (:'l9'::timestamptz + interval '4 hours')),
  'la profesional bloquea un día');
select is((select count(*)::int from bloques_disponibles(:'srv', (:'l9'::timestamptz at time zone 'America/Santiago')::date)), 0, 'un día bloqueado no ofrece horas');

select * from finish();
rollback;
