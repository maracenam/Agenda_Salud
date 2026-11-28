-- RF-02: catálogo de especialidades y profesionales
begin;
\ir _ayuda.psql
select plan(11);

select pg_temp.profesional_lista('kine@t.cl', 'kinesiologia') as kine \gset
select pg_temp.usuario('nutri@t.cl', '{"rol":"profesional","nombre":"Nina Nutri","especialidad":"nutricion"}') as nutri \gset
select pg_temp.usuario('pac@t.cl', '{"rol":"paciente","nombre":"Pablo"}') as pac \gset

select is((select count(*)::int from especialidades where activa), 10, 'hay 10 especialidades activas');
select is((select count(*)::int from especialidades where activa and profesion is null), 0, 'cada especialidad tiene su nombre de profesión');

select pg_temp.como_anon();
select is((select count(*)::int from especialidades), 10, 'sin sesión se ve el catálogo de especialidades');
select is((select count(*)::int from profesionales where id = :'kine'), 1, 'sin sesión se ve a la profesional publicada');
select is((select count(*)::int from profesionales where id = :'nutri'), 0, 'sin sesión no se ve a una profesional sin publicar');
select is((select count(*)::int from servicios where profesional_id = :'kine'), 1, 'se ven las prestaciones de la profesional publicada');
select is(
  (select count(*)::int from profesionales p join especialidades e on e.id = p.especialidad_id where e.slug = 'kinesiologia'),
  1, 'el directorio filtra por especialidad');

select pg_temp.como(:'nutri');
select lives_ok($$ update profesionales set especialidad_id = (select id from especialidades where slug = 'medicina-general') where id = auth.uid() $$,
  'la profesional puede cambiar a otra especialidad activa');
select pg_temp.como_admin();
update especialidades set activa = false where slug = 'podologia';
select pg_temp.como(:'nutri');
select throws_ok($$ update profesionales set especialidad_id = (select id from especialidades where slug = 'podologia') where id = auth.uid() $$,
  '42501', null, 'no puede elegir una especialidad inactiva');
select throws_ok($$ update profesionales set nombre = 'Otra' where id = auth.uid() $$, '42501', null, 'el nombre público no se edita directo (viene del perfil)');

select pg_temp.como(:'pac');
select throws_ok($$ insert into servicios (profesional_id, nombre, duracion_min) values (auth.uid(), 'Falsa', 30) $$,
  '42501', null, 'una paciente no puede crear prestaciones');

select * from finish();
rollback;
