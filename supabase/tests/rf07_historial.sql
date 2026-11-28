-- RF-07: historial de atenciones, inmutable y auditado
begin;
\ir _ayuda.psql
select plan(9);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.profesional_lista('otra@t.cl') as otra \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.servicio_de(:'otra') as srv2 \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select id as cita from reservar_cita(:'srv', :'l9') \gset
select pg_temp.como(:'berta');
select id as cita_b from reservar_cita(:'srv2', :'l9') \gset

select pg_temp.como(:'pro');
insert into fichas (profesional_id, paciente_id) values (auth.uid(), :'ana');
select id as ficha from fichas where paciente_id = :'ana' \gset
select lives_ok(format($$ insert into atenciones (ficha_id, profesional_id, paciente_id, cita_id, motivo, datos_especialidad) values (%L, auth.uid(), %L, %L, 'Control', '{"matroneria":{"peso":61.5}}') $$, :'ficha', :'ana', :'cita'),
  'la profesional registra una atención ligada a la cita');
select throws_ok(format($$ insert into atenciones (ficha_id, profesional_id, paciente_id, cita_id) values (%L, auth.uid(), %L, %L) $$, :'ficha', :'ana', :'cita_b'),
  '42501', null, 'no puede ligar la atención a una cita de otra profesional');
select is((select profesional_id from atenciones limit 1), :'pro'::uuid, 'la autoría la fija la base con la sesión');
select throws_ok($$ update atenciones set notas = 'cambiada' $$, '42501', null, 'una atención registrada no se edita');
select throws_ok($$ delete from atenciones $$, '42501', null, 'ni se borra');
select is((select count(*)::int from atenciones where ficha_id = :'ficha'), 1, 'el historial queda en la ficha');

select pg_temp.como(:'otra');
select is((select count(*)::int from atenciones), 0, 'otra profesional no ve el historial');

select pg_temp.como_admin();
select ok((select count(*) from auditoria where tabla = 'atenciones' and accion = 'insert' and actor = :'pro') = 1, 'la atención queda en la bitácora de auditoría');
select pg_temp.como(:'pro');
select throws_ok($$ select * from auditoria $$, '42501', null, 'nadie lee la bitácora desde la API');

select * from finish();
rollback;
