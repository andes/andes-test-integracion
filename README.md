# Tests de integración de ANDES

Este repositorio reúne las pruebas automatizadas de integración de ANDES. Se utiliza Cypress con Chrome para comprobar el funcionamiento conjunto de los sistemas y detectar regresiones antes de incorporar cambios.

Las pruebas se pueden ejecutar desde un Pull Request (PR), manualmente desde GitHub Actions o en un entorno local.

El documento está organizado de la siguiente manera:

1. [Ejecutar tests desde un Pull Request](#1-ejecutar-tests-desde-un-pull-request).
2. [Referencia de configuración](#2-referencia-de-configuración).
3. [Ejecución manual desde GitHub Actions](#3-ejecutar-tests-manualmente-desde-github-actions).
4. [Consulta de resultados](#4-consultar-resultados).
5. [Pruebas pendientes o excluidas](#5-pruebas-pendientes-o-excluidas).
6. [Ejecución local](#6-ejecución-local).
7. [Funcionamiento técnico](#7-funcionamiento-técnico).

## 1. Ejecutar tests desde un Pull Request

Esta es la modalidad habitual durante el desarrollo. No es necesario ejecutar comandos ni levantar Docker localmente.

### 1.1. Completar la plantilla del PR

Al crear o editar un PR en un repositorio que tenga habilitada la integración:

1. Localizar la sección `### Test` de la descripción. Si no aparece en la plantilla, agregarla con el formato indicado abajo.
2. Dentro del bloque de código, quitar el `#` inicial de las opciones que se quieran activar, o escribir las opciones directamente.
3. Dejar comentadas o eliminar las opciones que no se necesiten.
4. Guardar la descripción del PR.

La sección `Test` de la plantilla está organizada en cuatro bloques de configuración:

1. **Stack:** permite seleccionar el entorno de integración. Por defecto, se utiliza `andes`, salvo que la selección corresponda a otro stack.
2. **Grupos de tests:** permite seleccionar uno o varios grupos del stack correspondiente o utilizar `todos`.
3. **Archivos o directorios específicos:** permite ejecutar pruebas puntuales mediante sus rutas, como alternativa a la selección de grupos.
4. **Ramas de los repositorios:** permite utilizar versiones alternativas de los componentes involucrados en las pruebas.

No es necesario completar los cuatro bloques. Solo se debe descomentar las opciones necesarias para cada ejecución. Consultar la sección 2.3 para conocer las limitaciones actuales de la selección de ramas.

Por ejemplo, para ejecutar únicamente el grupo `citas`, el Markdown de la descripción debe quedar así:

~~~~markdown
### Test

<!--
Descomentá las opciones que correspondan a los tests que quieras ejecutar.
Si dejás todas las opciones comentadas, no se ejecutarán los tests.

Documentación:
https://github.com/andes/andes-test-integracion#readme
-->

```
# 1. STACK (entorno de integración)
# Seleccionar como máximo uno. Por defecto: andes.

# andes
# pacs

# 2. GRUPOS DE TESTS
# Seleccionar uno o varios grupos del stack correspondiente.
# Usar "todos" para ejecutar todos los grupos del stack.

# todos

# Grupos del stack ANDES:
# core
citas
# rup-internacion
# rup
# apps
# monitoreo
# mobile

# 3. ARCHIVOS O DIRECTORIOS ESPECÍFICOS (opcional)
# Alternativa a la selección de grupos.
# No combinar con grupos ni con "todos".

# cypress/e2e/apps/mobile

# 4. RAMAS DE LOS REPOSITORIOS (opcional)
# Descomentar y reemplazar "master" por la rama deseada.
# El repositorio del PR utiliza automáticamente el commit del PR.

# app: master
# api: master
# mobile: master
# monitoreo: master
# matriculaciones: master
# tests: master
```
~~~~

**Importante:** conservar el encabezado `### Test` y las tres comillas invertidas (backticks) de apertura y cierre. El workflow busca el bloque de código posterior a ese encabezado. Las líneas que comienzan con `#` dentro del bloque son comentarios: no activan pruebas.

En los ejemplos siguientes se omiten los comentarios de la plantilla para facilitar la lectura. No es necesario borrar los comentarios de un PR real.

### 1.2. ¿Cuándo se ejecutan los tests?

En el workflow de PR, la selección se procesa al abrir, reabrir o editar el PR, y al subir nuevos commits. Si hay una ejecución anterior en curso para ese PR, se cancela al iniciarse una nueva.

| Contenido del bloque `Test` | Resultado |
| --- | --- |
| Bloque ausente, vacío o completamente comentado | No se ejecuta Cypress. |
| Únicamente ramas de componentes (válidas y reconocidas como tales) | No se seleccionan pruebas. |
| Un grupo, stack, ruta o `todos` | Se ejecuta la selección correspondiente. |
| Configuración inválida | Falla la selección; consultar el job **Bloque Test**. |

El workflow de API solo ejecuta la integración para PR cuyo repositorio de origen es el mismo repositorio de destino (no forks).

### 1.3. Ejemplos frecuentes

#### Probar un módulo: citas

~~~~markdown
### Test
```
citas
```
~~~~

#### Probar los módulos del grupo apps con una rama alternativa de API

Ejemplo de un PR en un repositorio distinto de API:

~~~~markdown
### Test
```
apps
api: prueba-test
```
~~~~

Se ejecutan únicamente las pruebas del grupo `apps` (ver el detalle en la sección 2.2), utilizando la rama `prueba-test` de API. Si el PR pertenece a API, se utiliza su commit HEAD y no hace falta especificar la rama.

#### Probar varios grupos: RUP e internación

~~~~markdown
### Test
```
rup
rup-internacion
```
~~~~

#### Ejecutar todos los grupos del entorno principal

~~~~markdown
### Test
```
todos
```
~~~~

Es equivalente a seleccionar únicamente `andes`. No incluye las pruebas de PACS ni los tests excluidos de la corrida habitual.

#### Probar una integración con PACS

~~~~markdown
### Test
```
pacs
```
~~~~

#### Ejecutar únicamente los tests de un directorio

~~~~markdown
### Test
```
cypress/e2e/apps/mobile
```
~~~~

También se pueden indicar archivos individuales mediante su ruta relativa al repositorio de tests. Para seleccionar varios archivos, escribir una ruta por línea.

#### Probar cambios de API que dependen de una rama de APP

Ejemplo de un PR abierto en `andes/api`:

~~~~markdown
### Test
```
citas
app: feature/nuevos-turnos
```
~~~~

Se prueba el commit del PR de API junto con la rama indicada de APP. El resto de los componentes utiliza `master`.

#### Probar cambios junto con nuevos tests de integración

~~~~markdown
### Test
```
citas
tests: feature/test-turnos
```
~~~~

Utilizar el nombre real de la rama creada en `andes-test-integracion`.

#### No ejecutar tests de integración

~~~~markdown
### Test
```
# citas
# todos
```
~~~~

## 2. Referencia de configuración

### 2.1. Conceptos

| Concepto | Significado | Ejemplo |
| --- | --- | --- |
| Stack | Entorno de servicios en el que se ejecutan las pruebas. | `andes`, `pacs` |
| Grupo | Selección predefinida de pruebas relacionadas. | `citas`, `rup` |
| Spec | Archivo de pruebas de Cypress; también se pueden seleccionar directorios por ruta. | Un archivo `.spec.ts` |
| Componente | Repositorio cuya versión se puede elegir para construir el entorno. | `app`, `api` |

Seleccionar un grupo determina qué pruebas se ejecutan, no qué repositorios se construyen.

### 2.2. Stacks y grupos disponibles

| Stack | Grupos | Alcance |
| --- | --- | --- |
| `andes` (predeterminado) | `core`, `citas`, `rup-internacion`, `rup`, `apps`, `monitoreo`, `mobile` | Pruebas del entorno principal. |
| `pacs` | `pacs` | Integración de imágenes médicas. |
| `recetar` | Ninguno | Reservado, todavía no operativo. |

Cuando se elige un grupo o una ruta sin indicar el stack, la acción del PR determina el entorno correspondiente. `todos` sin stack selecciona `andes`.

#### ¿Qué pruebas incluye cada grupo?

La siguiente tabla detalla la selección exacta de rutas definida en la matriz del [workflow de integración](.github/workflows/test.yml). Todas las rutas de la tabla son relativas a `cypress/e2e/`; para seleccionar una ruta directamente en el bloque `Test`, anteponer ese prefijo.

| Stack | Grupo | Módulos o funcionalidades | Rutas relativas a `cypress/e2e/` |
| --- | --- | --- | --- |
| `andes` | `core` | Núcleo del sistema | `core/` |
| `andes` | `citas` | Citas y turnos | `apps/citas/` |
| `andes` | `rup-internacion` | Internación | `apps/rup/internacion/` |
| `andes` | `rup` | Elementos RUP, punto de inicio, ejecución y colonoscopía | `apps/rup/elementos-rup/`<br>`apps/rup/punto-inicio/`<br>`apps/rup/ejecucion/`<br>`apps/rup/colonoscopia.spec.ts` |
| `andes` | `apps` | Auditoría, COM, epidemiología, formularios, gestor de usuarios, HUDS, pantallas, perinatal, PUCO, vacunación y visualización de información | `apps/auditoria/`<br>`apps/com/`<br>`apps/epidemiologia/`<br>`apps/forms/`<br>`apps/gestor-usuarios/`<br>`apps/huds/`<br>`apps/pantallas/`<br>`apps/perinatal/`<br>`apps/puco/`<br>`apps/vacunacion/`<br>`apps/visualizacion-informacion/` |
| `andes` | `monitoreo` | Monitoreo | `monitoreo/` |
| `andes` | `mobile` | Aplicación móvil | `apps/mobile/` |
| `pacs` | `pacs` | Integración de imágenes médicas | `apps/pacs/` |

Cada grupo seleccionado ejecuta un job de Cypress independiente. Las carpetas se recorren en forma recursiva buscando archivos `.spec.ts`, `.spec.js`, `.spec.jsx` y `.spec.tsx`.

**Importante:** `apps` es un grupo del stack `andes`, no un stack ni un componente. Incluye únicamente los once directorios indicados; no equivale a seleccionar toda la carpeta `cypress/e2e/apps/` ni a ejecutar todos los tests de ANDES. Por ejemplo, citas, RUP, internación y mobile tienen grupos propios. Seleccionar `apps` tampoco modifica la versión del componente `app`.

Para ejecutar únicamente los tests de HUDS, sin ejecutar los otros módulos del grupo `apps`, utilizar la ruta `cypress/e2e/apps/huds` en lugar del nombre del grupo.

### 2.3. Versiones de los componentes

| Identificador | Repositorio |
| --- | --- |
| `app` | [andes/app](https://github.com/andes/app) |
| `api` | [andes/api](https://github.com/andes/api) |
| `tests` | [andes/andes-test-integracion](https://github.com/andes/andes-test-integracion) |
| `matriculaciones` | [andes/matriculaciones](https://github.com/andes/matriculaciones) |
| `monitoreo` | [andes/monitoreo-app](https://github.com/andes/monitoreo-app) |
| `mobile` | [andes/mobile-app](https://github.com/andes/mobile-app) |

En un PR, la versión del repositorio que origina el PR es su commit HEAD (SHA). Los demás usan `master`, salvo que se indique una rama alternativa reconocida por la acción. No es necesario indicar la rama del propio PR: su SHA tiene prioridad.

La sintaxis prevista para seleccionar una versión alternativa es `componente: nombre-de-rama`. La rama debe existir en el repositorio indicado.

El checkout de `tests` incorpora los cambios de `origin/master` mediante un merge local en el runner, sin modificar la rama remota. Si hay conflictos, falla el job.

**Limitación actual:** `mobile` y `monitoreo` también son nombres de grupos. La [acción de selección](.github/actions/seleccion/index.js) reconoce esos nombres como grupos antes de procesar sus ramas. Por eso, actualmente `mobile: mi-rama` y `monitoreo: mi-rama` no seleccionan la versión solicitada desde un PR. Si además se incluye el grupo con el mismo nombre, la acción rechaza el duplicado. Hasta corregir el parser, utilizar la ejecución manual para seleccionar esas versiones (indicando también la rama del repositorio que se desea probar). No afecta al SHA automático cuando el PR pertenece a uno de esos componentes.

### 2.4. Reglas del bloque Test

- Los títulos numerados y las instrucciones que comienzan con `#` dentro del bloque de código son comentarios y no afectan la ejecución.
- No es obligatorio eliminar las opciones que no se utilicen: pueden permanecer comentadas.
- Los cuatro bloques de configuración tienen una finalidad organizativa; el parser los interpreta como un único bloque `Test`.
- No es necesario respetar el orden de las opciones dentro del bloque `Test`, siempre que se cumplan las reglas de combinación.
- Utilizar una opción por línea.
- Seleccionar como máximo un stack por ejecución.
- Los grupos y rutas deben corresponder a un mismo stack.
- Elegir grupos, rutas o `todos`, sin mezclar esos tres mecanismos.
- Se admite indicar el stack y ramas adicionales junto con cualquiera de los mecanismos anteriores, con la limitación de ramas indicada en la sección 2.3.
- Para probar archivos excluidos, indicar `cypress/failing` o `cypress/skipped` como ruta.
- Evitar rutas absolutas, comodines y nombres duplicados. Las rutas se expresan desde la raíz de este repositorio.
- No usar `recetar` hasta que se encuentre implementado su entorno.

Ejemplos de configuraciones incorrectas (contenido dentro del bloque):

| Selección (opciones en líneas distintas) | Motivo |
| --- | --- |
| `andes` + `pacs` | Dos stacks. |
| `pacs` + `citas` | El grupo no pertenece al stack. |
| `todos` + `citas` | Selección total y parcial simultáneas. |
| `citas` + `cypress/e2e/apps/mobile` | Mezcla de grupo y ruta. |
| `app` | Es un componente, no un grupo; necesita una rama. |
| `app:` | Falta la referencia. |
| `recetar` | No hay grupos habilitados. |

Una ruta con formato válido o una referencia de rama bien escrita no garantiza que exista. Los errores de checkout, construcción o búsqueda de specs pueden aparecer posteriormente.

## 3. Ejecutar tests manualmente desde GitHub Actions

Esta modalidad permite probar ramas específicas sin abrir un PR y repetir pruebas de forma independiente.

1. Ingresar a [Actions](https://github.com/andes/andes-test-integracion/actions) en este repositorio.
2. Seleccionar **Test de integración** y luego **Run workflow**.
3. Mantener `master` como rama del workflow salvo que se esté probando una modificación del propio workflow.
4. Completar los parámetros y confirmar la ejecución.

| Parámetro | Valor predeterminado | Uso |
| --- | --- | --- |
| `stack` | `andes` | Entorno de pruebas. |
| `grupos` | Vacío | Nombres separados por comas. |
| `spec` | Vacío | Rutas de archivos o directorios, separadas por comas. |
| `app`, `api`, `tests`, `matriculaciones`, `monitoreo`, `mobile` | `master` | Versión de cada repositorio. |

Si `grupos` y `spec` están vacíos, se ejecutan todos los grupos del stack. Para una selección por rutas, completar únicamente `spec`; técnicamente el workflow prioriza este campo si ambos tienen contenido, pero es preferible evitar esa combinación. Para PACS, indicar `stack=pacs`.

### Desde la terminal (GitHub CLI)

Requiere `gh` autenticado y permisos para lanzar workflows. Desde cualquier directorio:

```bash
# Todos los grupos de ANDES
gh workflow run test.yml -R andes/andes-test-integracion --ref master

# Dos grupos
gh workflow run test.yml -R andes/andes-test-integracion --ref master -f grupos=citas,rup

# Un directorio
gh workflow run test.yml -R andes/andes-test-integracion --ref master -f spec=cypress/e2e/apps/mobile

# PACS
gh workflow run test.yml -R andes/andes-test-integracion --ref master -f stack=pacs

# Mobile con una rama alternativa
gh workflow run test.yml -R andes/andes-test-integracion --ref master -f grupos=mobile -f mobile=feature/mi-rama
```

## 4. Consultar resultados

Desde un PR, ingresar al detalle del check **Test de integración**. Desde una ejecución manual, abrir la corrida en la pestaña Actions.

- **Bloque Test:** interpreta la configuración del PR.
- **Entradas / Carpetas:** validan los parámetros y preparan la selección.
- **Imagen ...:** preparan las imágenes de los componentes.
- **Cypress (grupo):** ejecuta las pruebas. Si se eligieron rutas, el job se identifica como `Cypress (spec)`.

Los grupos se ejecutan en jobs independientes; un fallo de Cypress en uno no cancela los demás. Los informes HTML y capturas disponibles se descargan como artefactos (`informe-cypress-` seguido del nombre del grupo o `spec`). Se conservan durante siete días. No se utiliza Cypress Cloud.

Si un check aparece omitido, revisar primero si se activó alguna prueba en el bloque `Test`. Si falla antes de Cypress, consultar el job que falló: puede ser un problema de configuración, construcción de imágenes o preparación del entorno, no necesariamente una regresión funcional.

## 5. Pruebas pendientes o excluidas

Consultar [TODO.md](TODO.md) para conocer las pruebas que no integran la ejecución habitual:

| Ubicación | Contenido |
| --- | --- |
| `cypress/failing` | Pruebas asociadas a errores conocidos. |
| `cypress/skipped` | Archivos excluidos de la corrida habitual. |
| `it.skip` | Casos individuales deshabilitados dentro de un archivo. |

Los dos primeros directorios pueden seleccionarse expresamente por ruta en el stack `andes`. Seleccionar un archivo no elimina los `it.skip` que contenga. `todos` no reactiva casos deshabilitados.

## 6. Ejecución local

### Entorno principal

Requisitos: Node.js 22, dependencias de Cypress, Docker con Compose y los proyectos APP y API preparados para ejecutarse localmente.

Desde la raíz de este repositorio:

```bash
npm ci
```

Iniciar API en modo testing y APP en el entorno local. Luego:

```bash
npm run dev:up
npm run dev
```

Para ejecutar desde la terminal y generar el informe HTML:

```bash
npm run dev:run
npm run report
```

### PACS

```bash
npm run pacs:up     # Iniciar servicios y configurar Keycloak
npm run pacs:reset  # Cargar datos iniciales de prueba
npm run pacs:test   # Ejecutar la prueba de radiografía
npm run pacs:down   # Detener los servicios y eliminar sus volúmenes
```

**Atención:** `pacs:down` elimina los volúmenes del entorno PACS de pruebas.

## 7. Funcionamiento técnico

El [workflow principal](.github/workflows/test.yml) admite ejecución manual y llamadas desde otros workflows. Los repositorios consumidores delegan la interpretación del bloque del PR a la [acción de selección](.github/actions/seleccion/index.js).

Las imágenes se construyen una vez por ejecución mediante los workflows de cada componente y se identifican por el SHA abreviado. Los jobs de Cypress reutilizan esas imágenes, preparan el stack correspondiente y ejecutan las pruebas con Node.js 22, Cypress 16.3.0 y Chrome. Se configura la zona horaria `America/Argentina/Buenos_Aires`.

Nginx sirve APP, matriculaciones, monitoreo y mobile, y redirige `/api/` a la API.

| Servicio | Stack ANDES (CI) | Stack PACS |
| --- | --- | --- |
| Entrada web | `8080` | `8090` |
| MongoDB | `27017` | `27067` |
| API publicada | — | `3003` |
| Archivo DICOM HTTP | — | `8080` |
| DICOM | — | `11112` |
| Keycloak | — | `8880` |
| OHIF | — | `8888` |

El entorno PACS agrega dcm4chee, Keycloak, OHIF y herramientas dcm4che mediante [su configuración Docker Compose](docker/docker-compose-pacs.yml). Los puertos de ANDES corresponden al runner de CI, no necesariamente a los proyectos levantados localmente.