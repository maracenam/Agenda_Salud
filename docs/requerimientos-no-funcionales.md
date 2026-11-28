# Requerimientos no funcionales de Agenda Salud

Versión 1.0 · 28 de noviembre de 2026 · Estado: borrador para revisión de Matías

Este documento define **cómo de bien** debe funcionar Agenda Salud: qué tan segura, rápida, disponible, fácil de usar y fácil de mantener tiene que ser. Los requerimientos funcionales (RF-01 a RF-09, Informe Diagnóstico) dicen **qué** hace el sistema; estos RNF son el criterio con que se prueban, endurecen y aceptan esas funciones.

Alcance: la plataforma abierta a todas las profesiones de la salud (decisión del 28-nov-2026), construida con Next.js 16 + Supabase (sa-east-1, São Paulo) + Vercel (gru1) + Resend.

## 1. Cómo leer este documento

Cada RNF tiene un ID estable (`RNF-NN`), una descripción, un **criterio medible** (lo que se prueba para darlo por cumplido) y una prioridad:

| Prioridad | Significa | Cuándo debe cumplirse |
|---|---|---|
| **P0** | Bloqueante | Antes de que entre cualquier paciente real (piloto). |
| **P1** | Necesario | Antes de cobrar o de pasar de ~20 profesionales. |
| **P2** | Deseable | Mejora o diferenciador; se planifica después. |

La columna **Origen** indica de dónde sale cada RNF: `Doc` = ya estaba en tu documentación (ver sección 2), `Ley` = exigencia normativa (sección 3), `Nuevo` = buena práctica añadida para este stack.

## 2. Lo que ya decían tus documentos

Rescaté estos RNF y metas de calidad. Todos quedan cubiertos y convertidos en criterios medibles:

| Fuente | Lo que decía | Queda en |
|---|---|---|
| Proyecto Final Arq. SI (jul-2025), sección RNF | Seguridad: autenticación, control de acceso y cifrado de información sensible | RNF-01 a RNF-08 |
| Proyecto Final Arq. SI | Escalabilidad modular: agregar funciones (WhatsApp, reportes) sin afectar el rendimiento | RNF-58 a RNF-61 |
| Proyecto Final Arq. SI y presentación G21 | Tiempo de respuesta de 2 a 3 segundos (máx. 3 s) en buscar citas o ver fichas | RNF-32, RNF-33 |
| Proyecto Final Arq. SI y presentación G21 | Alta disponibilidad, estabilidad, bajas interrupciones críticas | RNF-37 a RNF-41 |
| Proyecto Final Arq. SI, infraestructura | HTTPS, firewall, backend cerrado al público, snapshots automáticos | RNF-06, RNF-38 |
| Proyecto Final Arq. SI, metodología | Pruebas de usabilidad: tasa de éxito sin ayuda, tiempo por tarea, satisfacción 1 a 5 | RNF-44, RNF-45 |
| Informe I&E y presentaciones | Usabilidad y simplicidad "sin necesidad de capacitación extensa"; respaldos en la nube; protocolos de ciberseguridad; monitoreo continuo | RNF-45, RNF-38, RNF-11, RNF-57 |
| Informe Diagnóstico (abr-2026), RF-01 y RF-06 | La ficha solo es accesible por el profesional que atiende; trazabilidad de la información clínica; WhatsApp no es un canal seguro para datos clínicos | RNF-04, RNF-27 a RNF-31, RNF-20 |
| AgendaSalud Final v3 (sep-2026) | Cumplimiento Ley 21.719; migración asistida; multiespecialidad | RNF-14 a RNF-19, RNF-50, RNF-58 |

## 3. Marco normativo considerado

