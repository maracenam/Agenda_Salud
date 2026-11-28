# Seguridad: endurecimiento, pentest y QA

Revisión hecha sobre nuestro propio proyecto, contra Supabase local y la app en `next start`. No se probó contra producción ni contra terceros.

## Cómo se probó

1. **Pentest automatizado** (`tests/seguridad/pentest.test.ts`, 26 ataques): API REST de Supabase con sesión anónima, de paciente y de profesional, y la app web. Cubre OWASP Top 10: A01 control de acceso (IDOR, escalamiento de rol, asignación masiva, redirección abierta, endpoints internos), A02/A07 autenticación (JWT falsificado, `alg: none`, contraseña corta), A03 inyección (SQL por filtros, XSS reflejado, comodines), A04 diseño (acaparamiento de horas, payloads gigantes), A05 configuración (cabeceras, nonce, errores sin trazas), A08 CSRF en Server Actions.
2. **OWASP ZAP baseline** (escaneo pasivo y spider) sobre la app local.
3. **`npm audit`** de dependencias.
4. **Pruebas pgTAP** de cada política RLS y función, con pruebas negativas por rol.
5. **QA en navegador** (Playwright, escritorio y celular) con **axe** (WCAG 2.1 AA) en las pantallas clave, y revisión visual de capturas.

## Hallazgos y correcciones

Contra la base sin la migración de endurecimiento, 8 de los ataques del pentest funcionaban. Con ella y las correcciones de la app, los 26 se rechazan.

| Id | Severidad | Hallazgo | Corrección |
|---|---|---|---|
| H-01 | Alta | Cualquiera, sin sesión, leía email, RUT, teléfono y fecha de nacimiento de las profesionales publicadas (la política de `perfiles` era por fila, no por columna) | Nombre público copiado a `profesionales.nombre` por trigger; teléfono público aparte (`telefono_consulta`); se quitó la política pública sobre `perfiles` |
| H-02 | Media | La paciente veía RUT, email y fecha de nacimiento de su profesional | Se quitó la política; la paciente ve solo nombre y teléfono de consulta |
| H-03 | Media | Textos libres sin largo máximo: filas de megabytes desde la API | `check (length(...) <= n)` en todos los textos libres y en `datos_especialidad` |
| H-04 | Media | Una atención podía apuntar a la cita de otra paciente | La política exige que la cita sea de la misma profesional y paciente |
| H-05 | Baja | Bloques de horario que se cruzaban en el mismo día | Restricción `exclude` contra cruces |
| H-06 | Baja | Funciones auxiliares (`es_profesional`, `tocar_actualizado`) llamables desde la API | `revoke execute` |
| H-07 | Baja | `notificaciones` accesible desde el cliente | Sin permisos para `anon` ni `authenticated`; la escribe solo el servidor |
| H-08 | Media | Una cuenta podía acaparar toda la agenda de una profesional | Máximo 3 reservas pendientes con la misma profesional, 10 en total y hasta 180 días adelante |
| H-09 | Media | Redirección abierta en el callback de auth con `/\evil.com` | `rutaSegura` rechaza barras invertidas, `//`, codificaciones y caracteres de control |
| H-10 | Baja | Mensajes de error de Postgres llegaban a la pantalla (nombres de tablas y restricciones) | Solo se muestran los mensajes propios (`P0001`); el resto, un texto genérico |
| H-11 | Baja | El secreto del cron se comparaba con `===` (fuga por tiempo) | Comparación de hashes en tiempo constante, secreto de mínimo 16 caracteres |
| H-12 | Crítica (dependencia de desarrollo) | `npm audit`: vulnerabilidades críticas en Vitest 3 | Actualizado a Vitest 5: 0 vulnerabilidades |

## Requerimientos no funcionales cubiertos en esta iteración

| RNF | Estado | Cómo |
|---|---|---|
| RNF-04 RLS por rol y relación | Cumple | RLS en todas las tablas, pruebas negativas por tabla y rol en pgTAP |
| RNF-08 Cabeceras de seguridad | Cumple | CSP con nonce por request y `strict-dynamic`, sin `unsafe-inline` en scripts; HSTS, `nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP |
| RNF-09 Validación en el servidor | Cumple en lo nuevo | Lista blanca de campos por especialidad, UUID, largos, correo; RUT con dígito verificador |
| RNF-11 Pentest OWASP | Cumple en local | 0 hallazgos críticos o altos abiertos; `npm audit` en 0 |
| RNF-12 Endpoints internos | Cumple | Cron sin secreto devuelve 401 sin detalles |
| RNF-14 Minimización | Cumple | H-01 y H-02; URLs con UUID |
| RNF-22 Retención 15 años | Cumple | Sin `DELETE` sobre fichas y atenciones, llaves `restrict`, trigger que rechaza el borrado |
| RNF-23 Registros inmutables | Cumple | Atenciones solo se agregan; cada cambio de ficha guarda la versión anterior en `fichas_versiones` |
| RNF-24 Autoría confiable | Cumple | `profesional_id` lo fija la base con `auth.uid()`; la ficha no cambia de dueña |
| RNF-27/28 Bitácora | Cumple (sin IP) | `auditoria` solo de agregar, con lecturas de ficha; la IP queda pendiente |
| RNF-43 Accesibilidad | Cumple en pantallas probadas | 0 violaciones serias o críticas de axe; se corrigieron contrastes sobre lila |
| RNF-47 Textos neutros | Cumple | Sin "matrona" fijo fuera del módulo de matronería |
| RNF-01 Contraseña ≥ 10 | Pendiente | Hoy es 8 (config de Supabase Auth) |
| RNF-02 2FA, RNF-03 cierre por inactividad, RNF-10 CAPTCHA y límite de intentos | Pendiente | Necesitan configuración de Supabase Auth o una cuenta externa |

## OWASP ZAP baseline

0 fallas. 4 avisos, todos revisados:

| Aviso | Riesgo | Revisión |
|---|---|---|
| Absence of Anti-CSRF Tokens | Medio (confianza baja) | Falso positivo: los Server Actions de Next verifican el encabezado `Origin`. Hay una prueba que manda un action desde otro origen y es rechazado |
| User Controllable HTML Element Attribute | Informativo | React escapa los atributos; la prueba de XSS reflejado lo confirma |
| Content-Type Header Missing | Informativo | Respuesta 307 de redirección sin cuerpo |
| Authentication Request Identified | Informativo | Solo identifica el formulario de ingreso |

## Para producción

- Aplicar las tres migraciones nuevas (`20261128000000`, `...0100`, `...0200`) en Supabase. Mientras no se apliquen, **H-01 sigue abierto en producción**.
- Subir el largo mínimo de contraseña a 10 y activar la protección de contraseñas filtradas en Supabase Auth.
- Correr el asesor de seguridad de Supabase después de migrar.
