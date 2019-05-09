
/// <reference types="Cypress" />
// Prueba para realizar desde la organización Hospital Castro Rendón.

context('CITAS - Espacios físicos', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login('34377650', '159753000').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })

    it('Filtrar espacios físicos', () => {
        cy.goto('/tm/mapa_espacio_fisico', token);
        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf30"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait(3000);
        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf2a"]').click();
        cy.get('plex-button[label="Buscar"]').click();
    })
})
