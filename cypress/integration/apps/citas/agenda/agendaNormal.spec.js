import { USER_USR_LOGIN, USER_PWRD_LOGIN } from '../../../../../config.private'
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


    it('Clonar agenda "repetida"', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgenda');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');

        // Se crea la primer agenda..
        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('0900').should('have.value', '0900');

        cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click({ force: true });

        cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('MONTEVERDE MARIA LAURA').as('profesional');
        cy.wait('@getProfesional');
        cy.get('@profesional').type('{enter}');

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.wait(1000); // Solo para observar el toast, luego se lo clickea para ocultarlo
        cy.get('simple-notification').children('.simple-notification').first().click();

        // Se crea la segunda agenda ..
        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const manana = Cypress.moment(new Date()).add(1, 'days').format('DD/MM/YYYY');

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(manana).should('have.value', manana);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('0900').should('have.value', '0900');

        cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click({ force: true });

        cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('MONTEVERDE MARIA LAURA').as('profesional');
        cy.wait('@getProfesional');
        cy.get('@profesional').type('{enter}');

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se obtiene la primera agenda con estado 'En planificación'        
        cy.get('tbody tr').find('span').contains('En planificación').first().click({ force: true });

        // Se intenta clonar la agenda obtenida
        cy.get('botones-agenda').find('plex-button[title="Clonar"]').first().click();

        cy.get('tbody tr').children('.outline-success').first().next().click();

        // cy.get('plex-button[label="Clonar Agenda"]').click();
    })
})