import { USER_USR_LOGIN, USER_PWRD_LOGIN, } from '../../../../../config.private'

/// <reference types="Cypress" />

/* Test realizado para prueba de issue #909 basado en un usuario de la DB de testing-sss.
/ IMPORTANTE: Si en el monitor en el que se esta visualizando la prueba, el input "Asistencia a
    prácticas" es muy pequeño se deberá modificar el zoom de la pantalla para poder ver el
    contenido del mismo.
*/

context('Registro de prestaciones', () => {
    let token
    before(() => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/rup/ejecucion/5cd0466acc826c1fc2cfe5fc', token);
    })

    it("Campo 'minutos' en consulta de enfermería", () => {
        cy.get('plex-int[name="asistenciaPracticas"] input[type="text"]').type('120');
    });

});