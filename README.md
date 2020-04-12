# andes-test-integracion
Test de integración para Andes


## Instalación 

```bash
$ npm install
```

### Comandos

De la siguiente forma se corren los test apuntando a `master`:

- **npm run prod:update** - Actualiza las imágenes de docker. 
- **npm run prod:up** - inicia los contenedores de docker.
- **npm run prod** - Ejecuta los tests con cypress .

Cuando se está desarrollando una nueva funcionalidad o fixeando un bug y se desarrollan casos de test para la misma se debe tener en cuenta las siguientes cosas: 

1. Setear las siguientes variables de entorno o apuntar a la api en desarrollo a los siguientes HOST:

```
ELASTIC_HOST=http://localhost:9266
MONGO_MAIN=mongodb://localhost:27066
MONGO_MPI=mongodb://localhost:27066
MONGO_SNOMED=mongodb://localhost:27066
MONGO_PUCO=mongodb://localhost:27066
MONGO_LOGS=mongodb://localhost:27066
```

2. Levantar la APP Angular

3. Correr los siguientes comandos: 

- **npm run dev:up** - inicia los contenedores de docker.
- **npm run dev** - Ejecuta los tests con cypress apuntando a la api/app local.

Happy coding!