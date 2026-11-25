# andes-test-integracion

Suite de integración de Andes. Cypress 16.3.0 corre en Chrome.

Lo que no entra en una corrida de `cypress/e2e` está en [TODO.md](TODO.md): los bugs de app y de api en `cypress/failing`, los specs en skip en `cypress/skipped`, y los `it.skip` que siguen dentro de un archivo con tests verdes.

## Corrida

El workflow es **Test de integración** (`.github/workflows/test.yml`). Se dispara a mano.

Los inputs `app`, `api`, `tests`, `matriculaciones`, `monitoreo` y `mobile` tienen default `master`. El stack se elige primero. `andes` es el default. Un archivo, varios separados por coma, o una carpeta, corren un solo job de ese stack.

| Stack | Grupos | Specs |
| --- | --- | --- |
| `andes` | `core`, `citas`, `rup-internacion`, `rup`, `apps`, `monitoreo`, `mobile` | `cypress/e2e`, sin `apps/pacs` |
| `pacs` | `pacs` | `cypress/e2e/apps/pacs` |
| `recetar` | sin grupos | |

`andes` usa el compose liviano: nginx en el `8080` y Mongo en el `27017`. `pacs` levanta `docker/docker-compose-pacs.yml`: la app, la API, dcm4chee, Keycloak, OHIF y dcm4che-tools. La app queda en el `8090`, Mongo en el `27067` y OHIF en el `8888`. `recetar` todavía no tiene grupos ni compose.

`todos`, o el nombre del stack sin grupos, corre los grupos de ese stack. Un grupo elige dentro del stack. `cypress/failing` y `cypress/skipped` quedan en `andes`. Para verlos, `spec` es `cypress/failing` o `cypress/skipped`.

Un grupo rojo no corta a los demás. Cada uno sube el informe `informe-cypress-<grupo>` (HTML y capturas) y se guarda 7 días. No se graba en Cypress Cloud.

El job de tests hace checkout de la rama `tests` y mergea `origin/master` en local, sin push. Node 22, huso `America/Argentina/Buenos_Aires`. Las imágenes salen con el SHA corto. Nginx junta app, matriculaciones, monitoreo y mobile, y proxea `/api/`.

```bash
gh workflow run test.yml --ref master \
  -f app=master -f api=master -f tests=master \
  -f matriculaciones=master -f monitoreo=master -f mobile=master
```

Para un solo grupo de `andes`, agregar `-f grupos=mobile,monitoreo`. Para un spec, `-f spec=cypress/e2e/apps/mobile`. Para el PACS, `-f stack=pacs`.

## Desde un PR

App, api, mobile, monitoreo y matriculaciones llaman este workflow en cada push. La imagen de ese repo es el commit del PR. El resto queda en `master`. Para otra rama se descomenta la línea, por ejemplo `app: mi-rama`. El bloque elige un stack y, si hace falta, grupos de ese stack. `api`, `app` y `matriculaciones` no son stacks ni grupos. `todos` corre los grupos del stack, que es `andes` si no se nombró otro.

### Personalizar los tests desde un Pull Request

Los tests de integración se configuran desde la descripción del Pull Request, utilizando un bloque `Test`.

El workflow del repositorio consumidor lee este bloque y determina qué stack, grupos o especificaciones ejecutar, así como las ramas de los componentes que se utilizarán.

#### Formato

Agregar `### Test` en la descripción del PR y debajo un bloque de código:

```text
### Test

```
andes
mobile
app: feature/mi-rama
```
```

Cada línea representa una opción de configuración. No es YAML: no se utilizan claves, indentación ni listas YAML.

#### Qué se puede configurar

**1. Stack**

Selecciona el contexto de ejecución:

| Valor | Descripción |
|---|---|
| `andes` | Suite principal de ANDES. Es el valor por defecto. |
| `pacs` | Suite de integración de PACS. |
| `recetar` | Stack reservado para Recetar. Actualmente no tiene grupos ni tests configurados. |

Seleccionar solamente un stack ejecuta todos sus grupos:

```text
### Test

```
pacs
```
```

**2. Grupos**

Permite ejecutar uno o varios grupos dentro del stack seleccionado.

Grupos disponibles:

