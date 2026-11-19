# andes-test-integracion
Test de integración para Andes


## Instalación 

```bash
$ npm install
```

### Producción

De la siguiente forma se corren los test apuntando a `master`:

- **npm run prod:update** - Actualiza las imágenes de docker. 
- **npm run prod:up** - inicia los contenedores de docker.
- **npm run prod** - Ejecuta los tests con cypress .


### Develop

Cuando se está desarrollando una nueva funcionalidad o fixeando un bug y se desarrollan casos de test para la misma se debe tener en cuenta las siguientes cosas: 

1. Levantar la api con:

```
npm run testing
```

2. Levantar la APP Angular normalmente.

3. Correr los siguientes comandos: 

- **npm run dev:up** - inicia los contenedores de docker.
- **npm run dev** - Ejecuta los tests con cypress apuntando a la api/app local.

### PACS

Stack aparte, con su propia red: API y app publicadas, Mongo, dcm4chee, Keycloak, OHIF y dcm4che-tools. No toca los compose de dev ni de prod.

- **npm run pacs:up** - levanta el stack y configura el cliente `andes` en Keycloak.
- **npm run pacs:reset** - carga el seed en el Mongo de este stack (`localhost:27067`).
- **npm run pacs:down** - baja el stack y borra sus volúmenes.

Para usarlo: `npm run pacs:up` y después `npm run pacs:reset`. La app queda en `http://localhost:8090`. La API publica el `3003`, el archive HTTP el `8080` y DICOM el `11112`, Keycloak el `8880` y OHIF el `8888`.

`npm run pacs:test` inicia una radiografía simple, confirma la worklist con `findscu`, envía el estudio con `storescu` y abre OHIF desde VER IMAGEN. El stack tiene que estar arriba.

Happy coding!