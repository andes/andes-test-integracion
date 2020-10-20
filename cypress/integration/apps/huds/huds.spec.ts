/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token, idPrestacion;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');

        cy.cleanDB(['prestaciones']);

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cdc4c865cd661b503d727a6',
                estado: 'validada',
                fecha: -1,
                registros: [{
                    id: "5f772b7ac9264781190bc794",
                    concepto: {
                        "conceptId": "186788009",
                        "term": "fiebre Q",
                        "fsn": "fiebre Q (trastorno)",
                        "semanticTag": "trastorno"
                    },
                    valor: {
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>hola mundo</p>"
                    },
                },
                {
                    id: "5f772b7ac9264781190bc795",
                    concepto: {
                        "conceptId": "386661006",
                        "term": "fiebre",
                        "fsn": "fiebre (hallazgo)",
                        "semanticTag": "hallazgo"
                    },
                    valor: {
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>SOY FIEBRE</p>"
                    },
                }]
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '598ca8375adc68e2a0c121bc',
                estado: 'validada',
                registros: [{
                    id: "5f772b7ac9264781190bc790",
                    concepto: {
                        "conceptId": "186788009",
                        "term": "fiebre Q",
                        "fsn": "fiebre Q (trastorno)",
                        "semanticTag": "trastorno"
                    },
                    valor: {
                        "idRegistroOrigen": "5f772b7ac9264781190bc794",
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>hola mundo</p>"
                    },
                }]
            }
        );
    });


    beforeEach(() => {
        cy.server();
        cy.route('GET', '/api/modules/rup/prestaciones/huds/586e6e8627d3107fde116cdb?**', []).as('huds');
        cy.route('GET', '/api/modules/seguimiento-paciente**', []);
        cy.route('GET', '/api/modules/huds/accesos**', []);
    });

    it('no puedo entrar sin token HUDS', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token);
        cy.url().should('include', 'inicio');
    });

    it('visualizar HUDS', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);
        cy.assertHudsBusquedaFiltros('trastorno', 1);
        cy.assertHudsBusquedaFiltros('producto', 0);

        cy.getHUDSItems().should('have.length', 2);


        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'consulta de clínica médica ',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        });

        cy.getHUDSItems().eq(1).assertRUPMiniCard({
            term: 'sesión de informes de enfermería',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        });

        cy.getHUDSItems().eq(1).click();

        cy.assertRupCard(0, { semanticTag: 'trastorno', term: 'Fiebre Q' }).then((elem) => {
            cy.wrap(elem).contains('hola mundo');
            cy.wrap(elem).plexBadge('activo', 'success');
        });

        cy.HudsBusquedaFiltros('hallazgo');
        cy.getHUDSItems().should('have.length', 1);
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'fiebre',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        cy.HudsBusquedaFiltros('trastorno');
        cy.getHUDSItems().should('have.length', 1);

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'fiebre Q',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        cy.get('vista-registro .menu-left').click();
        cy.get('vista-registro').plexBadge('fiebre');
        cy.get('vista-registro').plexBadge('fiebre Q');

    });

}); 