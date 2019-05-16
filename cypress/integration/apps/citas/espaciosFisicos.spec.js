import { USER_USR_LOGIN, USER_PWRD_LOGIN } from '../../../../config.private'
/// <reference types="Cypress" />
// Prueba para realizar desde la organización Hospital Castro Rendón.

context('CITAS - Espacios físicos', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })

    beforeEach(() => {
        cy.goto('/tm/mapa_espacio_fisico', token);
    })

    it('Filtrar espacios físicos', () => {
        cy.server()
        //Rutas para control
        cy.route('GET', '**api/modules/turnos/agenda?fechaDesde**').as('buscarEspacios');

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf30"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf2a"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
    })
})