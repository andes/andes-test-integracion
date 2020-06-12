/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {

    let token;
    let pacientes;

    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then(ps => {
            pacientes = ps;
        });
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
            cy.route('GET', '**api/modules/cde/paciente**').as('paciente');
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        });

        it('visualiza agendas sin turnos', () => {
            cy.task('database:seed:agenda', {});
            cy.goto('/rup', token);
            cy.get('table tbody tr td div').contains('consulta con médico general');
        });

        it('no visualiza agendas de otros profesionales', () => {
            cy.cleanDB(['prestaciones']);
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', profesionales: '5c82a5a53c524e4c57f08cf3' });
            cy.goto('/rup', token);
            cy.get('table').contains('No hay agendas programadas para este día');
            cy.get('plex-radio[name="agendas"] input').eq(1).click({
                force: true
            });
            cy.get('table').first().find('tbody tr').should('have.length', 1);

        });

        it('visualizar listados agendas', () => {
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb' });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1 });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1, inicio: '2', fin: '4' });

            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.get('table').first().as('tablaAgendas');

            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 1);
            cy.wait('@prestaciones');
            cy.wait('@turnero');
            cy.wait(1000);
            cy.get('@tablaAgendas').find('tbody tr').find('td div').contains('consulta con médico general');
            cy.get('@tablaAgendas').find('tbody tr').find('td').contains('pacientes');
            cy.get('@tablaAgendas').find('tbody tr').find('td').contains('1');
            cy.get('@tablaAgendas').find('tbody tr').find('td').contains('4');


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


            cy.plexText('label="Paciente"', '10000000');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);

            cy.plexText('label="Paciente"', '{selectall}{backspace}31549269');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexSelect('name="nombrePrestacion"').find('.mdi-close-circle').click();
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 0);

            cy.plexText('label="Paciente"', '{selectall}{backspace}10000000');
            cy.get('@tablaAgendas').find('tbody tr').should('have.length', 2);
        });

    });

});