describe('CITAS - Gestor de Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:agenda', { profesionales: '5d49fa8bb6834a1d95e277b8', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f505e669fe79a598efbbfd', pacientes: '586e6e8627d3107fde116cdb', estado: 'planificacion', fecha: '1', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f505e669fe79a598efbbfd', estado: 'planificacion', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { estado: 'planificacion', fecha: '-1', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { estado: 'planificacion', fecha: '1', inicio: '1', fin: '3' });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');

        cy.goto('/citas/gestor_agendas', token);
    })

    it('visualizar agendas del dia', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
    });

    it('visualizar agendas de ayer y hoy', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });

        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + Cypress.moment().add(-1, 'days').format('DD/MM/YYYY'));

        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 3);
        });
    });

    it('visualizar agendas de hoy y de mañana', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + Cypress.moment().add(-1, 'days').format('DD/MM/YYYY'));
        cy.wait('@getAgendas');
        cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + Cypress.moment().add(+1, 'days').format('DD/MM/YYYY'));
        cy.wait('@getAgendas').then((xhr) => {
            cy.get('table tbody tr').should('length', 4);
        });
    });

    it('visualizar agendas del dia y por tipo de prestacion', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });

        cy.plexSelectType('label="Prestación"', 'consulta para cuidados paliativos (procedimiento)');

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

        cy.plexSelectType('label="Prestación"', 'Consulta de cirugía general');

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
        cy.plexButtonIcon('chevron-down').click();

        cy.plexSelectAsync('label="Equipo de Salud"', 'ESPOSITO ALICIA BEATRIZ', '@getProfesionales', 0);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(1);
        });

    });

    it('filtrar agendas por profesional sin agendas', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(2);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesionales', 0);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });

    });

    it('Visualizar detalle de agenda sin turnos asignados', () => {
        cy.get('table tbody tr').first().click();
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar').plexButtonIcon('information-variant').click();
        cy.get('plex-layout-sidebar').get('label').contains('Fecha');
        cy.get('plex-layout-sidebar').get('label').contains('Tipos de prestación');
        cy.get('plex-layout-sidebar').get('label').contains('Equipo de Salud');
        cy.get('plex-layout-sidebar').get('label').contains('Espacio físico');
    });

    it('Visualizar botonera de acciones disponibles para agenda planificada', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.selectOption('label="Estado"', 'planificacion');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody tr').first().click();
        cy.get('.plex-title').plexButtonIcon('arrow-up-bold-circle');
        cy.get('.plex-title').plexButtonIcon('folder-account');
        cy.get('.plex-title').plexButtonIcon('comment-outline');
        cy.get('.plex-title').plexButtonIcon('printer');
        cy.get('.plex-title').plexButtonIcon('delete');
        cy.get('table tbody td').plexButtonIcon('pencil');
        cy.get('table tbody td').plexButtonIcon('content-copy');
    });

    it('Visualizar detalle de la configuración inicial del bloque', () => {
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'En planificación');
        cy.get('table tbody tr').first().click();
        cy.get("span").contains("En planificación")

        cy.get('plex-layout-sidebar').plexButtonIcon('cog').click();
        cy.get('plex-layout-sidebar').get('plex-help').contains('Configuración inicial del bloque');
        cy.get('plex-layout-sidebar').get('plex-help').contains('4');
        cy.get('plex-layout-sidebar').get('plex-help').contains('Turnos del día');
        cy.get('plex-layout-sidebar').get('plex-help').contains('0');
        cy.get('plex-layout-sidebar').get('plex-help').contains('Turnos programados');
        cy.get('plex-layout-sidebar').get('plex-help').contains('0');
        cy.get('plex-layout-sidebar').get('plex-help').contains('Turnos profesional');
        cy.get('plex-layout-sidebar').get('plex-help').contains('0');
        cy.get('plex-layout-sidebar').get('plex-help').contains('Turnos con llave');

        cy.get('table tbody tr').eq(1).should('length', 1);
    });
})