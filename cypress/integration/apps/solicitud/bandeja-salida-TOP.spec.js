const faker = require('faker');
context('punto de inicio', () => {
    let token;
    let prestacion;
    let auditable;
    const DNI = '36425896';
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.viewport(1280, 720);

        cy.task('database:seed:agenda', { tipoPrestaciones: ['59ee2d9bf00c415246fd3d6b'], profesionales: ['5d49fa8bb6834a1d95e277b8'], estado: 'disponible', fecha: 2, inicio: 1, fin: 3, tipo: 'gestion' });
        cy.createReglaTOP('solicitudes/regla-top', token);
        cy.createSolicitud('solicitudes/solicitudAuditable', token, Cypress.moment().add(2, 'days').format('YYYY-MM-DD')).then(response => auditable = response.body);
        cy.createSolicitud('solicitudes/solicitudNormal', token, Cypress.moment().add(2, 'days').format('YYYY-MM-DD'))
            .then(response => prestacion = response.body);
        cy.createPaciente('paciente-masculino', token);

        cy.goto('/solicitudes', token);
        cy.route('GET', '**/api/auth/organizaciones**')
        cy.route('POST', '**/api/auth/organizaciones**')
        cy.route('POST', '**/api/modules/turnos/agenda**')
        cy.route('POST', '**/api/modules/top/reglas**')
        cy.route('POST', '**/api/modules/rup/prestaciones**').as('normal')

    });

    it('Gabo Confirmieri anulación de solicitud', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-tabs .nav-item').contains('Solicitudes de Salida').click();

        cy.plexButtonIcon('delete').click();

        cy.get('.swal2-confirm.btn-success').click();

        cy.toast('info', 'Prestación cancelada');

    });

    it('Gabo Cancellieri anulación de solicitud', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-tabs .nav-item').contains('Solicitudes de Salida').click();

        cy.plexButtonIcon('delete').click();

        cy.get('.swal2-cancel.btn-danger').click();

    });

});
