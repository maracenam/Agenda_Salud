-- RF-06: ficha clínica (adaptable por especialidad) y su protección
begin;
\ir _ayuda.psql
select plan(14);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.profesional_lista('psi@t.cl', 'psicologia') as psi \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select reservar_cita(:'srv', :'l9');
select throws_ok(format($$ insert into fichas (profesional_id, paciente_id) values (%L, auth.uid()) $$, :'pro'), '42501', null, 'la paciente no puede crear ni ver fichas');

select pg_temp.como(:'pro');
select lives_ok(format($$ insert into fichas (profesional_id, paciente_id, diagnostico, datos_especialidad) values (auth.uid(), %L, 'Embarazo 12 sem', '{"matroneria":{"fur":"2026-09-01","gestas":1}}') $$, :'ana'),
  'la profesional tratante crea la ficha con datos de su especialidad');
select throws_ok(format($$ insert into fichas (profesional_id, paciente_id) values (auth.uid(), %L) $$, :'berta'), '42501', null, 'no puede crear ficha a quien no es su paciente');
select throws_ok(format($$ insert into fichas (profesional_id, paciente_id, datos_especialidad) values (auth.uid(), %L, '[1,2]') $$, :'berta'), null, null, 'los datos de especialidad deben ser un objeto');
select lives_ok(format($$ update fichas set diagnostico = 'Embarazo 13 sem' where paciente_id = %L $$, :'ana'), 'la profesional actualiza la ficha');
select is((select count(*)::int from fichas_versiones), 1, 'la versión anterior queda guardada');
select is((select version->>'diagnostico' from fichas_versiones), 'Embarazo 12 sem', 'con el contenido anterior');
select throws_ok(format($$ update fichas set paciente_id = %L $$, :'berta'), 'P0001', 'No se puede cambiar la profesional ni la paciente de una ficha', 'la ficha no cambia de paciente');
select is((select count(*)::int from fichas), 1, 'la profesional ve su ficha');
select throws_ok($$ delete from fichas $$, '42501', null, 'la ficha no se puede borrar desde la API (retención legal)');

select pg_temp.como(:'psi');
select is((select count(*)::int from fichas), 0, 'otra profesional no ve la ficha');
select is((select count(*)::int from fichas_versiones), 0, 'ni sus versiones');

select pg_temp.como_admin();
select throws_like($$ delete from fichas $$, 'Los registros clínicos no se pueden borrar%', 'ni siquiera el servidor borra fichas sin activar la purga');
select throws_ok(format($$ delete from auth.users where id = %L $$, :'ana'), '23503', null, 'borrar la cuenta de una paciente con ficha no borra su ficha');

select * from finish();
rollback;
