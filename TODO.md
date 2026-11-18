# ToDo de la suite

Chrome corre `cypress/e2e`. `cypress/failing` y `cypress/skipped` quedan afuera de esa carpeta: una corrida de `cypress/e2e` no los toma. Para verlos, el spec del workflow es `cypress/failing` o `cypress/skipped`.

Los `it.skip` que siguen dentro de un archivo con tests verdes no se movieron: el archivo se iría entero.

## Failing

Un solo bug de api tira varios archivos. `POST /api/core-v2/mpi/pacientes` responde 400 y el catch esconde la excepción. El arreglo es un PR de andes/api.

- [ ] `apps/solicitud/solicitudes.spec.ts`
- [ ] `apps/solicitud/acciones-solicitud.spec.ts` (además, `Referir solicitud` está en skip: el plex-help se cierra al scrollear)
- [ ] `apps/solicitud/nuevaSolicitudEntrada.spec.ts`
- [ ] `apps/solicitud/nuevaSolicitudSalida.spec.ts`
- [ ] `apps/solicitud/turnos.spec.ts`
- [ ] `core/mpi/busqueda.spec.ts`
- [ ] `core/mpi/mpi-registro-con-dni.spec.ts`
- [ ] `core/mpi/mpi-registro-de-paciente-similares.spec.js`
- [ ] `core/mpi/mpi-registro-extranjero-con-dni.spec.ts`
- [ ] `apps/rup/ejecucion.spec.js`
- [ ] `apps/rup/internacion/epicrisis.spec.ts`
- [ ] `apps/citas/turnos/turnos.spec.js`
- [ ] `apps/citas/agendas/revision-agenda/revision_agendas.spec.js`
- [ ] `apps/citas/agendas/revision-agenda/revision_agendas_con_paciente.spec.js`

Bugs de app, cada uno en su pantalla. El arreglo es un PR de andes/app, salvo donde dice otra cosa.

- [ ] Bebé: la ficha lee documento y nombre del progenitor, y el alta guarda `{ referencia, relacion }`. `core/mpi/mpi-registro-bebe.spec.ts`
- [ ] Reportar error: la pantalla manda `notaError` vacío y el listado no muestra CIELO ni WALSH. `apps/auditoria/reportarError.spec.ts`
- [ ] Egreso de estadística: el formulario queda completo y Guardar sigue deshabilitado. `apps/rup/internacion/estadistica/egresos.spec.ts`
- [ ] Odontograma: el diente ya no tiene la clase `diente vestibular diente-null`. `apps/rup/odontograma/odontograma.spec.ts`
- [ ] Plan de indicación: el mapa no muestra la fila de la internación. `apps/rup/internacion/plan-indicacion/crear-indicacion.spec.ts`
- [ ] Romper validar: el listado de internación no trae filas. `apps/rup/internacion/listado-internacion/romper-validar.spec.ts`
- [ ] Checklist: `test opcion multiple` espera `@expFiebre` y el request no sale. `apps/rup/elementos-rup/atomo-checklist.spec.ts`
- [ ] Niño sano: la búsqueda del paciente no dispara el request. `apps/rup/nino-sano.spec.ts`
- [ ] Seguimiento: con estado Seguimiento y ese documento la búsqueda no trae filas. `apps/epidemiologia/seguimiento/seguimiento.spec.ts`
- [ ] Buscador de ficha: el wait de SISA llega sin response. `apps/epidemiologia/buscador-ficha-epidemiologica.spec.ts`
- [ ] Gestor de agenda: el clear de la hora queda deshabilitado, o el conteo y los waits no cierran. `apps/citas/agendas/gestor_agenda.spec.ts`
- [ ] Listado de agendas: tres filtros no cierran. `apps/citas/agendas/gestor_agendas_listado.spec.js`
- [ ] Punto de inicio de turnos: cinco flujos no cierran (botón, carpeta o click tapado). `apps/citas/turnos/punto_inicio.spec.ts`
- [ ] Mobile paciente: Cypress 16 no clickea `button.fab-principal` aunque está en el DOM con opacidad 1. El `beforeEach` no llega al login y los otros 7 no corren. `apps/mobile/mobile-paciente.spec.ts`
- [ ] Novedades: la fecha de plex 7 se tipea. `plexHtml` busca `.st-area` y el `plex-text` de la descripción no lo tiene. `monitoreo/novedades.spec.js`

