


/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');
    });

    describe('regla matchea correcto', () => {
        let idPrestacion;

        beforeEach(() => {
            cy.server();
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.intercept('GET', '/api/modules/seguimiento-paciente**', []);
            cy.intercept('GET', '/api/modules/huds/accesos**', []);


            cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.cleanDB(['prestaciones']);

            cy.task('database:create:elementos-requeridos', reglaEjemplo);
            cy.task('database:create:services', {
                "name": "paciente-huds-registros",
                "type": "static-client",
                "configuration": registroHudsEjemplo
            });


            cy.task(
                'database:seed:prestacion',
                { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '598ca8375adc68e2a0c121b8' }
            ).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        });


        it('segundo registro debe ser fractura', () => {
            cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
            cy.get('plex-tabs').contains('Buscador').click({ force: true });
            cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
            cy.wait(1000);
            cy.assertRupCard(1, { semanticTag: 'trastorno', term: 'fractura de cabeza de fémur' })
        });



    });

    describe('regla no matchea correcto', () => {
        let idPrestacion;

        beforeEach(() => {
            cy.server();
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.intercept('GET', '/api/modules/seguimiento-paciente**', []);
            cy.intercept('GET', '/api/modules/huds/accesos**', []);


            cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.cleanDB(['prestaciones']);

            cy.task('database:create:elementos-requeridos', reglaEjemplo);
            cy.task('database:create:services', {
                "name": "paciente-huds-registros",
                "type": "static-client",
                "configuration": null
            });


            cy.task(
                'database:seed:prestacion',
                { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '598ca8375adc68e2a0c121b8' }
            ).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        });


        it('solo debe haber un registro', () => {
            cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
            cy.get('plex-tabs').contains('Buscador').click({ force: true });
            cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
            cy.wait(1000);
            cy.get('plex-layout-main .rup-card').should('have.length', 1);

        });

    });

    describe('dependencia de contextos', () => {
        let idPrestacion;

        beforeEach(() => {
            cy.server();
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.intercept('GET', '/api/modules/seguimiento-paciente**', []);
            cy.intercept('GET', '/api/modules/huds/accesos**', []);


            cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.cleanDB(['prestaciones']);

            cy.task('database:create:elementos-requeridos', reglaDependenciaEjemplo);

            cy.task('database:create:services', {
                "name": "paciente-huds-registros",
                "type": "static-client",
                "configuration": {
                    paciente: '$.paciente'
                }
            });

            cy.task('database:create:services', {
                "name": "paciente-huds-registros2",
                "type": "static-client",
                "configuration": {
                    documento: '$.documento'
                }
            });


            cy.task(
                'database:seed:prestacion',
                { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '598ca8375adc68e2a0c121b8' }
            ).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        });

        it('segundo registro debe ser fractura', () => {
            cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
            cy.get('plex-tabs').contains('Buscador').click({ force: true });
            cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
            cy.wait(1000);
            cy.assertRupCard(1, { semanticTag: 'trastorno', term: 'fractura de cabeza de fémur' })

        });

    });

});


const reglaEjemplo = {
    "nombre": "control fractura",
    "active": true,
    "conceptos": [
        {
            "conceptId": "391000013108",
            "term": "consulta de medicina general",
            "fsn": "consulta de medicina general",
            "semanticTag": "procedimiento"
        }
    ],
    "contexto": [
        {
            "name": "fractura",
            "service": "paciente-huds-registros",
            "params": {
                "paciente": "$.prestacion.paciente.id",
                "expression": "<<15574005",
                "first": true
            },
            "dependsOn": []
        }
    ],
    "rules": {
        "all": [
            {
                "fact": "fractura",
                "path": "$.fecha",
                "operator": "dateGreaterThan",
                "value": {
                    "fact": "date",
                    "params": {
                        "add": -2,
                        "unit": "M"
                    }
                }
            }
        ]
    },
    "target": [
        {
            "concepto": {
                "conceptId": "733276006",
                "fsn": "fractura de cabeza de fémur (trastorno)",
                "semanticTag": "trastorno",
                "term": "fractura de cabeza de fémur"
            },
            "tipo": "requerido"
        },
        {
            "concepto": {
                "conceptId": "840534001",
                "fsn": "vacunación contra coronavirus del síndrome respiratorio agudo severo 2 (procedimiento)",
                "semanticTag": "procedimiento",
                "term": "vacunación contra COVID-19"
            },
            "tipo": "sugerido"
        }
    ]
}

