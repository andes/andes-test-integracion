# Documentación de cypress

## Comandos

#### [goto](https://github.com/andes/andes-test-integracion/blob/master/cypress/support/commands.js#L64)

El comando `goto` se utiliza para navegar por las diferentes url de la aplicación.

Parémetros:

1. **url**: url del navegador
2. **token**: token JWT, setea en la sesión del navegador el token previo a navegar hacía la url. Si es `null` límpia la sesión.

Ejemplos:

```javascript
before(() => {
  cy.login("1234566", "asd").then((t) => {
    token = t;
  });
});

it("probando ruta xxx", () => {
  cy.goto("/citas/gestor_agendas", token);
});
```

```javascript
it("limpia la sesion", () => {
  cy.goto("/auth/login");
});
```
#### [route]

El comando `route` se utiliza para administrar el comportamiento de las solicitudes a la api.

Parémetros:

1. **url**: escucha una ruta que haga match con la URL especificada.
2. **method**: setear con: GET , POST , PUT , etc.
3. **response**: se puede realizar un `stub` a la ruta, es decir cuando haga match con `url` devolvera lo seteado en response.

Ejemplos:

```javascript
cy.route("POST", "**/modules/rup/prestaciones**");
```

Observación: `**` machea con cualquier cosa.

Se le puede agregar un alias para utilizarlo de forma mas ordenada:

Ejemplo:

```javascript
cy.route("POST", "**/modules/rup/prestaciones**").as("createSolicitud");
```

Luego se puede trabajar de la siguiente forma:

```javascript

cy.wait('@createSolicitud').then((xhr) => {}

```

#### [login](https://github.com/andes/andes-test-integracion/blob/master/cypress/support/commands.js#L27)

El comando `login` se utiliza loguearse a la aplicación y devuelve un token

Parémetros:

1. **usuario**: dni del usuario a loguear
2. **password**: password del usuario a loguear
2. **id**: id de la organización a la cual queremos entrar con el usuario

Observación: Hace un GET de las organizaciones. Si no recibe un id, utilizará el del primer resultado.

Ejemplos:

```javascript
cy.login("38906735", "asd").then(t => {
      token = t;
      cy.createPaciente("paciente-rup", token);
    });
```

```javascript
cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('apps/solicitud/paciente-nueva-solicitud', token);
            dni = "2006890";
        });
```


### Task [database:seed:agenda] https://github.com/andes/andes-test-integracion/edit/master/cypress/plugins/seed-agenda.js#6

El task [seed:agenda] se utiliza para crear todo tipo de agendas en la base de datos para luego poder utilizar en los test. Éstas se conformarán con los parámetros que le enviemos ya sea pacientes, tipo de prestaciones, estado, organizacion, hora de inicio, hora de fin, etc.

Ejemplos:

```javascript
cy.task("database:seed:agenda", {
  pacientes: "XXXXX",
  tipoPrestaciones: "XXXXX",
  estado: "XXXXX",
  organizacion: "XXXXX",
  inicio: X,
  fin: X,
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


El task [seed:paciente] se utiliza para crear un paciente temporal, validado o sin-documento, según se indique por parámetro. En el siguiente ejemplo se crea un paciente en estado 'validado' y se lo asigna a una variable previamente declarada.

Ejemplo:

```javascript
cy.task('database:seed:paciente', 'validado').then(paciente => {
    pacienteValidado = paciente;
});
```

El task [create:paciente] es similar a [seed:paciente] pero permite setear algunos datos. En principio crea un paciente validado con datos por defecto pero mediante el parametro 'template' es posible hacerlo a partir de un fixture determinado.
Este fixture debe estar ubicado en './data/paciente' y comenzar con el prefijo 'paciente-'. 

Ejemplos: 

```javascript
cy.task('database:create:paciente', { 
  documento: 'XXXXX', 
  nombre: 'XXXXX', 
  apellido: 'XXXXX', 
  teléfono: 'XXXXX'
});

cy.task('database:create:paciente', {
  template: 'paciente-XXXXX'
});
```

El task [create:maquinaEstados] crea una máquina de estados de internacion, que por defecto toma el fixture ubicado en '/data/internacion/maquina-estados-default' y luego, mediante el paso de paramentros se puede modificar particularmente la organizacion, el ámbito, la capa, los estados y las relaciones que puede tener esta máquina de estados. 

Ejemplo: 
```javascript
cy.task('database:create:maquinaEstados', { 
  organizacion: 'IdOrganizacion', 
  ambito: 'Internacion', 
  capa: 'Medica', 
  estados: [ {}, {}, {} ],
  relaciones: [ {}, {}, {} ]
});
```

#### [plexText]

El comando `plexText` se utiliza para el ingreso de datos en un plexText determinado

Parémetros:

1. **label**: label correspondiente al plexText dentro del HTML.
2. **text**: texto que se ingresa en el plexText.

Ejemplos:

```javascript
// Ejemplo 1
cy.plexText('label="Apellido"', "Martinez");
```

```javascript
// Ejemplo 2
cy.get("rup-buscador").plexText('name="search"', "{selectall}{backspace}");
```
