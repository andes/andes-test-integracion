/// <reference types="Cypress" />

/* Test realizado para prueba de issue #909 basado en un usuario de la DB de testing-sss.
/ IMPORTANTE: Si en el monitor en el que se esta visualizando la prueba, el input "Asistencia a
    prácticas" es muy pequeño se deberá modificar el zoom de la pantalla para poder ver el
    contenido del mismo.
*/

context('Registro de prestaciones', () => {
    let token
    before(() => {
        cy.login('34377650', '159753000').then(t => {
            token = t;
        })
    })


    it("Campo 'minutos' en consulta de enfermería", () => {

        cy.visit(Cypress.env('BASE_URL') + '/rup/ejecucion/5cd0466acc826c1fc2cfe5fc', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        })
        cy.wait(3000);
        cy.get('plex-int[name="asistenciaPracticas"] input[type="text"]').type('120');
    });

});