const registroHudsEjemplo = {
    "idPrestacion": "6082c876d872e4723eca20f5",
    "tipoPrestacion": {
        "id": "595107fba784f4e1a8e2afe4",
        "conceptId": "168537006",
        "term": "radiografía simple (procedimiento)",
        "fsn": "radiografía simple (procedimiento)",
        "semanticTag": "procedimiento"
    },
    "fecha": new Date(),
    "profesional": {
        "id": "5bc721a6c2d8a64ab4c60ad5",
        "nombreCompleto": "MARIANO ANDRES BOTTA",
        "nombre": "MARIANO ANDRES",
        "apellido": "BOTTA",
        "username": 34934522,
        "documento": 34934522,
        "organizacion": {
            "_id": "57e9670e52df311059bc8964",
            "id": "57e9670e52df311059bc8964",
            "nombre": "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
        }
    },
    "registro": {
        "privacy": {
            "scope": "public"
        },
        "destacado": false,
        "esSolicitud": false,
        "esDiagnosticoPrincipal": true,
        "relacionadoCon": [
            "6082c8d071ed9d1538a79c05"
        ],
        "_id": "6082c96771ed9d1538a79c06",
        "elementoRUP": "594aa21a884431c25d9a0266",
        "nombre": "fractura de pie",
        "concepto": {
            "term": "fractura de pie",
            "fsn": "fractura de pie (trastorno)",
            "conceptId": "15574005",
            "semanticTag": "trastorno"
        },
        "valor": {
            "estado": "activo"
        },
        "registros": [],
        "hasSections": false,
        "isSection": false,
        "noIndex": false,
        "isEmpty": false,
        "createdAt": "2021-04-23T13:19:36.911Z",
        "createdBy": {
            "id": "5bc721a6c2d8a64ab4c60ad5",
            "nombreCompleto": "MARIANO ANDRES BOTTA",
            "nombre": "MARIANO ANDRES",
            "apellido": "BOTTA",
            "username": 34934522,
            "documento": 34934522,
            "organizacion": {
                "_id": "57e9670e52df311059bc8964",
                "id": "57e9670e52df311059bc8964",
                "nombre": "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
            }
        },
        "updatedAt": "2021-04-23T13:27:33.396Z",
        "updatedBy": {
            "id": "5bc721a6c2d8a64ab4c60ad5",
            "nombreCompleto": "MARIANO ANDRES BOTTA",
            "nombre": "MARIANO ANDRES",
            "apellido": "BOTTA",
            "username": 34934522,
            "documento": 34934522,
            "organizacion": {
                "_id": "57e9670e52df311059bc8964",
                "id": "57e9670e52df311059bc8964",
                "nombre": "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
            }
        }
    }
}


const reglaDependenciaEjemplo = {
    "nombre": "control fractura",
    "active": true,
    "conceptos": [
        {
            "conceptId": "391000013108",
            "term": "consulta de medicina general",
            "fsn": "consulta de medicina general",
            "semanticTag": "procedimiento"
        }
    ],
    "contexto": [
        {
            "name": "fractura",
            "service": "paciente-huds-registros",
            "params": {
                "paciente": "$.prestacion.paciente",
                "expression": "<<15574005",
                "first": true
            },
            "dependsOn": []
        },
        {
            "name": "fractura2",
            "service": "paciente-huds-registros2",
            "params": {
                "documento": "$.fractura..paciente.documento"
            },
            "dependsOn": ['fractura']
        }
    ],
    "rules": {
        "all": [
            {
                "fact": "fractura2",
                "path": "$.documento",
                "operator": "equal",
                "value": '10000000'
            }
        ]
    },
    "target": [
        {
            "concepto": {
                "conceptId": "733276006",
                "fsn": "fractura de cabeza de fémur (trastorno)",
                "semanticTag": "trastorno",
                "term": "fractura de cabeza de fémur"
            },
            "tipo": "requerido"
        },
        {
            "concepto": {
                "conceptId": "840534001",
                "fsn": "vacunación contra coronavirus del síndrome respiratorio agudo severo 2 (procedimiento)",
                "semanticTag": "procedimiento",
                "term": "vacunación contra COVID-19"
            },
            "tipo": "sugerido"
        }
    ]
}