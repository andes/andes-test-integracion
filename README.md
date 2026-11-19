# andes-test-integracion

Suite de integración de Andes. Cypress 16.3.0 corre en Chrome.

Lo que no entra en una corrida de `cypress/e2e` está en [TODO.md](TODO.md): los bugs de app y de api en `cypress/failing`, los specs en skip en `cypress/skipped`, y los `it.skip` que siguen dentro de un archivo con tests verdes.

## Corrida

El workflow es **Test de integración** (`.github/workflows/test.yml`). Se dispara a mano.

Los inputs `app`, `api`, `tests`, `matriculaciones`, `monitoreo` y `mobile` tienen default `master`. `spec` vacío corre la matriz. Un archivo, varios separados por coma, o una carpeta, corren un solo job.

Grupos:

| Grupo | Specs |
| --- | --- |
| `core` | `cypress/e2e/core` |
| `citas` | `cypress/e2e/apps/citas` |
| `rup-internacion` | `cypress/e2e/apps/rup/internacion` |
| `rup` | elementos RUP, punto de inicio, ejecución y colonoscopia |
| `apps` | el resto de `cypress/e2e/apps`, sin citas, rup, mobile ni pacs |
| `monitoreo` | `cypress/e2e/monitoreo` |
| `mobile` | `cypress/e2e/apps/mobile` |
| `pacs` | `cypress/e2e/apps/pacs` |

`pacs` no entra en la matriz ni en `todos`. Se pide con `grupos=pacs` o con un spec bajo `cypress/e2e/apps/pacs`. Ese job levanta `docker/docker-compose-pacs.yml`: la app, la API, dcm4chee, Keycloak, OHIF y dcm4che-tools. La app queda en el `8090`, Mongo en el `27067` y OHIF en el `8888`. El resto de los grupos sigue con el compose liviano, nginx en el `8080`.

`cypress/failing` y `cypress/skipped` quedan afuera de esa matriz. Para verlos, `spec` es `cypress/failing` o `cypress/skipped`.

Un grupo rojo no corta a los demás. Cada uno sube el informe `informe-cypress-<grupo>` (HTML y capturas) y se guarda 7 días. No se graba en Cypress Cloud.

El job de tests hace checkout de la rama `tests` y mergea `origin/master` en local, sin push. Node 22, huso `America/Argentina/Buenos_Aires`. Las imágenes salen con el SHA corto. Nginx junta app, matriculaciones, monitoreo y mobile, y proxea `/api/`.

```bash
gh workflow run test.yml --ref master \
  -f app=master -f api=master -f tests=master \
  -f matriculaciones=master -f monitoreo=master -f mobile=master
```

Para un solo grupo, agregar `-f spec=cypress/e2e/apps/mobile`. Para unas celdas, `-f grupos=mobile,monitoreo`. Para el PACS, `-f grupos=pacs`.

## Desde un PR

App, api, mobile, monitoreo y matriculaciones llaman este workflow en cada push. La imagen de ese repo es el commit del PR. El resto queda en `master`. Para otra rama se descomenta la línea, por ejemplo `app: mi-rama`. Corre el grupo que se descomenta. `api`, `app` y `matriculaciones` no son grupos. `todos` corre la matriz, sin `pacs`.

## Local

Hace falta Node 22. `npm ci`.

Contra la api y la app en la máquina:

1. Levantar la api en testing.
2. Levantar la app.
3. `npm run dev:up` y `npm run dev`.

`npm run dev:run` corre Cypress en la terminal. `npm run report` arma el HTML.

### PACS

`npm run pacs:up` levanta el mismo compose que el grupo `pacs` y configura el cliente `andes` en Keycloak. `npm run pacs:reset` carga el seed en `localhost:27067`. `npm run pacs:test` corre la radiografía. `npm run pacs:down` baja el stack y borra sus volúmenes.

La app queda en `http://localhost:8090`. La API publica el `3003`, el archive HTTP el `8080` y DICOM el `11112`, Keycloak el `8880` y OHIF el `8888`.
