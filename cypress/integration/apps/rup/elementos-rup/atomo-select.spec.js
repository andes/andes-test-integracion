/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
    });


    describe('select organizacion', () => {
        let idPrestacion, idElementoRUP;
        beforeEach(() => {
            cy.server();
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.route('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            const resultadoSnomed = [{
                "conceptId": "440377005",
                "term": "derivación por",
                "fsn": "derivación por (entidad observable)",
                "semanticTag": "entidad observable"
            }];
            cy.snomedSearchStub('derivaci', resultadoSnomed, 'rup-buscador');

            cy.cleanDB(['prestaciones']);

            cy.task('database:seed:elemento-rup', {
                componente: 'SelectOrganizacionComponent',
                params: {
                    title: 'ORGANIZACION CUSTOM',
                    required: true,
                }
            }).then((elementoRup) => idElementoRUP = elementoRup._id);

            cy.task('database:seed:prestacion', { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        })

        afterEach(() => {
            cy.task('database:delete:elemento-rup', idElementoRUP);
        })


        it('test validacion y grabar', () => {

            cy.route('GET', '**/api/core/tm/organizaciones**').as('getOrganizaciones');
            cy.route('GET', '**/api/modules/cda/paciente/**').as('paciente');

            cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
            cy.get('snomed-buscar').plexText('name="searchTerm"', 'derivaci');
            cy.wait('@rup-buscador');
            cy.get('rup-buscador .mdi-plus').first().click();

            cy.get('.rup-card').first().as('rupCard');

            cy.plexButton('Guardar').click();
            cy.toast('error');

            cy.get('@rupCard').contains('ORGANIZACION CUSTOM');
            cy.get('@rupCard').plexSelectAsync('name="organizacion"', 'castro', '@getOrganizaciones', 0);

            cy.plexButton('Guardar').click();
            cy.wait('@patchPrestacion');

            cy.url().should('include', '/rup/validacion/');

            cy.get('.rup-card').first().contains('ORGANIZACION CUSTOM');
            cy.get('.rup-card').first().contains('PUESTO SANITARIO RAMON CASTRO (POR NOMIVAC)')

            cy.plexButton('Continuar').click();

            cy.wait('@paciente');
            cy.plexButtonIcon('chevron-down').click();

            cy.get('.rup-card').first().as('rupCard');
            cy.get('@rupCard').plexSelect('name="organizacion"').contains('PUESTO SANITARIO RAMON CASTRO (POR NOMIVAC)');

        });

    })
})