/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token, idPrestacion;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');
    });


    before(() => {
        cy.server();
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '/api/modules/seguimiento-paciente**', []);
        cy.route('GET', '/api/modules/huds/accesos**', []);


        cy.route('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

        cy.cleanDB(['prestaciones']);

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cdc4c865cd661b503d727a6',
                estado: 'validada',
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
                }]
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cdc4c865cd661b503d727a6',
                estado: 'validada',
                registros: [{
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

        cy.task(
            'database:seed:prestacion',
            { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }
        ).then((prestacion) => {
            idPrestacion = prestacion._id;
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
        });

    });

    it('evolucionar trastorno desde buscador', () => {
        cy.route('GET', '/api/core/term/snomed/expression?expression=**', []);

        cy.plexTab('Historia de Salud').click();
        cy.get('plex-layout-sidebar .rup-card').should('have.length', 2);
        cy.HudsBusquedaFiltros('trastorno');
        cy.get('plex-layout-sidebar .rup-card').should('have.length', 1);
        // cy.seleccionarConcepto('fiebre Q');

        // [TODO] En la HUDS no hay un plex-button para añadir así que hay que hacerlo a mano
        cy.get('plex-layout-sidebar .rup-card').contains('fiebre Q').parentsUntil('.rup-card').find('.mdi-plus').click();

        cy.assertRupCard(0, { semanticTag: 'trastorno', term: 'fiebre Q' }).then(($elem) => {
            cy.wrap($elem).contains('Inicio del Hallazgo');
            cy.wrap($elem).should('not.contain', 'plex-int');
        });


    });

});


//