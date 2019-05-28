import { USER_PWRD_LOGIN, USER_USR_LOGIN } from '../../../../config.private'

/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })

    beforeEach(() => {
        cy.goto('/rup', token);
    })

    // it('iniciar prestacion - fuera de agenda', () => {
    //     cy.goto('/rup', token);

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


    it('Registrar Los Signos Vitales Del Paciente', () => {
        cy.goto('/rup', token);

        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones**').as('create');
        cy.route('GET', '**/api/modules/rup/frecuentesProfesional**').as('frecuentes');

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

        cy.get('plex-select[name="nombrePrestacion"] input').type('Consulta de clínica médica').as('prestacionBuscada')
        cy.wait('@prestaciones')
        cy.get('@prestacionBuscada').type('{enter}');

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
        cy.get('plex-text input').first().type('38906730');
        cy.get('table tbody tr').first().click();

        cy.get('plex-button[type="success"]').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.paciente.documento).to.be.eq('38906730');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });

        cy.wait('@prestaciones');
        cy.wait('@frecuentes');
        cy.get('button').contains('BUSCADOR BÁSICO').click();
        cy.get('plex-text[name="searchTerm"] input[type="text"]').first().type('Registrar Los Signos Vitales Del Paciente');
        cy.wait(1000);
        cy.get('button[class="btn btn-block btn-procedimiento"]').click();
        cy.wait(1000);
        cy.get('button[class="btn btn-block btn-solicitud"]').click();
    });
});