context('CITAS - Gestor de Agendass', () => {
    let token
    before(() => {
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createAgenda('apps/citas/agendaMedicinaGeneralPlanificada', 0, 0, 1, token);
            cy.createAgenda('apps/citas/agendaMedicinaGeneralPlanificada', -1, 0, 1, token);
            cy.createAgenda('apps/citas/agendaMedicinaGeneralPlanificada', 1, 0, 1, token);
            cy.createAgenda('apps/citas/turnos/agendaTurnoDia', 0, 0, 1, token);

        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        
        cy.goto('/citas/gestor_agendas', token);

    })

    it('visualizar agendas del dia', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.log(xhr.response.body);
            expect(xhr.response.body.length).to.be.eq(2);
        });

    });


    it('visualizar agendas de ayer y hoy', () => {
        cy.wait('@getAgendas');
        let ayerMoment = Cypress.moment().add(-1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Desde"').clear();
        cy.plexDatetime('label="Desde"', ayerMoment);
        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 3);

        });

    });
    
    
    it('visualizar agendas de hoy y de mañana', () => {
        cy.wait('@getAgendas');
        let ayerMoment = Cypress.moment().add(-1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Desde"').clear();
        cy.plexDatetime('label="Desde"', ayerMoment);
        let manianaMoment = Cypress.moment().add(+1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Hasta"').clear();
        cy.plexDatetime('label="Hasta"', manianaMoment);
        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 4);
        });

    });

    it('visualizar agendas del dia y por tipo de prestacion', () => {
        cy.wait('@getAgendas');
        cy.wait('@getTiposPrestacion');
        cy.plexSelectType('label="Prestación"', 'Consulta de cardiología');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });

    it('visualizar agendas por tipo de prestacion inexistente', () => {
        cy.wait('@getAgendas');
        cy.wait('@getTiposPrestacion');
        cy.plexSelectType('label="Prestación"', 'Consulta de cirugía general');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });

    });

    it('visualizar agendas por profesional', () => {
        cy.wait('@getAgendas');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales',0);
        cy.wait(200);
        cy.wait('@getAgendas');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });

    it.only('filtar agendas por profesional sin agendas', () => {
        cy.wait('@getAgendas');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesionales',0);
        cy.wait(200);
        cy.wait('@getAgendas');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });

    });

})