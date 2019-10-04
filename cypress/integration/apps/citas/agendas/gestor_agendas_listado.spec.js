context('TM Profesional', () => {
    let token
    before(() => {
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createAgenda('apps/citas/agendaMedicinaGeneralPlanificada', 0, 0, 1, token);
            cy.createAgenda('apps/citas/agendaMedicinaGeneralPlanificada', -1, 0, 1, token);
        });
    })

    beforeEach(() => {
        cy.server();
        let hoy = Cypress.moment().format('YYYY-MM-DD');
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=' + hoy + '**').as('getAgendas');
        let ayer = Cypress.moment().add(-1, 'days').format('YYYY-MM-DD');
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=' + ayer + '**').as('getAgendasAyer');
        cy.goto('/citas/gestor_agendas', token);

    })

    it('visualizar agendas del dia', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.log(xhr.response.body);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });


    it('visualizar agendas de ayer y hoy', () => {
        cy.wait('@getAgendas');
        let ayerMoment = Cypress.moment().add(-1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Desde"').clear();
        cy.plexDatetime('label="Desde"', ayerMoment);
        cy.wait('@getAgendasAyer').then((xhr) => {
            cy.get('table tbody tr').should('length', 2);

        });

    });

})