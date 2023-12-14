/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');
    });


    describe('agregar conceptos', () => {
        let idPrestacion;

        beforeEach(() => {
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.intercept('GET', '/api/core/**', []).as('huds');
            cy.intercept('GET', '/api/modules/seguimiento-paciente**', []);
            cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.cleanDB(['prestaciones']);

            cy.task(
                'database:seed:prestacion',
                { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }
            ).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        })

        it('agregar conceptos desde el buscador', () => {
            cy.snomedSearchStub('fiebre', 'mitos/fiebre.json', 'rup-buscador');


            cy.RupBuscarConceptos('fiebre');
            cy.seleccionarConcepto(0);
            cy.seleccionarConcepto(0);
            cy.toast('alert');

            cy.assertRupCard(0, { semanticTag: 'hallazgo', term: 'fiebre' });

            cy.RupSetearFiltros('trastorno');
            cy.seleccionarConcepto(1);
            cy.assertRupCard(1, { semanticTag: 'trastorno', term: 'fiebre Catu' });

            cy.RupSetearFiltros('procedimiento');
            cy.seleccionarConcepto(0);
            cy.assertRupCard(2, { semanticTag: 'procedimiento', term: 'examen de fiebre' });

            cy.RupSetearFiltros('solicitud');
            cy.seleccionarConcepto(0);
            cy.toast('alert');

            cy.removeRupCard(2);

            cy.seleccionarConcepto(0);
            cy.assertRupCard(2, { semanticTag: 'solicitud', term: 'examen de fiebre' });

            cy.relacionarRUPCard(2, 'fiebre Catu');

        });

        it('agregar conceptos desde freceuntes', () => {
            cy.snomedFrecuentesStub('mitos/frecuentes.json');
            cy.RupBuscarConceptos('fiebre', 'MIS FRECUENTES');
            cy.seleccionarConcepto(0);
            cy.assertRupCard(0, { semanticTag: 'hallazgo', term: 'fiebre crónica' });

            cy.plexHtml('name="evolucion"', 'hola mundo');

            cy.plexButton("Guardar sesión de informes de enfermería").click();

            cy.assertRupCard(0, { semanticTag: 'hallazgo', term: 'fiebre crónica' });
        });

        describe('evolucionar trastorno', () => {
            let idPrestacion;

            before(() => {
                cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
                cy.intercept('GET', '/api/modules/seguimiento-paciente**', []);
                cy.intercept('GET', '/api/modules/huds/accesos**', []);
                cy.intercept('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');
                cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

                cy.cleanDB(['prestaciones']);

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
                cy.intercept('GET', '/api/core/term/snomed/expression?expression=**', []);
                cy.wait('@paciente');
                cy.snomedSearchStub('fiebre', 'mitos/fiebre.json', 'rup-buscador');
                cy.RupBuscarConceptos('fiebre');
                cy.seleccionarConcepto('fiebre Q');
                cy.swal('confirm');

                cy.assertRupCard(0, { semanticTag: 'trastorno', term: 'fiebre Q' }).then(($elem) => {
                    cy.wrap($elem).contains('Inicio del Hallazgo');
                    // cy.wrap($elem).should('not.contain', 'plex-int');
                });

                cy.removeRupCard(0);

                cy.seleccionarConcepto('fiebre Q');
                cy.swal('cancel');

                cy.assertRupCard(0, { semanticTag: 'trastorno', term: 'fiebre Q' }).then(($elem) => {
                    cy.wrap($elem).should('not.contain', 'Inicio del Hallazgo');
                    cy.wrap($elem).plexInt('name="inicioEstimadoUnidad"', '10');
                });

                cy.plexButton("Guardar sesión de informes de enfermería").click()
                cy.wait('@patchPrestacion');
                cy.url().should('include', '/rup/validacion/');
                cy.wait('@paciente');
                cy.contains("Validar sesión de informes de enfermería");
                cy.plexButton("Validar sesión de informes de enfermería").click();
                cy.swal('confirm');
            });

            it('ver trastorno en HUDS', () => {
                cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
                cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);
                cy.HudsBusquedaFiltros('trastorno');

                cy.get('plex-layout-sidebar .rup-card').should('have.length', 2);

            });
        });
    });
});