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



### Task