| Norma | Qué exige, en lo que toca al software |
|---|---|
| **Ley 20.584** (derechos y deberes de los pacientes) | La ficha clínica es reservada y sus datos son sensibles; solo acceden el titular, el equipo tratante y los terceros que la ley enumera (art. 12 y 13). La ficha se conserva **al menos 15 años** en poder del prestador (art. 13). |
| **Decreto 41/2012 MINSAL** (reglamento de fichas clínicas) | La ficha electrónica debe asegurar confidencialidad, integridad, identificación del autor de cada registro y que las rectificaciones no borren lo anterior. Fija el contenido mínimo de la ficha. |
| **Ley 21.719** (protección de datos personales) | Entra en plena vigencia el **1 de diciembre de 2026**. Los datos de salud son datos sensibles. Derechos de acceso, rectificación, supresión, oposición, portabilidad y bloqueo; deber de seguridad; notificación de brechas a la Agencia de Protección de Datos y a los afectados; reglas de transferencia internacional; multas de hasta 20.000 UTM. Mientras tanto rige la Ley 19.628. |
| **Ley 21.668** (interoperabilidad de fichas clínicas) | Modifica la Ley 20.584 para que las fichas sean interoperables entre prestadores. Su reglamento técnico define los estándares; se considera como requisito futuro. |
| **Ley 19.799** (firma electrónica) | Base para firmar registros, recetas y consentimientos de forma válida. |
| **WCAG 2.2** (W3C) | Estándar de accesibilidad usado como referencia (nivel AA). |

Roles bajo la Ley 21.719: cada **profesional** es el responsable del tratamiento de los datos de sus pacientes; **Agenda Salud** actúa como encargado del tratamiento (procesa por cuenta del profesional); Supabase, Vercel y Resend son subencargados.

> **Sobre Seremi y Fonasa:** no encontré en tus documentos ni conozco una certificación obligatoria de software clínico ante la Seremi. Las obligaciones de ficha recaen en el prestador, y el software debe permitirle cumplirlas (eso es lo que cubren estos RNF). La emisión de bonos Fonasa exige integrarse con un operador autorizado; queda fuera del MVP. Ver la sección 6.

## 4. Requerimientos no funcionales

