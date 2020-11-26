/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');
    });

    describe('agregar conceptos', () => {
        let idPrestacion, idElementoRUP;

        beforeEach(() => {
            cy.server();
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.route('GET', '/api/modules/seguimiento-paciente**', []);
            cy.route('GET', '/api/modules/huds/accesos**', []);


            cy.route('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.cleanDB(['prestaciones']);

            cy.task('database:seed:elemento-rup', {
                conceptos: [{
                    "conceptId": "248431003",
                    "term": "fase de la fiebre",
                    "fsn": "fase de la fiebre (entidad observable)",
                    "semanticTag": "entidad observable"
                }],
                componente: 'ValorNumericoComponent',
                params: {
                    title: 'Fase Fiebre',
                    required: true,
                    numericType: 'integer'
                },
                "rules": [
                    {
                        "conditions": {
                            "all": [
                                {
                                    "fact": "value",
                                    "operator": "greaterThanInclusive",
                                    "value": 38
                                }
                            ]
                        },
                        "event": {
                            "type": "alert",
                            "params": {
                                "message": "Fiebre",
                                "type": "danger"
                            }
                        }
                    },
                    {
                        "conditions": {
                            "all": [
                                {
                                    "fact": "value",
                                    "operator": "greaterThanInclusive",
                                    "value": "40"
                                }
                            ]
                        },
                        "event": {
                            "type": "validation",
                            "params": {
                                "value": false
                            }
                        }
                    }
                ]
            }).then((elementoRup) => idElementoRUP = elementoRup._id);

            cy.task(
                'database:seed:prestacion',
                { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }
            ).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        });

        afterEach(() => {
            cy.task('database:delete:elemento-rup', idElementoRUP);
        })


        it('agregar conceptos desde el buscador', () => {
            cy.snomedSearchStub('fase de la fiebre', 'mitos/fiebre.json', 'rup-buscador');

            cy.RupBuscarConceptos('fase de la fiebre');
            cy.RupSetearFiltros('procedimiento');
            cy.seleccionarConcepto(1);


            cy.assertRupCard(0, { semanticTag: 'procedimiento', term: 'fase de la fiebre' }).then(card => {
                cy.wrap(card).plexInputDinamico('int', 'Fase Fiebre', '40');
                cy.wrap(card).plexBadge('Fiebre', 'danger');

                cy.wrap(card).plexInputDinamico('int', 'Fase Fiebre', '{selectall}{backspace}40');

            });

            cy.plexButton('Guardar sesión de informes de enfermería').click();

            cy.toast('error', 'Revise los campos cargados');


        });



    });

}); 