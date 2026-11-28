-- RF-08: notificaciones (los envíos los hace el servidor; aquí se prueba su soporte en la base)
begin;
\ir _ayuda.psql
select plan(5);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select id as cita from reservar_cita(:'srv', :'l9') \gset
select pg_temp.como_admin();
insert into notificaciones (cita_id, destinatario, tipo, ok) values (:'cita', 'a@t.cl', 'confirmacion', true);
update citas set recordatorio_enviado_en = now() where id = :'cita';

select pg_temp.como(:'ana');
select throws_ok($$ select * from notificaciones $$, '42501', null, 'la paciente no lee el registro de notificaciones');
select throws_ok($$ insert into notificaciones (destinatario, tipo, ok) values ('x@x.cl', 'spam', true) $$, '42501', null, 'ni escribe notificaciones');
select lives_ok(format($$ select reprogramar_cita(%L, %L) $$, :'cita', (:'l9'::timestamptz + interval '1 hour')), 'cambia la hora');
select is((select recordatorio_enviado_en from citas where id = :'cita'), null, 'al cambiar la hora, el recordatorio se vuelve a enviar');

select pg_temp.como_admin();
select ok(exists(select 1 from citas where id = :'cita' and estado = 'confirmada' and recordatorio_enviado_en is null and inicio > now()), 'el cron encuentra la cita pendiente de recordatorio');

select * from finish();
rollback;
