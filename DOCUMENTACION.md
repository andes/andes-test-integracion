# Documentación de cypress

## Comandos

#### [goto](https://github.com/andes/andes-test-integracion/blob/master/cypress/support/commands.js#L64)

El comando `goto` se utiliza para navegar por las diferentes url de la aplicación. 

Parémetros:
1) __url__: url del navegador 
2) __token__: token JWT, setea en la sesión del navegador el token previo a navegar hacía la url. Si es `null` límpia la sesión.

Ejemplos: 

```javascript
before(() => {
    cy.login('1234566', 'asd').then(t => {
        token = t;
    });
});

it('probando ruta xxx', () => {
    cy.goto('/citas/gestor_agendas', token);
});
```

```javascript
 
it('limpia la sesion', () => {
    cy.goto('/auth/login');
});
```



### Task [database:seed:agenda] https://github.com/andes/andes-test-integracion/edit/master/cypress/plugins/seed-agenda.js#6 

El task [seed:agenda] se utiliza para crear todo tipo de agendas en la base de datos para luego poder utilizar en los test. Éstas se conformarán con los parámetros que le enviemos ya sea pacientes, tipo de prestaciones, estado, organizacion, hora de inicio, hora de fin, etc.

Ejemplos:

```javascript
cy.task('database:seed:agenda', {
    pacientes: 'XXXXX',
    tipoPrestaciones: 'XXXXX',
    estado: 'XXXXX',
    organizacion: 'XXXXX',
    inicio: X,
    fin: X
});
```

También se puede utilizar de esta manera para ir armando un arreglo de agendas y correrle diferentes test a cada una con una sentencia forEach(tipo de agenda, indice de agenda).

```javascript
cy.task('database:seed:agenda', {
    inicio: X,
    fin: X,
    tipoPrestaciones: 'XXXXX'
}).then(agenda => agendas['no-nominalizada'] = agenda);

cy.task('database:seed:agenda', {
    inicio: X,
    fin: X,
    pacientes: pacientes:'XXXXX',
}).then(agenda => agendas['dinamica'] = agenda);

['no-nominalizada', 'dinamica'].forEach((typeAgenda, agendaIndex) => {
    // Se listan los diferentes test
})

```

#### [route]

El comando `route` se utiliza  para administrar el comportamiento de las solicitudes a la api.

Parémetros:
1) __url__: escucha una ruta que haga match con la URL especificada.
2) __method__: setear con:  GET , POST , PUT , etc.
3) __response__: se puede realizar un `stub` a la ruta, es decir cuando haga match con `url` devolvera lo seteado en response.

Ejemplos: 

```javascript

cy.route('POST', '**/modules/rup/prestaciones**');

```

Observación: `**` machea con cualquier cosa.

Se le puede agregar un alias para utilizarlo de forma mas ordenada:

Ejemplo:

```javascript

cy.route('POST', '**/modules/rup/prestaciones**').as('createSolicitud');

```
Luego se puede trabajar de la siguiente forma:

```javascript

cy.wait('@createSolicitud').then((xhr) => {}

```     