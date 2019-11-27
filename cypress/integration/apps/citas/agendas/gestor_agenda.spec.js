describe('CITAS - Planicar Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:agenda', { inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { estado: 'planificacion', inicio: 1, fin: 3 });
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.visit('/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }

        });
    })

    it('editar agenda publicada', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/espacioFisico**').as('getEspacioFisico');


        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('HUENCHUMAN').click();

        cy.plexButtonIcon('pencil').click();
        cy.get('.remove-button').click();

        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);
        cy.plexSelectAsync('label="Espacio Físico"', 'Huemul Consultorio 3 PB', '@getEspacioFisico', 0);

        cy.plexButton('Guardar').click();

        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('table tbody tr td').contains('Huemul Consultorio 3 PB (Huemul)');
    })

    it('editar agenda en planificación', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('En planificación').click();

        cy.plexButtonIcon('pencil').click();

        cy.swal('cancel');

        const manana = Cypress.moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Fecha"', '{selectall}{backspace}' + manana);
        // [TODO] Ver helpers para las fechas de las agendas

        // cy.plexDatetime('label="Inicio"', '{selectall}{backspace}' + '1200');
        // cy.plexDatetime('label="Fin"', '{selectall}{backspace}' + '1400');

        cy.plexSelect('label="Tipos de prestación"').find('.remove-button').click();


        cy.selectOption('label="Tipos de prestación"', '"59ee2d9bf00c415246fd3d85"');


        cy.plexSelect('label="Equipo de Salud"').find('.remove-button').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);

        cy.plexButton('Guardar').click();

        cy.get('plex-dateTime[label="Desde"] input').type('{selectall}{backspace}' + manana);
        cy.get('plex-dateTime[label="Hasta"] input').type('{selectall}{backspace}' + manana);
        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('.tipo-prestacion').contains('Consulta de ortopedia');

        // [TODO] Ver helpers para las fechas de las agendas
        // cy.get('.datos-agenda').contains(' 14:00 a 19:00 hs - ');
    })
})