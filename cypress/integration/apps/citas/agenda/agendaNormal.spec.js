import { USER_PWRD_LOGIN, USER_USR_LOGIN } from '../../../../../config.private'

/// <reference types="Cypress" />

context('Agendas Normal', () => {
    let token
    before(() => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/citas/gestor_agendas', token);
    })

    it('crear agenda', () => {
        cy.goto('/citas/gestor_agendas', token);

        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click()

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);



        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.wait('@get');
        cy.get('table tr').contains('En planificación').first().click();
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });


    });

    it('dar turno agenda normal', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');

        cy.goto('/citas/puntoInicio', token);

        cy.get('plex-text input[type=text]').first().type('38906734').should('have.value', '38906734');
        cy.get('tr').first().click();
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('.outline-success ').first().click();
        cy.get('div').contains('08:00').first().click()
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });


    it('crear agenda con 3 blokes', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('getPacientes');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('1600').should('have.value', '1600');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1800').should('have.value', '1800');

        cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
            .find('.option[data-value="59ee2d9bf00c415246fd3d31"]').click({ force: true });

        // Se crea bloke 1
        cy.get('plex-dateTime[label="Hora Inicio"] input').type('{selectall}{del}1600');
        cy.get('plex-dateTime[label="Hora Fin"] input').type('{selectall}{del}1630');
        cy.get('plex-int[label="Cantidad de Turnos"] input').type(1)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(1);

        // Se crea bloke 2
        cy.get('plex-button[title="Agregar Bloque"]').click();
        cy.get('plex-dateTime[label="Hora Inicio"] input').type('1630');
        cy.get('plex-dateTime[label="Hora Fin"] input').type('1700');
        cy.get('plex-int[label="Cantidad de Turnos"] input').type(1)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(1);

        // Se crea bloke 3
        cy.get('plex-button[title="Agregar Bloque"]').click();
        cy.get('plex-dateTime[label="Hora Inicio"] input').type('1700');
        cy.get('plex-dateTime[label="Hora Fin"] input').type('1800');
        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.wait('@get');
        // Se publica la agenda
        cy.get('tbody tr td').children().contains('Consulta de cirugía de tórax pediátrida').scrollIntoView().click({ force: true });
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Hacia citas/punto de inicio..
        cy.goto('/citas/puntoInicio', token);
        cy.url().should('include', '/citas/puntoInicio');

        // Se busca un paciente
        cy.get('plex-text[placeholder="Ingrese un paciente o escanee un DNI"] input').first().type('31173233');
        cy.wait('@getPacientes');
        cy.get('tbody tr').find('span').contains('31.173.233').first().click({ force: true });
        cy.get('plex-button[title="Dar Turno"').click();

        // Se selecciona prestación y dia del turno
        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="59ee2d9bf00c415246fd3d31"]').click({ force: true });
        cy.wait(1000);
        cy.get('tbody tr').children('td.outline-success').first().click();
        cy.get('div').contains('16:30').first().click();
        cy.get('plex-button[label="Confirmar"]').click();

        // Se busca nuevamente el paciente
        cy.get('plex-text[placeholder="Ingrese un paciente o escanee un DNI"] input').first().type('31173233');
        cy.wait('@getPacientes');
        cy.get('tbody tr').find('span').contains('31.173.233').first().click({ force: true });
        cy.get('plex-button[title="Dar Turno"').click();

        // Se selecciona prestación y dia del turno
        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="59ee2d9bf00c415246fd3d31"]').click({ force: true });
        cy.wait(1000);
        cy.get('tbody tr').children('td.outline-success').first().click();
    });


})