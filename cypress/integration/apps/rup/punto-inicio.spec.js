/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })

    it.skip('Iniciar prestación - Fuera de agenda', () => {
        cy.goto('/rup', token);

        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

        cy.wait('@prestaciones');
        cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
        cy.get('plex-text input').first().type('11181222');
        cy.get('table tbody tr').first().click();

        cy.get('plex-button[label="INICIAR PRESTACIÓN"]').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('5951051aa784f4e1a8e2afe1');
            expect(xhr.response.body.paciente.documento).to.be.eq('11181222');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
    });
});