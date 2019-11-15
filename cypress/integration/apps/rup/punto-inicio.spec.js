/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token;

    before(() => {
        cy.viewport(1280, 720);
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    describe('listado de agendas y prestaciones', () => {
        beforeEach(() => {
            cy.server();
            cy.route('GET', '**/api/modules/turnos/agenda?**').as('agendas')
        });

        it('no visualiza agendas sin turnos', () => {
            cy.createAgenda('apps/rup/agenda-sin-paciente', 0, 1, 2, token);
            cy.goto('/rup', token);
            cy.get('table').contains('No hay agendas programadas para este día');
        });

        it('vizualizar listados agendas', () => {
            cy.createAgenda('apps/rup/agenda-con-paciente', 0, 3, 4, token);
            cy.createAgenda('apps/rup/agenda-con-paciente', -1, 1, 2, token);
            cy.createAgenda('apps/rup/agenda-con-paciente', -1, 3, 4, token);
            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.get('table').first().as('tablaAgendas');

            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
            cy.get('@tablaAgendas').find('tbody tr').find('td div').contains('consulta con médico general');
            cy.get('@tablaAgendas').find('tbody tr').find('td').contains('pacientes 1 / 1');

            cy.plexDatetime('name="horaInicio"').find('.mdi-menu-left').click();
            cy.wait('@agendas');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);


            cy.log('Filtro por prestación');
            cy.plexSelect('name="nombrePrestacion"').click();
            cy.plexSelect('name="nombrePrestacion"', '598ca8375adc68e2a0c121bc').click();
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexSelect('name="nombrePrestacion"').click();
            cy.plexSelect('name="nombrePrestacion"', '598ca8375adc68e2a0c121b9').click();
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);


            cy.plexText('label="Buscar paciente"', '31549268');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);

            cy.plexText('label="Buscar paciente"', '{selectall}{backspace}31549269');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexSelect('name="nombrePrestacion"').find('.mdi-close-circle').click();
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexText('label="Buscar paciente"', '{selectall}{backspace}31549268');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);
        });
    });

    describe('navegacion', () => {
        beforeEach(() => {
            cy.goto('/rup', token)
        });

        it('iniciar prestacion fuera de agenda', () => {
            cy.plexButton('PACIENTE FUERA DE AGENDA').click();
            cy.url().should('include', '/rup/crear/fueraAgenda')
        });

        it('ver huds', () => {
            cy.plexButton('HUDS DE UN PACIENTE').click();
            cy.url().should('include', '/rup/huds')
        });

        it('autocitar paciente', () => {
            cy.plexButton('PACIENTE AUTOCITADO').click();
            cy.url().should('include', '/rup/crear/autocitar')
        });
    });

    describe('acciones de agendas en sidebar', () => {
        beforeEach(() => {
            cy.seed();
            cy.server();
            cy.route('GET', '**/api/modules/turnos/agenda?**').as('agendas');
            cy.route('POST', '**/api/modules/rup/prestaciones**').as('crearPrestacion');
        });

        it('Visualizar boton "iniciar prestacion"', () => {
            let idPrestacion;

            cy.createAgenda('apps/rup/agenda-con-paciente', 0, 1, 2, token);
            let dtoValidacion = {
                op: 'estadoPush',
                estado: { tipo: 'validada' }
            };
            cy.createPaciente('paciente-turno', token);
            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.get('table').first().as('tablaAgendas');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
            cy.plexButton('INICIAR PRESTACIÓN').click();
            cy.swal('confirm');
            cy.wait('@crearPrestacion').then((xhr) => {
                cy.log(xhr.response.body.id);
            });
            cy.url().should('include', '/rup/ejecucion/').then($url => {
                const parts = $url.split('/');
                idPrestacion = parts[parts.length - 1];

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('CONTINUAR REGISTRO').click();

                cy.url().should('include', '/rup/ejecucion/');
                cy.plexButton('Guardar consulta con médico general').click();
                cy.url().should('include', '/rup/validacion/');

                cy.log(idPrestacion);
                cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('VER RESÚMEN').click();
                cy.url().should('include', '/rup/validacion/' + idPrestacion);

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('VER HUDS').click();
                cy.url().should('include', '/rup/vista/');
            });

        });

    });

    describe.only('prestaciones fuera de agenda', () => {
        let idPrestacion;
        let dtoValidacion = {
            op: 'estadoPush',
            estado: { tipo: 'validada' }
        };

        beforeEach(() => {
            cy.seed();
            cy.server();
            cy.createPaciente('paciente-turno', token);
            cy.createPrestacion('apps/rup/prestacion-ejecucion-sin-turno', token, {
                fecha: Cypress.moment()
            });
        });

        it('Visualizar boton "continuar registro" en prestacion fuera de agenda', () => {
            cy.goto('/rup', token);
            cy.plexButton('CONTINUAR REGISTRO').click();

            cy.url().should('include', '/rup/ejecucion/').then($url => {
                const parts = $url.split('/');
                idPrestacion = parts[parts.length - 1];

                cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);
                cy.goto('/rup', token);
                get('table').find('td').contains('Fuera de agenda').click();
                cy.plexButton('VER RESUMEN');
            });
        });
    })
});