import { USER_USR_LOGIN, USER_PWRD_LOGIN } from '../../../../config.private'

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

    // it('iniciar prestacion - fuera de agenda', () => {
    //     cy.server();
    //     cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
    //     cy.route('POST', '**/api/modules/rup/prestaciones').as('create');

    //     cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

    //     cy.wait('@prestaciones');
    //     cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
    //         .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

    //     cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
    //     cy.get('plex-text input').first().type('38906730');
    //     cy.get('table tbody tr').first().click();

    //     cy.get('plex-button[label="INICIAR PRESTACIÓN"]').click();

    //     cy.wait('@create').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //         expect(xhr.response.body.solicitud.turno).to.be.undefined;
    //         expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('5951051aa784f4e1a8e2afe1');
    //         expect(xhr.response.body.paciente.documento).to.be.eq('38906730');
    //         expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
    //     });
    // });


    it('Evolucionar una prestación', () => {
        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');

        // Se crea una prestación fuera de agenda
        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

        cy.wait('@prestaciones');
        cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="59ee2d9bf00c415246fd3d6b"]').click();

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
        cy.get('plex-text input').first().type('31173233');
        cy.get('table tbody tr').first().click();

        // cy.get('plex-button[label="INICIAR PRESTACIÓN"]').click();

        // cy.wait('@create').then((xhr) => {
        //     expect(xhr.status).to.be.eq(200);
        //     expect(xhr.response.body.solicitud.turno).to.be.undefined;
        //     expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('59ee2d9bf00c415246fd3d6b');
        //     expect(xhr.response.body.paciente.documento).to.be.eq('31173233');
        //     expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        // });




    });
});