Estos archivos se movieron enteros. En varios también hay tests que pasaban. Al volverlos, separar el test rojo para no sacar de `cypress/e2e` lo que ya está verde: bebé, checklist, listado de agendas, punto de inicio de turnos, buscador de fichas, seguimiento, reporte de error, egreso de estadística, registro con DNI, extranjero con DNI, turnos de citas y gestor de agenda. Paciente mobile y novedades quedaron enteros en rojo.

## Skipped

Carpeta `cypress/skipped`. El `skip` sigue puesto.

- [ ] Ficha epidemiológica: se ve CLASIFICACION y el select Clasificacion no se renderiza. `apps/epidemiologia/ficha-epidemiologica.spec.ts`
- [ ] Buscador de prestaciones: el listado responde 500. `apps/buscador-prestaciones-turnos/buscador-prestaciones-turnos.spec.js`
- [ ] Detalle de farmacia: el listado no trae filas. `core/tm/farmacia/farmacia-detalle.spec.js`
- [ ] Estadística v2, ingresos y egresos: `describe.skip`. La organización por defecto no tiene `usaEstadisticaV2`. `apps/rup/internacion/estadistica-v2/`

Siguen en `cypress/e2e` porque el mismo archivo tiene tests verdes.

- [ ] Planificación: tres agendas dejan Guardar deshabilitado. `apps/citas/agendas/planificacion_agendas.spec.ts`
- [ ] HUDS: filtro ambulatorio, filtro por organización, filtro internación. `apps/huds/huds.spec.ts`
- [ ] Vacunación: Personal salud, Policía, Personas de 18 a 59 y el cartel de paciente ya inscripto. El select de grupo abre sin opciones. `apps/vacunacion/listado-vacunacion.spec.ts`
- [ ] Farmacia: crear y editar. El datetime de habilitación no está en el DOM. `core/tm/farmacia/farmacia-create.spec.ts`
- [ ] Dar turno: demanda insatisfecha. La búsqueda de la prestación no dispara el request. `apps/citas/turnos/dar_turno.spec.ts`
- [ ] Pantallas: crear pantalla de turnero. El espacio del hospital no aparece en el desplegable. `apps/pantallas/pantallas.spec.js`
- [ ] Usuarios: asignar un perfil. AGREGAR no deja la organización y no aparece el toast. `apps/gestor-usuarios/usuarios.spec.js`
- [ ] Punto de inicio, sidebar: continuar prestación, ver resumen y VER HUDS. El listado no tiene el segundo ítem. `apps/rup/punto-inicio/punto-inicio-sidebar.spec.ts`

Fuera de esta revisión, y siguen en el árbol:

- [ ] Monitoreo: eliminar un concepto turneable. `e2e/monitoreo/conceptos_turneables.spec.js`
- [ ] Mobile profesional: adjunto RUP. `e2e/apps/mobile/mobile-profesional.spec.ts`
- [ ] Buscador SNOMED: `autocitacion` pasa. `concepto cualquiera` no dispara un request que matchee `concepto+cualquiera`. `e2e/monitoreo/buscador-snomed.spec.js`
- [ ] Login de monitoreo: `cy.visit('/monitoreo')` corta con socket hang up y el login fallido no corre. En el mismo job las otras rutas de `/monitoreo/` abrieron. `e2e/monitoreo/login.spec.js`

## Huecos

- [ ] Matriculaciones no tiene specs de Cypress. El front se sirve en `/matriculaciones/` y no hay celda en la matriz.
- [x] Monitoreo y mobile tienen celda propia. El webhook ya pasa con un solo GET. Paciente y novedades quedaron en `cypress/failing`. El buscador y el login de monitoreo siguen en `e2e`.
- [ ] En planificación, Inicio está deshabilitado hasta que el formulario toma la fecha. El helper limpia con `force` porque la fecha se tipea con `skipEnter` y sin blur. Hay que salir del campo Fecha y sacar el `force`.
- [x] La matriz de `cypress/e2e` ya corrió. `seccionado` pasó en esa corrida.
