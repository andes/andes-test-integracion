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

### Personalizar los tests desde un Pull Request

Los tests se configuran desde la descripción del PR mediante un bloque `Test`.

El contenido del bloque se interpreta línea por línea. Cada línea representa una opción de selección.

#### Formato

```markdown
### Test

andes
mobile
monitoreo
app: feature/mi-rama
```

#### Seleccionar un stack

El stack determina qué suite de integración ejecutar.

```markdown
### Test

pacs
```

Stacks disponibles:

| Stack | Descripción |
|---|---|
| `andes` | Suite principal de ANDES (default) |
| `pacs` | Suite de integración PACS |
| `recetar` | Reservado para Recetar |

#### Seleccionar grupos

Se pueden agregar varios grupos, uno por línea.

```markdown
### Test

andes
mobile
monitoreo
```


Grupos disponibles:

| Stack | Grupos |
|---|---|
| `andes` | `core`, `citas`, `rup-internacion`, `rup`, `apps`, `monitoreo`, `mobile` |
| `pacs` | `pacs` |

Si no se especifica el stack, se determina automáticamente a partir del grupo.

#### Seleccionar specs o directorios

Se pueden seleccionar archivos individuales, varios archivos o directorios completos.

```markdown
### Test

cypress/e2e/apps/mobile
```

Varios archivos:

```markdown
### Test

cypress/e2e/apps/mobile/login.cy.ts
cypress/e2e/apps/mobile/menu.cy.ts
```

También se pueden ejecutar los tests pendientes o excluidos:

```markdown
### Test

cypress/failing
```

```markdown
### Test

cypress/skipped
```


Las rutas se interpretan desde la raíz del repositorio de tests. No se pueden combinar rutas con grupos.

#### Personalizar las ramas

Se pueden indicar ramas específicas para los componentes de la integración.

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

Ejemplo:

```markdown
### Test

andes
mobile
app: feature/nueva-interfaz
tests: feature/nuevos-specs
```

Por defecto, los componentes utilizan la rama `master`.

El repositorio que origina el PR utiliza automáticamente el SHA del commit que dispara el workflow. Si se especifica una rama para ese mismo componente, se ignora.

#### Ejecutar todos los grupos

Se puede utilizar `todos` para ejecutar todos los grupos del stack seleccionado.

```markdown
### Test

andes
todos
```

También se puede omitir el stack:

```markdown
### Test

todos
```

En ese caso se utiliza `andes`.

`todos` no se puede combinar con grupos ni rutas específicas. Sí admite la selección de stack y ramas.

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
