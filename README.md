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

Happy coding!