
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

    beforeEach(() => {
        cy.goto('/tm/mapa_espacio_fisico', token);
    })

    it('Filtrar espacios físicos', () => {
        cy.server()
        //Rutas para control
        cy.route('GET', '**api/modules/turnos/agenda?fechaDesde=2019-05-09T03:00:00.000Z&fechaHasta=2019-05-10T02:59:59.999Z&organizacion=57e9670e52df311059bc8964').as('buscarEspacios');

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf30"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait(3000);  // tiempo para visualizar los espacios cargados

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf2a"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
    })
})