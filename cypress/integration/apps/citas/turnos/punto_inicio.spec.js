context('Agenda dinamicas', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-dinamico', token);
        });
    })

    beforeEach(() => {

    })



    it.only('dar turno agenda dinámica', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');

        cy.goto('/citas/punto-inicio', token);

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.get('tr').first().click();
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('.outline-success ').first().click();
        cy.get('plex-button[label="Dar Turno"]').click();
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });

    it('dar turno programado', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');

        cy.goto('/citas/puntoInicio', token);

        cy.get('plex-text input[type=text]').first().type('38906734').should('have.value', '38906734');
        cy.get('tr').first().click();
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('.outline-success ').first().click();
        cy.get('div').contains('08:00').first().click()
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });
});