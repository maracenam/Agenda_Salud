-- RF-03: agendamiento de citas en línea, sin dobles reservas
begin;
\ir _ayuda.psql
select plan(15);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select is((select count(*)::int from bloques_disponibles(:'srv', (:'l9'::timestamptz at time zone 'America/Santiago')::date)), 8,
  'un horario de 9 a 13 con prestación de 30 min ofrece 8 bloques');

select pg_temp.como(:'ana');
select lives_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', :'l9'), 'la paciente reserva un bloque libre');
select is((select estado::text from citas where paciente_id = auth.uid()), 'confirmada', 'la cita queda confirmada');

select pg_temp.como(:'berta');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', :'l9'), 'P0001', 'El horario ya no está disponible', 'otra paciente no puede tomar el mismo bloque');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '15 minutes')), 'P0001', 'El horario ya no está disponible', 'tampoco un bloque que se cruza');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '6 hours')), 'P0001', 'El horario ya no está disponible', 'no se reserva fuera del horario de atención');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', now() - interval '1 day'), 'P0001', 'El horario ya no está disponible', 'no se reserva en el pasado');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', now() + interval '200 days'), 'P0001', 'Solo se puede reservar hasta 6 meses adelante', 'no se reserva a más de 6 meses');
select is((select count(*)::int from bloques_disponibles(:'srv', (:'l9'::timestamptz at time zone 'America/Santiago')::date)), 7, 'el bloque tomado ya no aparece disponible');

select throws_ok($$ insert into citas (profesional_id, paciente_id, inicio, fin) values ((select id from profesionales limit 1), auth.uid(), now() + interval '8 days', now() + interval '8 days 30 minutes') $$,
  '42501', null, 'nadie puede insertar citas directo, sin pasar por las reglas');

-- Límite de 3 horas pendientes con la misma profesional (Ana ya tiene una)
select pg_temp.como(:'ana');
select lives_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '1 hour')), 'segunda reserva');
select lives_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '2 hours')), 'tercera reserva');
select throws_like(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '3 hours')), 'Ya tienes 3 horas pendientes%', 'la cuarta hora pendiente con la misma profesional se rechaza');

select pg_temp.como(:'pro');
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', (:'l9'::timestamptz + interval '3 hours')), 'P0001', 'No puedes reservar contigo misma', 'la profesional no reserva consigo misma');

select pg_temp.como_anon();
select throws_ok(format($$ select reservar_cita(%L, %L) $$, :'srv', :'l9'), '42501', null, 'sin sesión no se puede reservar');

select * from finish();
rollback;
