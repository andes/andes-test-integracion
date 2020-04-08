/// <reference types="Cypress" />

const informeAlta = {
    "conceptId": "3739420099",
    "term": "informe de alta",
    "fsn": "informe de alta (elemento de registro)",
    "semanticTag": "elemento de registro"
}

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
    });


    describe('secciones', () => {
        let idPrestacion, idSeccionComponenet, idSeccionadoComponent;
        beforeEach(() => {
            cy.server();
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.route('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

            cy.snomedSearchStub('alta', [informeAlta], 'rup-buscador');

            cy.cleanDB(['prestaciones']);

            cy.task('database:seed:elemento-rup', {
                componente: 'SeccionComponent',
                conceptos: []
            }).then((elementoRup) => {
                idSeccionComponenet = elementoRup._id
                requeridos.forEach((item, index) => {
                    if (index > 0) {
                        item.elementoRUP = idSeccionComponenet;
                    }
                })
                cy.task('database:seed:elemento-rup', {
                    componente: 'SeccionadoComponent',
                    conceptos: [informeAlta],
                    requeridos: requeridos
                }).then((elementoRup) => idSeccionadoComponent = elementoRup._id);
            });


            cy.task('database:seed:prestacion', { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }).then((prestacion) => {
                idPrestacion = prestacion._id;
                cy.goto('/rup/ejecucion/' + idPrestacion, token);
            });

        })

        afterEach(() => {
            cy.task('database:delete:elemento-rup', idSeccionComponenet);
            cy.task('database:delete:elemento-rup', idSeccionadoComponent);
        })


        it('test validacion y grabar', () => {

            cy.route('GET', '**/api/core/tm/organizaciones**').as('getOrganizaciones');
            cy.route('GET', '**/api/modules/cda/paciente/**').as('paciente');

            cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
            cy.get('snomed-buscar').plexText('name="searchTerm"', 'alta');

            cy.wait('@rup-buscador');
            cy.get('rup-buscador .mdi-plus').first().click();

            cy.get('rup-seccionnado-component plex-accordion plex-panel').should('have.length', 4);


            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).contains('resumen de la internación');
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).should('not.contain', 'No hay conceptos registrados');
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).find('.card .collapse').should('have.class', 'show');
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).find('.icon-andes-documento');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).find('.card .collapse').should('not.have.class', 'show');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).find('.card-header').click();
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).find('.card .collapse').should('have.class', 'show');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).find('label').contains('tratamiento recibido durante la internación');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(2).find('rup-seccion-component > form > label').should('not.exist');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(3).find('rup-seccion-component .row > div.col-12').should('have.length', 2);

            cy.plexButton('Guardar').click();
            cy.toast('error');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).should('have.class', 'alerta-campo');
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).should('have.class', 'alerta-campo');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).find('.card-header').click();

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).find('quill-editor input').type('hola', { force: true });

            cy.plexButton('Guardar').click();
            cy.toast('error');

            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(0).should('not.have.class', 'alerta-campo');
            cy.get('rup-seccionnado-component plex-accordion plex-panel').eq(1).should('have.class', 'alerta-campo');

        });

    })
})

const requeridos = [
    {
        "elementoRUP": "594aa43a884431c25d9a0267",
        "concepto": {
            "conceptId": "3571000013102",
            "term": "resumen de la internación",
            "fsn": "resumen de la internación (elemento de registro)",
            "semanticTag": "elemento de registro"
        },
        "style": {
            "columns": 12,
            "cssClass": null
        },
        "params": {
            "hr": true,
            "icon": "icon-andes-documento",
            "required": true
        }
    },
    {
        "elementoRUP": "5ad761d021e0f1ff1e77861d",
        "concepto": {
            "conceptId": "3581000013104",
            "term": "tratamiento recibido durante la internación",
            "fsn": "tratamiento recibido durante la internación (elemento de registro)",
            "semanticTag": "elemento de registro"
        },
        "style": {
            "columns": 12,
            "cssClass": null
        },
        "params": {
            "icon": "icon-rup-semantic-todos",
            "showText": true,
            "textRequired": true,
            "showTitle": true,
        }
    },
    {
        "elementoRUP": "5ad761d021e0f1ff1e77861d",
        "concepto": {
            "conceptId": "3591000013101",
            "term": "resumen de laboratorios",
            "fsn": "resumen de laboratorios(elemento de registro)",
            "semanticTag": "elemento de registro"
        },
        "style": {
            "columns": 12,
            "cssClass": null
        },
        "params": {
            "icon": "icon-andes-laboratorio",
            "showText": false
        }
    },
    {
        "elementoRUP": "5ad761d021e0f1ff1e77861d",
        "concepto": {
            "conceptId": "3601000013109",
            "term": "resumen de procedimientos",
            "fsn": "resumen de procedimientos(elemento de registro)",
            "semanticTag": "elemento de registro"
        },
        "style": {
            "columns": 12,
            "cssClass": null
        },
        "params": {
            "icon": "icon-rup-semantic-procedimiento",
            "showText": true,
            "direction": "vertical"
        }
    }
]