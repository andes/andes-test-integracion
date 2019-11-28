context('punto de inicio', () => {
    let token;
    let solicitud;
    const DNI = '36425896';
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('30643636', 'asd').then(t => {
            token = t;
            // cy.createAgenda48hs('agenda-publicada', token);
            cy.task('database:seed:agenda', { tipoPrestaciones: ['59ee2d9bf00c415246fd3d6b'], profesionales: ['5d49fa8bb6834a1d95e277b8'], estado: 'disponible', fecha: 2, inicio: 1, fin: 3, tipo: 'gestion' });
            cy.createReglaTOP('solicitudes/regla-top', token);
            cy.createSolicitud('solicitudes/solicitudAuditable', token, Cypress.moment().add(2, 'days').format('YYYY-MM-DD'));
            cy.createSolicitud('solicitudes/solicitudNormal', token, Cypress.moment().add(2, 'days').format('YYYY-MM-DD'))
                .then(solicitudCreada => {
                    solicitud = solicitudCreada;
                });
            cy.createPaciente('paciente-masculino', token);
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/solicitudes', token);
        cy.route('GET', '**/api/auth/organizaciones**')
        cy.route('POST', '**/api/auth/organizaciones**')
        cy.route('POST', '**/api/modules/turnos/agenda**')
        cy.route('POST', '**/api/modules/top/reglas**')
        cy.route('POST', '**/api/modules/rup/prestaciones**').as('auditable')
        cy.route('POST', '**/api/modules/rup/prestaciones**').as('normal')

    });

    it('Dar Turno a Solicitud pendiente', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-button[icon="calendar-plus"]').click();

        cy.wait('@pacientes');
        cy.wait('@tiposPrestaciones');
        cy.wait('@turnos');
        cy.wait('@obraSocial');

        cy.wait(1000);
        cy.get('.outline-success').first().click();

        cy.get('.outline-dashed-default').first().click();

        cy.plexButton('Confirmar').click();

    });
});
