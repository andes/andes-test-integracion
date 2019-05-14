import {
    USER_USR_LOGIN,
    USER_PWRD_LOGIN,
    ANDES_KEY
} from '../../../../config.private';

/// <reference types="Cypress" />

context('Actividades no nominalizadas', () => {
    let token
    before(() => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
            cy.createAgenda('agenda-no-nominalizada', token);

        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)
        cy.visit(Cypress.env('BASE_URL') + '/rup', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', ANDES_KEY);
            }
        });
    })

    it('Duplicar paciente', () => {
        cy.server();

        cy.get('plex-select div input').type('actividades con la comunidad').get('div[class="selectize-dropdown-content"]').click();

        cy.get('rup-puntoinicio section div div plex-box div div table tbody tr').first().click();

        cy.get('rup-puntoinicio section div div plex-box div div table  tbody tr td plex-button').contains('INICIAR PRESTACIÓN').click();

        cy.get('div div div button').should('have.class', 'btn-success').contains('CONFIRMAR').click();

        cy.get('paciente-buscar plex-text div div input').first().type('31684354'); 

        cy.get('paciente-listado table tbody tr').first().click();

        cy.get('paciente-buscar plex-text div div input').first().clear();

        cy.get('paciente-buscar plex-text div div input').first().type('31684354');

        cy.get('paciente-listado table tbody tr').first().click();

        cy.get('div').should('have.class', 'swal2-buttonswrapper').get('button').contains('Aceptar').click();

    })
})