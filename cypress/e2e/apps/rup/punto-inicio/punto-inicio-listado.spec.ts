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
            cy.intercept('GET', '**/api/modules/turnos/agenda**').as('agendas');
            cy.intercept('POST', '**/api/modules/rup/prestaciones**').as('crearPrestacion');
            cy.intercept('GET', '**/api/modules/rup/prestaciones**').as('prestaciones');
            cy.intercept('GET', '**/api/modules/turnero/pantalla**').as('turnero');
            cy.intercept('GET', '**/api/modules/rup/elementosRUP**').as('elementosRUP');
            cy.intercept('GET', '**api/modules/cde/paciente**').as('paciente');
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        });

        it('visualiza agendas sin turnos', () => {
            cy.task('database:seed:agenda', {});
            cy.goto('/rup', token);
            cy.get('plex-item').contains('consulta con médico general');
        });

        it('no visualiza agendas de otros profesionales', () => {
            cy.cleanDB(['prestaciones', 'agenda']);
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', profesionales: '5c82a5a53c524e4c57f08cf3' });
            cy.goto('/rup', token);
            cy.get('plex-label').contains('Comienza buscando una agenda');
            cy.get('plex-radio[name="agendas"] input').eq(1).click({
                force: true
            });
            cy.wait('@prestaciones')
            cy.get('plex-item').contains('PEREZ, MARIA').click();
        });

        it('visualizar listados agendas', () => {
            const msgSinResultados = 'No hay resultados';
            cy.cleanDB(['prestaciones', 'agenda']);
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb' });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1 });
            cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', fecha: -1, inicio: '2', fin: '4' });

            cy.goto('/rup', token);

            cy.wait('@agendas');
            cy.get('plex-list').as('tablaAgendas');

            cy.get('@tablaAgendas').should('have.length', 1);
            cy.wait('@prestaciones');

            cy.get('@tablaAgendas').contains('consulta con médico general');
            cy.get('@tablaAgendas').contains('pacientes');
            cy.get('@tablaAgendas').contains('1');
            cy.get('@tablaAgendas').contains('4');

            cy.plexDatetime('name="horaInicio"').find('.adi-menu-left').click();
            cy.wait('@agendas');
            cy.get('@tablaAgendas').find('plex-item').should('have.length', 2)

            // Filtro por prestación
            cy.plexSelect('name="nombrePrestacion"').click();
            cy.plexSelect('name="nombrePrestacion"', '598ca8375adc68e2a0c121bc').click();
            cy.get('plex-label').contains(msgSinResultados);

            cy.plexSelect('name="nombrePrestacion"').click();
            cy.plexSelect('name="nombrePrestacion"', '598ca8375adc68e2a0c121b9').click();
            cy.get('@tablaAgendas').find('plex-item').should('have.length', 2);

            cy.plexText('label="Paciente"', '10000000');
            cy.get('@tablaAgendas').find('plex-item').should('have.length', 2);

            cy.plexText('label="Paciente"', '{selectall}{backspace}31549269');
            cy.get('plex-label').contains(msgSinResultados);
            cy.plexSelect('name="nombrePrestacion"').find('.adi-close-circle').click();
            cy.get('plex-label').contains(msgSinResultados);

            cy.plexText('label="Paciente"', '{selectall}{backspace}10000000');
            cy.get('@tablaAgendas').find('plex-item').should('have.length', 2);
        });

    });

});