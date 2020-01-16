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

        cy.plexText('name="motivoConsulta"').should('have.value', prestacion.solicitud.registros[0].valor.solicitudPrestacion.motivo);

        cy.plexButton('Confirmar').click();

        cy.toast('info', 'El turno se asignó correctamente');


    });

    it('Anular solicitud', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-button[icon="delete"]').click();

        var motivo = faker.lorem.sentence();

        cy.plexTextArea('name="motivo"', motivo)
        cy.plexButton('Confirmar').click();

        cy.toast('error', 'Solicitud Anulada');
    });

    it('Comprobar detalle de solicitud', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('table > tbody > tr > td').first().click();

        cy.get('detalle-solicitud .row .col span').eq(0).contains(`${auditable.paciente.nombre} ${auditable.paciente.apellido}`);
        cy.get('detalle-solicitud .row .col span').eq(1).contains(`${auditable.solicitud.profesionalOrigen.nombre} ${auditable.solicitud.profesionalOrigen.apellido}`);
        cy.get('detalle-solicitud .row .col span').eq(2).contains(auditable.solicitud.tipoPrestacionOrigen.term);
        cy.get('detalle-solicitud .row .col span').eq(3).contains(auditable.solicitud.organizacionOrigen.nombre);
        cy.get('detalle-solicitud .row .col span').eq(4).contains(`${auditable.solicitud.profesional.nombre} ${auditable.solicitud.profesional.apellido}`);
        cy.get('detalle-solicitud .row .col').eq(5).contains(auditable.solicitud.tipoPrestacion.term);
        cy.get('detalle-solicitud .row .col span').eq(5).contains(auditable.solicitud.organizacion.nombre);
        //  cy.get('detalle-solicitud .row .col span').eq(6).contains(auditable.solicitud.registros[0].valor.solicitudPrestacion.motivo);
        // Hay un PR que modifica esta parte
        cy.get('detalle-solicitud .row .col span').eq(7).contains(auditable.solicitud.registros[0].valor.solicitudPrestacion.motivo);

    });

    it('Rechazar solicitud auditable', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-button[title="Auditar Solicitud"]').click();
        cy.plexButton('Responder').click();

        var motivo = faker.lorem.sentence();
        cy.plexTextArea('name="motivo"', motivo)

        cy.plexButton('Confirmar').click();
    });

    it('Aceptar solicitud auditable', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('pacientes');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('turnos');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('obraSocial');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tiposPrestaciones');

        cy.get('plex-button[title="Auditar Solicitud"]').click();
        cy.plexButton('Aceptar').click();

        cy.plexButton('Confirmar').click();
        cy.toast('success', 'Solicitud Aceptada');

    });

});
