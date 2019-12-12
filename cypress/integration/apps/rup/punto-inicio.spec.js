/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token;

    before(() => {
        // cy.viewport(1358, 636);
        cy.seed();
        cy.task('database:seed:paciente');
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    describe('listado de agendas y prestaciones', () => {
        beforeEach(() => {
            cy.server();
            cy.route('GET', '**/api/modules/turnos/agenda**').as('agendas');
            cy.route('POST', '**/api/modules/rup/prestaciones**').as('crearPrestacion');
            cy.route('GET', '**/api/modules/rup/prestaciones**').as('prestaciones');
            cy.route('GET', '**/api/modules/turnero/pantalla**').as('turnero');
            cy.route('GET', '**/api/modules/rup/elementosRUP**').as('elementosRUP');
            cy.route('GET', '**/api/auth/organizaciones**').as('organizaciones');
            cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');
            cy.route('GET', '**api/modules/cde/paciente**').as('paciente');
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        });

        it('no visualiza agendas sin turnos', () => {
            cy.task('database:seed:agenda');
            cy.goto('/rup', token);
            cy.get('table').contains('No hay agendas programadas para este día');
        });

        it('no visualiza agendas de otros profesionales', () => {
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', profesionales: '5c82a5a53c524e4c57f08cf3' });
            cy.goto('/rup', token);
            cy.get('table').contains('No hay agendas programadas para este día');

            cy.plexButtonIcon('asterisk').click();
            cy.get('table').first().find('tbody tr').should('have.length', 1);

        });

        it('visualizar listados agendas', () => {
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb' });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1 });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1, inicio: 2, fin: 4 });

            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.get('table').first().as('tablaAgendas');

            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
            cy.wait('@prestaciones');
            cy.wait('@tiposPrestaciones');
            cy.wait('@organizaciones');
            cy.wait('@turnero');
            cy.wait(1000);
            cy.get('@tablaAgendas').find('tbody tr').find('td div').contains('consulta con médico general');
            cy.get('@tablaAgendas').find('tbody tr').find('td').contains('pacientes 1 / 4');

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


            cy.plexText('label="Buscar paciente"', '10000000');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);

            cy.plexText('label="Buscar paciente"', '{selectall}{backspace}31549269');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexSelect('name="nombrePrestacion"').find('.mdi-close-circle').click();
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexText('label="Buscar paciente"', '{selectall}{backspace}10000000');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);
        });
    });

    describe('navegacion', () => {
        beforeEach(() => {
            cy.goto('/rup', token);
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
            cy.route('GET', '**/api/modules/turnos/agenda**').as('agendas');
            cy.route('POST', '**/api/modules/rup/prestaciones**').as('crearPrestacion');
            cy.route('GET', '**/api/modules/rup/prestaciones**').as('prestaciones');
            cy.route('GET', '**/api/modules/turnero/pantalla**').as('turnero');
            cy.route('GET', '**/api/modules/rup/elementosRUP**').as('elementosRUP');
            cy.route('GET', '**/api/auth/organizaciones**').as('organizaciones');
            cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');
            cy.route('GET', '**api/modules/cde/paciente**').as('paciente');
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        });

        it('Visualizar boton "iniciar prestacion"', () => {
            let idPrestacion;
            cy.task('database:seed:paciente', 'validado');
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb' });
            let dtoValidacion = {
                op: 'estadoPush',
                estado: { tipo: 'validada' }
            };
            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.wait('@prestaciones');
            cy.wait('@tiposPrestaciones');
            cy.wait(1000);
            cy.get('table').first().as('tablaAgendas');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
            cy.plexButton('INICIAR PRESTACIÓN').click();
            cy.swal('confirm');
            cy.wait('@crearPrestacion');
            cy.url().should('include', '/rup/ejecucion/').then($url => {
                const parts = $url.split('/');
                idPrestacion = parts[parts.length - 1];

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@prestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@organizaciones');
                cy.wait('@turnero');
                cy.wait(1000);
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('CONTINUAR REGISTRO').click();

                cy.url().should('include', '/rup/ejecucion/');
                cy.plexButton('Guardar consulta con médico general').click();
                cy.url().should('include', '/rup/validacion/');

                cy.log(idPrestacion);
                cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);

                cy.goto('/rup', token);
                cy.wait('@prestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@organizaciones');
                cy.wait('@agendas');
                cy.wait(1000);
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('VER RESUMEN').click();
                cy.url().should('include', '/rup/validacion/' + idPrestacion);

                cy.goto('/rup', token);
                cy.wait('@prestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@organizaciones');
                cy.wait('@agendas');
                cy.wait(1000);
                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
                cy.plexButton('VER HUDS').click();
                cy.url().should('include', '/rup/vista/');
            });

        });

    });

    describe('prestaciones fuera de agenda', () => {
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
            cy.wait(1000);
            cy.get('table').first().find('tbody tr').eq(1).click();
            cy.plexButton('CONTINUAR REGISTRO').click();

            cy.url().should('include', '/rup/ejecucion/').then($url => {
                const parts = $url.split('/');
                idPrestacion = parts[parts.length - 1];

                cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);
                cy.goto('/rup', token);
                cy.wait(1000);
                cy.get('table').find('td').contains('Fuera de agenda').click();
                cy.plexButton('VER RESUMEN');
            });
        });
    })
});