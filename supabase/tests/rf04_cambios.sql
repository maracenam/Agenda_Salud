-- RF-04: modificación y cancelación de citas
begin;
\ir _ayuda.psql
select plan(11);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select id as cita from reservar_cita(:'srv', :'l9') \gset

select pg_temp.como(:'berta');
select throws_ok(format($$ select cancelar_cita(%L) $$, :'cita'), 'P0001', 'Cita no encontrada', 'otra paciente no puede cancelar una cita ajena');
select throws_ok(format($$ select reprogramar_cita(%L, %L) $$, :'cita', (:'l9'::timestamptz + interval '1 hour')), 'P0001', 'Cita no encontrada', 'ni cambiarla de hora');

select pg_temp.como(:'ana');
select lives_ok(format($$ select reprogramar_cita(%L, %L) $$, :'cita', (:'l9'::timestamptz + interval '1 hour')), 'la paciente cambia su hora a otro bloque libre');
select is((select inicio from citas where id = :'cita'), (:'l9'::timestamptz + interval '1 hour'), 'la cita queda en la nueva hora');
select is((select count(*)::int from bloques_disponibles(:'srv', (:'l9'::timestamptz at time zone 'America/Santiago')::date) where inicio = :'l9'), 1,
  'el bloque anterior se libera para nuevas reservas');
select throws_ok(format($$ select reprogramar_cita(%L, %L) $$, :'cita', (:'l9'::timestamptz + interval '6 hours')), 'P0001', 'El horario ya no está disponible', 'no se puede mover fuera del horario');

-- Ventana mínima de aviso: con 72 horas, una cita a menos de 72 horas no la cambia la paciente
select pg_temp.como_admin();
update profesionales set horas_min_cambio = 72 where id = :'pro';
update citas set inicio = now() + interval '24 hours', fin = now() + interval '24 hours 30 minutes' where id = :'cita';
select pg_temp.como(:'ana');
select throws_like(format($$ select cancelar_cita(%L) $$, :'cita'), 'Solo puedes cancelar hasta 72 horas antes%', 'dentro de la ventana mínima la paciente no puede cancelar');

select pg_temp.como(:'pro');
select lives_ok(format($$ select cancelar_cita(%L) $$, :'cita'), 'la profesional sí puede cancelar dentro de la ventana');
select is((select estado::text from citas where id = :'cita'), 'cancelada', 'la cita queda cancelada');
select is((select cancelada_por from citas where id = :'cita'), :'pro'::uuid, 'queda registrado quién canceló');
select throws_ok(format($$ select cancelar_cita(%L) $$, :'cita'), 'P0001', 'La cita ya no está activa', 'no se cancela dos veces');

select * from finish();
rollback;
