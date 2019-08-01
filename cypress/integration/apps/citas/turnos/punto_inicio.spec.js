context('Agenda dinamicas', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createAgenda('apps/citas/turnos/agendaDinamicaDarTurno', 0, 0, 1, token);
        });
    })

    beforeEach(() => {

    })



    it('dar turno agenda dinámica', () => {
        cy.server();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');

        cy.goto('/citas/punto-inicio', token);

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906735').click();

        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121d5"]').click();
        cy.wait('@cargaAgendas');
        cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
        cy.get('plex-button[label="Dar Turno"]').click();
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });

    it('dar turno programado', () => {
        cy.server();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');

        cy.goto('/citas/punto-inicio', token);

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906735').click();

        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click();

        // Hay una agenda creada dentro de los 7 dias y puede caer en el proximo mes
        if (Cypress.moment().add(7, 'days').month() > Cypress.moment().month()) {
            cy.get('plex-button[icon="chevron-right"]').click();
        }
        cy.wait('@cargaAgendas');
        cy.get('app-calendario .dia').contains(Cypress.moment().add(7, 'days').date()).click();
        cy.get('div').contains('10:00').first().click()
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });
});