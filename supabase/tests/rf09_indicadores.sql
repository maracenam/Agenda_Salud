-- RF-09: panel de indicadores
begin;
\ir _ayuda.psql
select plan(8);

select pg_temp.profesional_lista('mat@t.cl') as pro \gset
select pg_temp.profesional_lista('otra@t.cl') as otra \gset
select pg_temp.servicio_de(:'pro') as srv \gset
select pg_temp.usuario('a@t.cl', '{"rol":"paciente","nombre":"Ana"}') as ana \gset
select pg_temp.usuario('b@t.cl', '{"rol":"paciente","nombre":"Berta"}') as berta \gset
select pg_temp.lunes('09:00') as l9 \gset

select pg_temp.como(:'ana');
select id as c1 from reservar_cita(:'srv', :'l9') \gset
select id as c2 from reservar_cita(:'srv', (:'l9'::timestamptz + interval '1 hour')) \gset
select pg_temp.como(:'berta');
select id as c3 from reservar_cita(:'srv', (:'l9'::timestamptz + interval '2 hours')) \gset
select cancelar_cita(:'c3');

select pg_temp.como(:'pro');
select marcar_cita(:'c1', 'completada');
select marcar_cita(:'c2', 'no_asistio');
insert into fichas (profesional_id, paciente_id, diagnostico) values (auth.uid(), :'ana', 'Sana');
insert into atenciones (ficha_id, profesional_id, paciente_id, cita_id) select id, auth.uid(), :'ana', :'c1' from fichas where paciente_id = :'ana';

select (:'l9'::timestamptz at time zone 'America/Santiago')::date as dia \gset
select indicadores_profesional(:'dia', :'dia') as i \gset
select is((:'i'::jsonb->>'agendadas')::int, 3, 'cuenta las citas agendadas del periodo');
select is((:'i'::jsonb->>'completadas')::int, 1, 'cuenta las realizadas');
select is((:'i'::jsonb->>'canceladas')::int, 1, 'cuenta las canceladas');
select is((:'i'::jsonb->>'no_asistio')::int, 1, 'cuenta las inasistencias');
select is((:'i'::jsonb->>'fichas_completas')::int, 1, 'cuenta las fichas completas de pacientes atendidos');
select is((indicadores_profesional(:'dia'::date + 1, :'dia'::date + 1)->>'agendadas')::int, 0, 'otro día no tiene citas');

select pg_temp.como(:'otra');
select is((indicadores_profesional(:'dia', :'dia')->>'agendadas')::int, 0, 'otra profesional solo ve sus propios números');
select pg_temp.como_anon();
select throws_ok(format($$ select indicadores_profesional(%L, %L) $$, :'dia', :'dia'), '42501', null, 'sin sesión no hay indicadores');

select * from finish();
rollback;