### 4.1 Seguridad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-01 | **Autenticación robusta.** Ingreso con correo y contraseña vía Supabase Auth, con correo verificado antes de acceder a datos clínicos. | Contraseña de mínimo 10 caracteres; registro rechaza contraseñas filtradas (protección de contraseñas filtradas de Supabase). Una cuenta sin correo verificado no puede ver citas ni fichas (prueba e2e). | P0 | Doc |
| RNF-02 | **Segundo factor para profesionales.** Verificación en dos pasos (TOTP) para cuentas profesionales. | Disponible en P1; obligatoria para abrir fichas desde la fecha que se defina. Prueba: profesional sin 2FA activado es redirigido a configurarlo. | P1 | Nuevo |
| RNF-03 | **Sesiones seguras.** Las vistas clínicas cierran sesión por inactividad y las cookies no son accesibles desde JavaScript. | Cierre automático tras 30 min sin actividad en `/panel`. Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax`. Cerrar sesión invalida el token de refresco (reutilizarlo devuelve 401). | P0 | Nuevo |
| RNF-04 | **Control de acceso por rol y por relación (RLS).** Un profesional solo ve pacientes, citas y fichas propias; un paciente solo ve lo suyo; el visitante anónimo solo ve el directorio público. | 100 % de las tablas de `public` con RLS activo y 0 alertas `rls_disabled` en los asesores de Supabase. Al menos una prueba negativa por tabla y rol (profesional A lee ficha de B → 0 filas; paciente lee cita ajena → 0 filas). | P0 | Doc |
| RNF-05 | **Secretos fuera del cliente.** La clave secreta de Supabase, `CRON_SECRET` y la API key de Resend nunca llegan al navegador ni al repositorio. | Búsqueda de las claves en el build (`.next/static`) y en el historial de git = 0 coincidencias. Variables solo en Vercel. Rotación documentada. | P0 | Nuevo |
| RNF-06 | **Cifrado en tránsito.** Todo el tráfico va por HTTPS. | TLS 1.2 o superior; HTTP redirige a HTTPS; cabecera HSTS con `max-age` ≥ 31536000 e `includeSubDomains`. | P0 | Doc |
| RNF-07 | **Cifrado en reposo.** Base de datos, respaldos y archivos cifrados por el proveedor. | AES-256 en Supabase (declarado por el proveedor) y respaldos externos (RNF-38) cifrados. P2: cifrado a nivel de columna para notas clínicas especialmente sensibles. | P0 | Doc |
| RNF-08 | **Cabeceras de seguridad.** CSP con nonce, sin `unsafe-inline` en scripts; prohibido incrustar la app en iframes ajenos; `nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` restrictiva. | Nota A en securityheaders.com y en Mozilla Observatory para la portada, `/panel` y la reserva pública. | P0 | Nuevo |
| RNF-09 | **Validación en el servidor.** Toda acción de servidor y ruta API valida su entrada con un esquema, aunque el formulario ya valide. | 100 % de server actions y route handlers con esquema (revisión de código). RUT validado con dígito verificador. Payload inválido → error controlado, nunca 500. | P0 | Nuevo |
| RNF-10 | **Protección contra abuso.** Límites de intentos en ingreso, registro, recuperación de contraseña y reserva sin cuenta, más CAPTCHA en formularios públicos. | Más de 10 intentos fallidos de ingreso en 5 min por IP o cuenta → bloqueo temporal. Máx. 5 reservas por hora por correo o IP en la reserva pública. CAPTCHA (Turnstile o hCaptcha) en registro y reserva pública. | P0 | Nuevo |
| RNF-11 | **Pruebas de seguridad y OWASP.** La app se evalúa contra OWASP Top 10 y OWASP ASVS nivel 2. | Pentest antes del piloto con 0 hallazgos críticos o altos abiertos. `npm audit --omit=dev` sin vulnerabilidades críticas ni altas en CI. Pentest repetido una vez al año y tras cambios mayores. | P0 | Doc |
| RNF-12 | **Endpoints internos protegidos.** Cron y webhooks exigen secreto y no exponen datos. | `/api/cron/recordatorios` sin `Authorization: Bearer <CRON_SECRET>` válido → 401. Webhooks de Resend con firma verificada. | P0 | Nuevo |
| RNF-13 | **Archivos clínicos privados.** Documentos subidos (consentimientos, exámenes) se guardan en buckets privados. | Buckets sin acceso público; descarga solo con URL firmada de ≤ 5 min; tipos permitidos PDF, JPG y PNG; máx. 10 MB por archivo. | P1 | Nuevo |

### 4.2 Privacidad y protección de datos

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-14 | **Minimización.** Solo se piden y muestran los datos necesarios. El directorio público muestra datos del profesional, nunca de pacientes. | Ningún RUT, correo, teléfono ni dato clínico en URLs, logs, analítica ni mensajes de error (revisión de logs de 7 días = 0 apariciones). Identificadores en URLs son UUID. | P0 | Ley |
| RNF-15 | **Información y consentimiento.** Política de privacidad y términos visibles al registrarse y al reservar; aceptación registrada. | Registro y reserva guardan fecha, hora y versión del documento aceptado. Cambiar la política exige nueva aceptación. | P0 | Ley |
| RNF-16 | **Derechos del titular (Ley 21.719).** El paciente puede ver y descargar sus datos y pedir rectificación, supresión u oposición. | Descarga de "mis datos" en JSON y PDF en menos de 1 min desde el portal. Procedimiento documentado con respuesta dentro del plazo legal (30 días corridos). La supresión no alcanza a la ficha clínica mientras corre su retención legal (RNF-22), y se le explica así al paciente. | P1 | Ley |
| RNF-17 | **Contrato de encargo de tratamiento.** Los términos para profesionales establecen que Agenda Salud trata los datos por su cuenta y listan a los subencargados. | Documento publicado que nombra a Supabase, Vercel y Resend, sus países y su finalidad. Aviso a los profesionales 30 días antes de sumar un subencargado nuevo. | P1 | Ley |
| RNF-18 | **Transferencia internacional declarada.** Los datos se alojan en Brasil (Supabase sa-east-1, Vercel gru1) y los correos pasan por EE. UU. (Resend). | Política de privacidad declara países y proveedores. Acuerdo de tratamiento de datos (DPA) firmado o aceptado con cada proveedor y guardado. | P0 | Ley |
| RNF-19 | **Respuesta a brechas.** Existe un procedimiento escrito para detectar, contener y notificar incidentes con datos personales. | Evaluación inicial en ≤ 24 h desde la detección; notificación a la Agencia y a los afectados sin dilación indebida (meta interna ≤ 72 h). Simulacro una vez al año con registro. | P1 | Ley |
| RNF-20 | **Notificaciones sin datos clínicos.** Correos y mensajes (y WhatsApp a futuro) no revelan diagnósticos ni el tipo de prestación cuando eso revela información sensible. | Plantillas contienen solo nombre del profesional, fecha, hora, dirección y enlace. Revisión de las plantillas: 0 campos clínicos. El nombre de la prestación es opcional por profesional y viene desactivado por defecto. | P0 | Doc |
| RNF-21 | **Sin rastreadores en áreas privadas.** No hay píxeles ni scripts de terceros en las vistas autenticadas. | 0 peticiones a dominios de terceros desde `/panel`, `/mis-citas` y `/cuenta`, salvo los proveedores listados en RNF-17. Analítica solo en páginas públicas y sin cookies. | P0 | Ley |

### 4.3 Ficha clínica y retención

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-22 | **Retención mínima de 15 años.** Fichas, atenciones y su historial no se borran físicamente durante el plazo legal, aunque se elimine la cuenta del paciente o del profesional. | Ningún rol de la app tiene `DELETE` sobre `fichas` ni `atenciones`; un trigger rechaza el borrado. Eliminar un usuario de Auth no borra su ficha (sin `on delete cascade` hacia datos clínicos). Prueba automatizada para ambos casos. | P0 | Ley |
| RNF-23 | **Registros clínicos inmutables.** Una atención registrada no se sobrescribe; una corrección crea una versión nueva con autor, fecha y motivo, y la anterior sigue consultable. | Toda edición de `atenciones` o `fichas` crea una fila en una tabla de versiones. Prueba: editar dos veces deja tres versiones visibles. | P0 | Ley |
| RNF-24 | **Autoría y hora confiables.** Cada registro clínico guarda quién lo hizo y cuándo, con datos que el cliente no puede falsificar. | `profesional_id` y fecha los fija la base de datos (`auth.uid()` y `now()`), no el formulario. Columnas `NOT NULL`. Se guarda en UTC y se muestra en hora de Chile. | P0 | Ley |
| RNF-25 | **Contenido mínimo de la ficha.** La ficha permite registrar los campos que exige el Decreto 41/2012, con una base común a todas las profesiones y secciones por profesión. | Lista de verificación contra el reglamento revisada y aprobada. Campos específicos de una profesión (por ejemplo los gineco-obstétricos de matronería) viven en módulos, no en la tabla común. | P1 | Ley |
| RNF-26 | **Portabilidad para el profesional y custodia al dar de baja.** El profesional puede exportar todas sus fichas en formato legible y reutilizable; si deja la plataforma, las fichas siguen custodiadas o se le entregan. | Exportación completa en PDF por paciente más CSV o JSON; 500 fichas en < 5 min. Política escrita de custodia tras la baja que cubre los 15 años. Copia de la ficha para el titular disponible en un clic. | P1 | Ley |

### 4.4 Auditoría y trazabilidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-27 | **Bitácora de accesos clínicos.** Toda lectura, creación, edición y exportación de una ficha queda registrada. | Cada evento guarda usuario, paciente, acción, fecha y hora, e IP. Prueba: abrir una ficha genera exactamente un evento de lectura. | P0 | Doc |
| RNF-28 | **Bitácora a prueba de alteración.** Los eventos de auditoría solo se agregan; nadie los edita ni borra desde la app. | Tabla de auditoría sin permisos `UPDATE` ni `DELETE` para ningún rol de la app (prueba). Retención: eventos clínicos 15 años; eventos de ingreso y seguridad 2 años. | P0 | Ley |
| RNF-29 | **Eventos de seguridad.** Se registran ingresos exitosos y fallidos, cambios de contraseña y de 2FA, cambios de rol y exportaciones masivas. | Exportación de más de 50 fichas o más de 20 ingresos fallidos en una hora generan alerta por correo al equipo. | P1 | Nuevo |
| RNF-30 | **Transparencia para el profesional y el paciente.** El profesional ve la actividad de su cuenta; el paciente puede ver quién accedió a su ficha y cuándo. | Vista "actividad de la cuenta" para profesionales (P1). Vista "quién vio mi ficha" en el portal del paciente (P2, diferenciador). | P1 / P2 | Nuevo |
| RNF-31 | **Hora correcta en Chile.** Las fechas se guardan en UTC y se muestran en `America/Santiago`, incluidos los cambios de horario de abril y septiembre. | Pruebas unitarias de bloques de agenda y recordatorios en las fechas de cambio de horario: 0 horas duplicadas o perdidas. | P0 | Nuevo |

### 4.5 Rendimiento

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-32 | **Respuesta rápida en operaciones básicas.** Buscar horas, abrir una ficha, guardar una atención y reservar responden casi al instante (tu meta original era 2 a 3 s; aquí se hace más exigente y medible). | Tiempo de respuesta del servidor p95 ≤ 800 ms y p99 ≤ 2 s, medido en producción durante 7 días. Ninguna operación básica supera 3 s en p99. | P0 | Doc |
| RNF-33 | **Carga de páginas en móvil.** Las páginas cumplen Core Web Vitals en una conexión 4G. | En el percentil 75: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 (Vercel Speed Insights). Lighthouse móvil de rendimiento ≥ 90 en portada, perfil público y reserva. | P0 | Doc |
| RNF-34 | **Peso de la página acotado.** | JavaScript inicial ≤ 200 KB comprimido por ruta; reserva pública ≤ 150 KB. Imágenes en AVIF o WebP con tamaño declarado. | P1 | Nuevo |
| RNF-35 | **Consultas eficientes.** | Ninguna consulta de la app supera 300 ms en p95. 0 alertas de llaves foráneas sin índice en el asesor de rendimiento de Supabase. | P1 | Nuevo |
| RNF-36 | **Carga concurrente.** El sistema sostiene picos sin degradarse. | Prueba de carga (k6) con 100 usuarios simultáneos durante 10 min: tasa de error < 1 % y tiempos dentro de RNF-32. | P1 | Nuevo |
| RNF-37 | **Recordatorios a tiempo.** Los recordatorios salen dentro de la ventana configurada por el profesional. | 99 % de recordatorios enviados dentro de ±1 h de la hora prevista. 1.000 envíos se procesan en < 5 min. Nota: el plan Hobby de Vercel solo permite un cron diario; cumplir esta ventana exige plan Pro o un programador en Supabase (`pg_cron`). | P1 | Doc |

### 4.6 Disponibilidad y continuidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-38 | **Respaldos y restauración probada.** Respaldos automáticos diarios más una copia lógica semanal fuera de Supabase. | RPO ≤ 24 h en el piloto y ≤ 5 min con recuperación a un punto en el tiempo (PITR) en P1. RTO ≤ 4 h. Copias externas cifradas, retenidas 30 días (semanales) y 12 meses (mensuales). Restauración de prueba cada trimestre, con acta. | P0 | Doc |
| RNF-39 | **Disponibilidad mensual ≥ 99,5 %** (≈ 3,6 h de caída al mes como máximo), sin contar mantenciones avisadas con 48 h. | Monitor externo cada 1 min sobre la portada y un endpoint `/api/salud` que verifica la base de datos. Alerta al equipo en < 5 min de caída. Reporte mensual. | P1 | Doc |
| RNF-40 | **Plan de producción adecuado.** Producción corre en Supabase Pro (o superior), nunca en el plan gratuito. | El plan gratuito pausa el proyecto tras una semana sin actividad y no ofrece los respaldos que exige RNF-38. Verificación: plan Pro activo antes del piloto. | P0 | Nuevo |
| RNF-41 | **Degradación controlada.** Si falla un servicio externo, la función principal sigue. | Si Resend falla, la cita igual queda confirmada en pantalla y el correo se reintenta 3 veces con espera creciente; los fallos quedan en `notificaciones`. Las páginas de error están en español y dicen qué hacer. | P0 | Nuevo |
| RNF-42 | **Despliegues sin pérdida.** | Migraciones solo hacia adelante y compatibles con la versión anterior; caída por despliegue ≤ 1 min; vuelta atrás en ≤ 5 min con el rollback instantáneo de Vercel. | P1 | Nuevo |

### 4.7 Usabilidad y accesibilidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-43 | **Accesibilidad WCAG 2.2 AA.** Contraste suficiente, uso completo con teclado, foco visible, etiquetas en todos los campos, mensajes de error anunciados por lector de pantalla. | 0 violaciones serias o críticas de axe en las pantallas clave (portada, buscar, perfil público, reservar, ingresar, panel, ficha). Lighthouse de accesibilidad ≥ 95. Contraste de texto ≥ 4,5:1. | P0 | Nuevo |
| RNF-44 | **Reserva sin fricción.** Un paciente reserva sin crear cuenta en pocos pasos. | Reserva completa en ≤ 3 pantallas y ≤ 90 s en pruebas con usuarios. Tasa de éxito sin ayuda ≥ 90 %. Satisfacción ≥ 4 de 5 (escala de tus pruebas de usabilidad). | P0 | Doc |
| RNF-45 | **Sin capacitación.** Un profesional nuevo deja su agenda lista solo. | Configurar perfil, una prestación y su horario semanal en ≤ 10 min sin ayuda, en pruebas con al menos 5 profesionales de distintas profesiones. | P1 | Doc |
| RNF-46 | **Móvil primero.** Todo funciona desde un teléfono. | Sin scroll horizontal desde 360 px de ancho. Objetivos táctiles de al menos 44 × 44 px. Flujos de paciente probados en un teléfono real Android y uno iOS. | P0 | Nuevo |
| RNF-47 | **Español de Chile y formatos locales.** | Fechas `dd-mm-aaaa`, horas en 24 h, pesos como `$9.990`, RUT como `12.345.678-5`. Textos neutros que sirvan a cualquier profesión (0 menciones fijas a "matrona" fuera del módulo de matronería). Mensajes de error que dicen qué hacer. | P0 | Nuevo |

### 4.8 Compatibilidad e interoperabilidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-48 | **Navegadores soportados.** Las dos últimas versiones de Chrome, Edge, Firefox, Safari (macOS e iOS) y Samsung Internet; iOS 16 o superior y Android 10 o superior. | Pruebas e2e en Chromium, WebKit y Firefox (Playwright) en CI, todas en verde. | P0 | Doc |
| RNF-49 | **Correos que llegan y se ven bien.** | SPF, DKIM y DMARC configurados en el dominio de envío. Puntaje ≥ 9/10 en mail-tester. Plantillas revisadas en Gmail, Outlook y Apple Mail. | P0 | Nuevo |
| RNF-50 | **Migración asistida desde Excel.** Un profesional puede importar su lista de pacientes y citas desde planillas. | Importa CSV o XLSX (UTF-8 y Latin-1) con vista previa y reporte de filas rechazadas; 1.000 filas en < 1 min. Exportaciones CSV abren bien en Excel (UTF-8 con BOM). | P1 | Doc |
| RNF-51 | **Preparada para interoperar (Ley 21.668).** El modelo de datos puede traducirse a HL7 FHIR cuando el reglamento lo exija. | Documento de mapeo de tablas a recursos FHIR (`Patient`, `Practitioner`, `Appointment`, `Encounter`). Las citas se pueden agregar al calendario del paciente con un archivo `.ics`. | P2 | Ley |

### 4.9 Mantenibilidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-52 | **Calidad de código verificada en CI.** | TypeScript en modo `strict` con 0 errores; ESLint con 0 errores; build en verde. CI obligatorio para fusionar cualquier PR. | P0 | Nuevo |
| RNF-53 | **Pruebas automatizadas.** | Al menos una prueba unitaria por RF; cobertura ≥ 80 % de líneas en la lógica de dominio (`src/lib`); e2e para registro, reservar, reprogramar, cancelar y registrar atención; pruebas de RLS (RNF-04) y de retención (RNF-22). | P0 | Nuevo |
| RNF-54 | **Esquema reproducible.** Todo cambio de base de datos vive como migración en `supabase/migrations`; nada se cambia a mano en el dashboard. | Recrear la base desde cero reproduce el esquema de producción (diff vacío). Tipos de TypeScript generados desde el esquema y actualizados en cada migración. | P0 | Nuevo |
| RNF-55 | **Documentación viva.** | README que permite levantar el proyecto en ≤ 30 min. Decisiones de arquitectura registradas (ADR). Este documento versionado en el repo. | P1 | Nuevo |
| RNF-56 | **Dependencias al día.** | Actualizaciones automáticas (Dependabot o Renovate). Vulnerabilidades críticas parchadas en ≤ 7 días y altas en ≤ 30 días. | P1 | Nuevo |
| RNF-57 | **Observabilidad.** Los errores se detectan antes de que el usuario los reporte. | Errores de servidor capturados con contexto y sin datos personales; alerta en < 5 min ante un error 500 nuevo; logs estructurados retenidos ≥ 30 días. | P1 | Doc |

### 4.10 Escalabilidad

| ID | Requerimiento | Criterio medible | Prioridad | Origen |
|---|---|---|---|---|
| RNF-58 | **Multiprofesión modular.** Sumar una profesión nueva es configuración, no reconstrucción. | Agregar una profesión (nombre, prestaciones sugeridas, campos de ficha propios) no requiere cambiar el esquema común ni tocar el código de otras profesiones. | P0 | Doc |
| RNF-59 | **Aislamiento entre profesionales y centros.** Los datos de cada profesional, y de cada centro a futuro (hasta 10 profesionales), quedan separados. | Pruebas de RLS entre profesionales y entre centros: 0 filas ajenas visibles. Un profesional que atiende en dos centros solo ve en cada centro lo que corresponde. | P1 | Doc |
| RNF-60 | **Capacidad del primer año sin rediseño.** | Con datos sembrados de 1.000 profesionales, 100.000 pacientes y 1.000.000 de citas, los tiempos siguen dentro de RNF-32 y RNF-35. | P1 | Nuevo |
| RNF-61 | **Costo por profesional sostenible.** La infraestructura crece en proporción a los ingresos. | Costo mensual de infraestructura por profesional activo ≤ 10 % del plan básico (≤ $999 CLP). Revisión mensual. | P2 | Doc |

## 5. Brechas en el código actual

Revisé el repositorio (rama `claude/mvp-matronas`) contra los RNF P0. Esto es lo que hay que corregir primero:

| RNF | Situación hoy | Qué falta |
|---|---|---|
| RNF-22 | `fichas` y `atenciones` tienen `on delete cascade` desde `perfiles` y `profesionales`, y la política `for all` permite `DELETE`. Borrar una cuenta borra la ficha. | Quitar el `cascade` hacia datos clínicos, limitar las políticas a `select`, `insert` y `update`, y agregar un trigger que impida borrar. |
| RNF-23 | Editar la ficha la sobrescribe (`src/app/panel/acciones.ts`) y la política `for all` permite editar atenciones ya registradas; no queda versión anterior. | Tabla de versiones y trigger de historial. |
| RNF-24 | `profesional_id` lo envía la aplicación al insertar (RLS lo acota, pero no lo fija la base). | Fijarlo en la base con `auth.uid()` (default o trigger). |
| RNF-27, RNF-28 | No existe bitácora de auditoría. | Tabla append-only y registro de lecturas de ficha. |
| RNF-08 | `next.config.ts` no define cabeceras de seguridad. | CSP con nonce y las demás cabeceras. |
| RNF-10 | Sin CAPTCHA ni límites propios en la reserva pública. | Turnstile o hCaptcha y límite por correo e IP. |
| RNF-25, RNF-58 | Los campos gineco-obstétricos están en la tabla común `fichas`. | Moverlos a un módulo de matronería. |
| RNF-37 | El cron corre una vez al día (13:00 UTC). | Plan Pro de Vercel o `pg_cron` en Supabase. |
| RNF-40 | No verifiqué el plan de Supabase. | Confirmar plan Pro antes del piloto. |

Lo que ya cumple: RLS activo en las 10 tablas (RNF-04, falta probarlo), `CRON_SECRET` en el cron (RNF-12), migraciones versionadas (RNF-54).

## 6. Pendientes por validar

1. **Asesoría legal.** Confirmar con un abogado de salud o datos personales: el plazo de 15 años y desde cuándo se cuenta según el Decreto 41/2012; los campos mínimos de la ficha; si Agenda Salud es encargado o corresponsable; y qué exige la Agencia de Protección de Datos para transferir datos a Brasil y EE. UU.
2. **Seremi y Fonasa.** Confirmar qué exige la Seremi a un profesional independiente que usa ficha electrónica, y si hay interés en emitir bonos Fonasa (requiere integrarse con un operador autorizado).
3. **Recetas y firma electrónica.** Si se agregan recetas o consentimientos firmados (como ofrece FIMEL), definir el tipo de firma bajo la Ley 19.799.
4. **Presupuesto.** Supabase Pro, Vercel Pro, CAPTCHA, monitoreo y pentest tienen costo mensual; validar contra RNF-61.
