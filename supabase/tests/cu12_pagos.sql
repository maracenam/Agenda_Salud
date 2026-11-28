-- CU-12 registrar el pago de una cita y CU-13 Mis ingresos
begin;
\ir _ayuda.psql
select plan(19);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.profesional_lista('otra@t.cl') as otra \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.lunes('09:00') as l9 \gset

-- La paciente indica su previsión
select pg_temp.como(:'ana');
update perfiles set prevision = 'fonasa' where id = auth.uid();
select is((select prevision::text from perfiles where id = :'ana'), 'fonasa', 'la paciente guarda su previsión');
select id as c1 from reservar_cita(:'srv', :'l9') \gset
select id as c2 from reservar_cita(:'srv', (:'l9'::timestamptz + interval '1 hour')) \gset
select id as c3 from reservar_cita(:'srv', (:'l9'::timestamptz + interval '2 hours')) \gset
select throws_ok(format($$ select registrar_pago(%L, 'efectivo', 1000) $$, :'c1'), 'P0001', 'Cita no encontrada', 'la paciente no puede registrar cobros');

-- Las citas ya ocurrieron (se mueven al pasado como administrador)
select pg_temp.como_admin();
update citas set inicio = inicio - interval '30 days', fin = fin - interval '30 days' where id in (:'c1', :'c2', :'c3');

select pg_temp.como(:'pro');
update profesionales set recibe_bono_fonasa = true where id = auth.uid();
select ok((select recibe_bono_fonasa from profesionales where id = :'pro'), 'la profesional declara que recibe bonos Fonasa');

select lives_ok(format($$ select registrar_pago(%L, 'bono_fonasa', 12000, ' 123456 ') $$, :'c1'), 'atendida y cobrada en un paso');
select is((select estado::text from citas where id = :'c1'), 'completada', 'la cita queda atendida');
select is((select folio_bono from pagos where cita_id = :'c1'), '123456', 'guarda el folio del bono sin espacios');
select lives_ok(format($$ select registrar_pago(%L, 'transferencia', 20000) $$, :'c1'), 'corregir el cobro no duplica');
select is((select count(*)::int from pagos where cita_id = :'c1'), 1, 'un solo cobro por cita');
select is((select monto from pagos where cita_id = :'c1'), 20000, 'el cobro quedó corregido');
select throws_ok(format($$ select registrar_pago(%L, 'efectivo', -5) $$, :'c2'), 'P0001', 'Revisa el monto cobrado', 'no acepta montos negativos');
select throws_ok(format($$ insert into pagos (cita_id, profesional_id, paciente_id, fecha, medio, monto) values (%L, %L, %L, now(), 'efectivo', 1) $$, :'c2', :'pro', :'ana'), '42501', null, 'no se escribe directo en la tabla de cobros');

-- Inasistencia: no se cobra, y si estaba cobrada el cobro se anula
select registrar_pago(:'c2', 'efectivo', 20000);
select marcar_cita(:'c2', 'no_asistio');
select is((select count(*)::int from pagos where cita_id = :'c2'), 0, 'una inasistencia no queda cobrada');
select throws_ok(format($$ select registrar_pago(%L, 'efectivo', 1000) $$, :'c2'), 'P0001', 'Solo se cobra una cita atendida', 'no se cobra una inasistencia');

-- Boletas
select registrar_pago(:'c3', 'efectivo', 20000);
select is(marcar_boletas(array(select id from pagos where profesional_id = :'pro'), true, '77'), 2, 'marca dos cobros con boleta');
select is((select count(*)::int from pagos where boleta_emitida and boleta_numero = '77'), 2, 'guarda el número de boleta');

-- Aislamiento
select pg_temp.como(:'otra');
select is((select count(*)::int from pagos), 0, 'otra profesional no ve mis cobros');
select is(marcar_boletas(array(select id from pagos), false), 0, 'ni puede cambiarlos');
select pg_temp.como(:'ana');
select is((select count(*)::int from pagos), 0, 'la paciente no ve los cobros');
select pg_temp.como_anon();
select throws_ok($$ select count(*) from pagos $$, '42501', null, 'sin sesión no hay acceso a cobros');

select * from finish();
rollback;
