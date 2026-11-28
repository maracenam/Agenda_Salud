-- RF-01: gestión de usuarios y control de acceso
begin;
\ir _ayuda.psql
select plan(12);

select pg_temp.usuario('pac@t.cl', '{"rol":"paciente","nombre":"Ana Paciente"}') as pac \gset
select pg_temp.usuario('psi@t.cl', '{"rol":"profesional","nombre":"Pía Psicóloga","especialidad":"psicologia"}') as psi \gset
select pg_temp.usuario('raro@t.cl', '{"rol":"profesional","nombre":"Sin especialidad","especialidad":"astrologia"}') as raro \gset
select pg_temp.usuario('admin@t.cl', '{"rol":"admin","nombre":"Intruso"}') as intruso \gset

select is((select rol::text from perfiles where id = :'pac'), 'paciente', 'el registro de paciente crea un perfil de paciente');
select is((select rol::text from perfiles where id = :'psi'), 'profesional', 'el registro profesional crea un perfil profesional');
select is((select e.slug from profesionales p join especialidades e on e.id = p.especialidad_id where p.id = :'psi'), 'psicologia', 'la especialidad elegida al registrarse queda asociada');
select is((select e.slug from profesionales p join especialidades e on e.id = p.especialidad_id where p.id = :'raro'), 'matroneria', 'una especialidad inexistente cae en la primera del catálogo, no falla el registro');
select is((select rol::text from perfiles where id = :'intruso'), 'paciente', 'un rol desconocido en los metadatos queda como paciente');
select is((select nombre from profesionales where id = :'psi'), 'Pía Psicóloga', 'el nombre público de la profesional se copia a profesionales');

select pg_temp.como(:'pac');
select throws_ok($$ update perfiles set rol = 'profesional' where id = auth.uid() $$, '42501', null, 'la paciente no puede cambiar su propio rol');
select lives_ok($$ update perfiles set nombre = 'Ana María' where id = auth.uid() $$, 'la paciente puede editar su nombre');
select is((select count(*)::int from perfiles where id <> auth.uid()), 0, 'la paciente no ve perfiles de otras personas');

select pg_temp.como_anon();
select is((select count(*)::int from perfiles), 0, 'sin sesión no se ve ningún perfil (ni email ni RUT de profesionales)');

select pg_temp.como(:'psi');
select lives_ok($$ update perfiles set nombre = 'Pía Soto' where id = auth.uid() $$, 'la profesional edita su nombre');
select pg_temp.como_admin();
select is((select nombre from profesionales where id = :'psi'), 'Pía Soto', 'el cambio de nombre se sincroniza al perfil público');

select * from finish();
rollback;