| Stack | Grupos |
|---|---|
| `andes` | `core`, `citas`, `rup-internacion`, `rup`, `apps`, `monitoreo`, `mobile` |
| `pacs` | `pacs` |

Ejemplo: ejecutar solamente mobile y monitoreo:

```text
### Test

```
andes
mobile
monitoreo
```
```

Si no se especifica un stack, el grupo determina automáticamente a qué stack pertenece.

**3. Specs o directorios**

También se puede seleccionar directamente un archivo, varios archivos o una carpeta de Cypress.

Las rutas deben ser relativas a la raíz del repositorio de tests.

Ejemplo:

```text
### Test

```
cypress/e2e/apps/mobile
```
```

Varios archivos:

```text
### Test

```
cypress/e2e/apps/mobile/login.cy.ts
cypress/e2e/apps/mobile/menu.cy.ts
```
```

La selección por rutas no se combina con grupos. Todas las rutas deben pertenecer al mismo stack.

También se pueden seleccionar los tests que todavía están en desarrollo:

```text
### Test

```
cypress/failing
```
```

O los que están temporalmente excluidos:

```text
### Test

```
cypress/skipped
```
```

**4. Ramas de los componentes**

Se pueden indicar ramas o referencias Git específicas para utilizar versiones particulares de los componentes.

Formato:

```text
componente: rama
```

Componentes disponibles:

| Componente | Repositorio |
|---|---|
| `app` | `andes/app` |
| `api` | `andes/api` |
| `tests` | `andes/andes-test-integracion` |
| `matriculaciones` | `andes/matriculaciones` |
| `monitoreo` | `andes/monitoreo-app` |
| `mobile` | `andes/mobile-app` |

Si no se especifica una rama, se utiliza `master`.

Ejemplo:

```text
### Test

```
andes
mobile
app: feature/nueva-interfaz
tests: feature/nuevos-specs
```
```

**Importante:** el repositorio que origina el Pull Request utiliza automáticamente el SHA del commit del PR. Si se especifica una rama para ese mismo componente, se ignora y prevalece el SHA del PR.

#### Ejecutar todos los grupos

La palabra `todos` permite indicar explícitamente que se quieren ejecutar todos los grupos del stack.

```text
### Test

```
andes
todos
```
```

También se puede utilizar únicamente:

```text
### Test

```
todos
```
```

En ese caso se utiliza el stack `andes`.

`todos` no se puede combinar con grupos ni rutas específicas. Sí puede combinarse con la selección de stack y ramas.

#### Reglas importantes

- Se admite un solo stack por ejecución.
- Los grupos deben pertenecer al stack seleccionado.
- Las rutas de specs deben pertenecer a un único stack.
- No se pueden combinar grupos y rutas de specs.
- Los nombres de grupos y stacks deben coincidir con los valores disponibles.
- Las referencias Git deben ser válidas.
- El bloque `Test` debe estar delimitado por triple backticks.
- Si no existe el bloque `Test`, o está vacío, no se ejecuta la suite de integración.

#### Ejemplos rápidos

| Objetivo | Configuración |
|---|---|
| Todos los tests de ANDES | `andes` |
| Todos los tests de PACS | `pacs` |
| Solo mobile | `mobile` |
| Core y citas | `core` + `citas` |
| Todos los grupos de ANDES | `todos` |
| Una carpeta específica | `cypress/e2e/apps/mobile` |
| Tests con una rama alternativa de app | `app: feature/mi-rama` |

La selección se procesa automáticamente al crear o actualizar el Pull Request. No es necesario ejecutar manualmente el workflow de integración.

## Local

Hace falta Node 22. `npm ci`.

Contra la api y la app en la máquina:

1. Levantar la api en testing.
2. Levantar la app.
3. `npm run dev:up` y `npm run dev`.

`npm run dev:run` corre Cypress en la terminal. `npm run report` arma el HTML.

### PACS

`npm run pacs:up` levanta el mismo compose que el stack `pacs` y configura el cliente `andes` en Keycloak. `npm run pacs:reset` carga el seed en `localhost:27067`. `npm run pacs:test` corre la radiografía. `npm run pacs:down` baja el stack y borra sus volúmenes.

La app queda en `http://localhost:8090`. La API publica el `3003`, el archive HTTP el `8080` y DICOM el `11112`, Keycloak el `8880` y OHIF el `8888`.
