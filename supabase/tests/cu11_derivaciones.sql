-- CU-11: red de derivación entre colegas
begin;
\ir _ayuda.psql
select plan(12);

select pg_temp.profesional_lista('mat@t.cl') as mat \gset
select pg_temp.profesional_lista('nut@t.cl', 'nutricion') as nut \gset
select pg_temp.profesional_lista('psi@t.cl', 'psicologia') as psi \gset
select pg_temp.usuario('borr@t.cl', '{"rol":"profesional","nombre":"Sin publicar","especialidad":"enfermeria"}') as borr \gset
select pg_temp.servicio_de(:'mat') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select reservar_cita(:'srv', :'l9');

select pg_temp.como(:'mat');
select lives_ok(format($$ select derivar_paciente(%L, %L, 'Diabetes gestacional', 'G1P0, 24 semanas') $$, :'ana', :'nut'), 'la matrona deriva a su paciente a nutrición');
select throws_ok(format($$ select derivar_paciente(%L, %L, 'Otra vez') $$, :'ana', :'nut'), 'P0001', 'Ya hay una derivación pendiente a esa profesional', 'no se duplica una derivación pendiente');
select throws_ok(format($$ select derivar_paciente(%L, %L, 'Sin cita') $$, :'berta', :'nut'), 'P0001', 'Paciente no encontrada', 'no deriva a quien no es su paciente');
select throws_ok(format($$ select derivar_paciente(%L, %L, 'No publicada') $$, :'ana', :'borr'), 'P0001', 'Profesional no disponible', 'no deriva a una profesional sin publicar');
select throws_ok(format($$ insert into derivaciones (de_profesional, a_profesional, paciente_id, motivo) values (auth.uid(), %L, %L, 'directo') $$, :'psi', :'berta'), '42501', null, 'no se insertan derivaciones directo');

select pg_temp.como(:'nut');
select is((select count(*)::int from derivaciones where estado = 'pendiente'), 1, 'la nutricionista ve la derivación recibida');
select is((select resumen from derivaciones), 'G1P0, 24 semanas', 'con el resumen clínico compartido');
select is((select count(*)::int from perfiles where id = :'ana'), 1, 'y los datos de contacto de la paciente');
select lives_ok($$ select responder_derivacion((select id from derivaciones limit 1), true) $$, 'la acepta');

select pg_temp.como(:'psi');
select is((select count(*)::int from derivaciones), 0, 'una tercera profesional no ve la derivación');
select throws_ok($$ select responder_derivacion((select id from derivaciones limit 1), true) $$, 'P0001', 'Derivación no encontrada', 'ni puede responderla');

select pg_temp.como(:'ana');
select is((select estado::text from derivaciones), 'aceptada', 'la paciente ve su derivación aceptada');

select * from finish();
rollback;
