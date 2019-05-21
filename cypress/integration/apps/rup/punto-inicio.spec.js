import { USER_USR_LOGIN, USER_PWRD_LOGIN, ANDES_KEY } from '../../../../config.private'

/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
        })
    })

    before(() => {
        cy.goto('/rup', token);
    })

    it('iniciar prestacion - fuera de agenda', () => {
        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');

        cy.viewport(1280, 720);
        cy.createPaciente('paciente-rup', token);
        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

        cy.wait('@prestaciones');
        cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
        cy.get('plex-text input').first().type('38906730');
        cy.get('table tbody tr').first().click();

        cy.get('plex-button[label="INICIAR PRESTACIÓN"]').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('5951051aa784f4e1a8e2afe1');
            expect(xhr.response.body.paciente.documento).to.be.eq('38906730');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
    });


    it('Evolucionar una prestación', () => {
        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('GET', '**/api/modules/rup/prestaciones**').as('getPrestaciones');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('getPaciente');

        // Se visualiza la HUDS del paciente
        cy.goto('/rup/huds/paciente/586e6e8d27d3107fde142d36', token);
        cy.wait('@getPrestaciones')

        cy.get('button').contains('TRASTORNOS').click()
        cy.get('div').contains('locura').click()

        // Navega entre las evoluciones
        cy.get('div[class="menu-left mr-2 semantic-text-trastorno hover"').click()
        cy.wait(1000)
        cy.get('div[class="menu-right ml-2 semantic-text-trastorno hover"').click()
        cy.wait(1000)
        cy.get('div[class="menu-left mr-2 semantic-text-trastorno hover"').click()
        cy.wait(1000)
        cy.get('div[class="menu-right ml-2 semantic-text-trastorno hover"').click()
    })
});
