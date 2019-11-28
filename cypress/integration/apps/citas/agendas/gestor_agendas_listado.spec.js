
context('CITAS - Gestor de Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:agenda', { profesionales: '5d49fa8bb6834a1d95e277b8', inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f505e669fe79a598efbbfd', pacientes: '586e6e8627d3107fde116cdb', estado: 'planificacion', fecha: 1, inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f505e669fe79a598efbbfd', estado: 'planificacion', inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { estado: 'planificacion', fecha: -1, inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { estado: 'planificacion', fecha: 1, inicio: 1, fin: 3 });
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');

        cy.goto('/citas/gestor_agendas', token);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

    })

    it('visualizar agendas del dia', () => {
        cy.get('table tbody tr').should('length', 2);
    });


    it('visualizar agendas de ayer y hoy', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });

        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        let ayerMoment = Cypress.moment().add(-1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Desde"', { text: ayerMoment, clear: true });

        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 3);
        });
    });

    it('visualizar agendas de hoy y de mañana', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        let ayerMoment = Cypress.moment().add(-1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Desde"', { text: ayerMoment, clear: true });
        cy.wait('@getAgendas');
        let manianaMoment = Cypress.moment().add(+1, 'days').format('DD/MM/YYYY');
        cy.plexDatetime('label="Hasta"', { text: manianaMoment, clear: true });
        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 4);
        });

    });

    it('visualizar agendas del dia y por tipo de prestacion', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexSelectAsync('label="Prestación"', 'Consulta de cardiología', '@getTiposPrestacion', 0);

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });

    it('visualizar agendas por tipo de prestacion inexistente', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('label="Prestación"', 'Consulta de cirugía general', '@getTiposPrestacion', 0);

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });

    });

    it('visualizar agendas por profesional', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();

        cy.plexSelectAsync('label="Equipo de Salud"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales', 0);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });

    });

    it('filtar agendas por profesional sin agendas', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesionales', 0);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });

    it('visualizar agendas por profesional', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales', 0);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });


    it('Visualizar detalle de agenda sin turnos asignados', () => {
        cy.get('table tbody tr').first().click();
        const bloquesTurnos = cy.get('div.bloques-y-turnos')
        bloquesTurnos.plexButtonIcon('chevron-down').click();
        bloquesTurnos.get('label').contains('Fecha');
        bloquesTurnos.get('label').contains('Tipos de prestación');
        bloquesTurnos.get('label').contains('Equipo de Salud');
        bloquesTurnos.get('label').contains('Espacio físico');
    });

    it('Visualizar botonera de acciones para agenda planificada', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.selectOption('label="Estado"', 'planificacion');
        cy.get('table tbody tr').first().click();
        cy.get('botones-agenda').plexButtonIcon('pencil');
        cy.get('botones-agenda').plexButtonIcon('arrow-up-bold-circle-outline');
        cy.get('botones-agenda').plexButtonIcon('arrow-up-bold-circle');
        cy.get('botones-agenda').plexButtonIcon('delete');
        cy.get('botones-agenda').plexButtonIcon('content-copy');
        cy.get('botones-agenda').plexButtonIcon('comment-outline');
        cy.get('botones-agenda').plexButtonIcon('printer');
        cy.get('botones-agenda').plexButtonIcon('folder-account');
    });

    it('Visualizar detalle de agenda con un solo tipo de prestación, publicada y con turnos asignados', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'En planificación');
        cy.get('table tbody tr').first().click();
        cy.get("span").contains("En planificación")
        cy.plexButtonIcon('chevron-down').click();
        cy.get('label').contains("Fecha").parent().contains(
            `${Cypress.moment().format('DD/MM/YYYY')}, ${Cypress.moment().add(1, 'hours').set({ 'minute': 0, 'second': 0 }).format('HH:mm')} a ${Cypress.moment().add(3, 'hours').set({ 'minute': 0, 'second': 0 }).format('HH:mm')} hs`);

        cy.get('label').contains("Tipos de prestación").parent().contains('consulta para cuidados paliativos (procedimiento)');
        cy.get('label').contains("Equipo de Salud").parent().get('div').contains('HUENCHUMAN, NATALIA VANESA');
        cy.get('label').contains("Espacio físico").parent().get('div').contains('Espacio físico no asignado');

        //TODO: TESTS PARA CONTADORES DE TURNOS

        cy.get('table.table-striped tbody tr').eq(1).should('length', 1);
    });
})