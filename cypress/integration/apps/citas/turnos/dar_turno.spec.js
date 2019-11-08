context('punto de inicio', () => {

    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createAgenda('apps/citas/turnos/agendaDinamicaDarTurno', 0, 0, 1, token);
            cy.createAgenda('apps/citas/turnos/agendaDarTurnoProgramado', 8, null, null, token);
            cy.createPaciente('apps/citas/turnos/paciente-turnos', token);
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/citas/punto-inicio', token);
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/log/paciente?idPaciente=**').as('seleccionPaciente');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('seleccionAgenda');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');        
        cy.darTurno('**api/core/mpi/pacientes/57f3b5d579fe79a598e6281f', token);
    })


    it('Buscar agenda por prestación (0 resultados)', () => {
        cy.wait('@prestaciones');
        cy.selectOption('name="tipoPrestacion"', '"59ee2d9bf00c415246fd3d94"');
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });


    it('Buscar agenda por prestación (2 resultados)', () => {
        cy.wait('@prestaciones');
        cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(2);
        });
    });


    it('Buscar agenda por profesional (0 resultados)', () => {
        cy.wait('@prestaciones');
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });

    it('Buscar agenda por profesional (1 resultados)', () => {
        cy.wait('@prestaciones');
        cy.plexSelectAsync('name="profesional"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });
    });

    it('dar turno', () => {
        cy.wait('@prestaciones');
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@prestaciones', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(2);
            
        });
        cy.plexSelectAsync('name="profesional"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales', 0);
        // cy.wait('@cargaAgendas');
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });

        cy.get('div[class="dia"]').contains(Cypress.moment().add(8, 'days').format('D')).click();
        cy.wait('@seleccionAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();


        cy.get('label').contains("Paciente").parent().contains('TURNO, PACIENTE');
        cy.get('label').contains("Tipo de prestación").parent().contains('consulta con médico oftalmólogo');
        cy.get('label').contains("Equipo de Salud").parent().contains('ESPOSITO, ALICIA BEATRIZ');


        cy.plexButton('Confirmar').click();
        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        //      cy.plexSelectType('name="prepagas"').click().get('.option').contains('ASISTIR S.A.').click({force: true});
    });


    it('dar turno agenda dinámica', () => {
        cy.wait('@prestaciones');
        cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
        cy.wait('@cargaAgendas');
        cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
        cy.wait('@seleccionAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        // cy.get('plex-button[label="Dar Turno"]').click();
        cy.plexButton('Dar Turno').click();
        cy.plexButton('Confirmar').click();
        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });


    it('dar turno programado', () => {
        cy.wait('@prestaciones');
        cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
        if (Cypress.moment().add(8, 'days').month() > Cypress.moment().month()) {
            cy.get('plex-button[icon="chevron-right"]').click();
        }
        cy.wait('@cargaAgendas');
        cy.wait(1000);
        cy.get('div[class="dia"]').contains(Cypress.moment().add(8, 'days').format('D')).click();
        cy.wait('@seleccionAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();
        cy.plexButton('Confirmar').click();
        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });


});