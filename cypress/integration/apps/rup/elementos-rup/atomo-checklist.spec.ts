/// <reference types="Cypress" />

const search = [
    {
        "conceptId": "440377005",
        "term": "derivación por",
        "fsn": "derivación por (entidad observable)",
        "semanticTag": "entidad observable"
    },
];

const resultadoSnomed = [
    {
        "conceptId": "440377005",
        "term": "concepto uno",
        "fsn": "derivación por (entidad observable)",
        "semanticTag": "entidad observable"
    },
    {
        "conceptId": "440377004",
        "term": "concepto dos",
        "fsn": "derivación por (entidad observable)",
        "semanticTag": "entidad observable"
    }
];

let token;
context('RUP - Ejecucion', () => {

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
    });

    describe('checklist atomo - simple', () => {

        createTest(
            {
                title: 'PRUEBA',
                items: resultadoSnomed,
                idField: 'conceptId',
                labelField: 'term'
            }
        );

        it('test opcion simple', () => {
            cy.snomedSearchStub('derivacion', search, 'rup-buscador');
            cy.RupBuscarConceptos('derivacion');
            cy.seleccionarConcepto(0);
            cy.assertRupCard(0, { semanticTag: 'procedimiento', term: 'derivación por' }).then(card => {
                cy.wrap(card).plexRadio('name="plex-radio"', 0);
            });
            cy.plexButton('Guardar sesión de informes de enfermería').click();

            cy.contains('concepto uno');
        });

    });


    describe('checklist atomo  - multiple', () => {

        createTest(
            {
                title: 'PRUEBA',
                items: resultadoSnomed,
                idField: 'conceptId',
                labelField: 'term',
                multiple: true
            }
        );

        it('test opcion simple', () => {
            cy.snomedSearchStub('derivacion', search, 'rup-buscador');
            cy.RupBuscarConceptos('derivacion');
            cy.seleccionarConcepto(0);
            cy.assertRupCard(0, { semanticTag: 'procedimiento', term: 'derivación por' }).then(card => {
                cy.wrap(card).plexRadioMultiple('name="plex-radio"', 0);
                cy.wrap(card).plexRadioMultiple('name="plex-radio"', 1);
            });
            cy.plexButton('Guardar sesión de informes de enfermería').click();

            cy.contains('concepto uno');
            cy.contains('concepto dos');
        });

    });

    describe('checklist atomo - requerido', () => {

        createTest(
            {
                title: 'PRUEBA',
                items: resultadoSnomed,
                idField: 'conceptId',
                labelField: 'term',
                multiple: true,
                required: true
            }
        );

        it('test opcion simple', () => {
            cy.snomedSearchStub('derivacion', search, 'rup-buscador');
            cy.RupBuscarConceptos('derivacion');
            cy.seleccionarConcepto(0);
            cy.plexButton('Guardar sesión de informes de enfermería').click();
            cy.toast('error');
            cy.contains('Valor requerido');
        });

    })
})


function createTest(params) {
    let idPrestacion, idElementoRUP;
    beforeEach(() => {
        cy.server();

        cy.cleanDB(['prestaciones']);

        cy.task('database:seed:elemento-rup', {
            componente: 'ChecklistComponent',
            conceptos: [
                {
                    "conceptId": "440377005",
                    "term": "derivación por",
                    "fsn": "derivación por (entidad observable)",
                    "semanticTag": "entidad observable"
                },
            ],
            params: params
        }).then((elementoRup) => idElementoRUP = elementoRup._id);

        cy.task('database:seed:prestacion', {
            paciente: '586e6e8627d3107fde116cdb',
            tipoPrestacion: '5cdc4c865cd661b503d727a6'
        }).then((prestacion) => {
            idPrestacion = prestacion._id;
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
        });

    })

    afterEach(() => {
        cy.task('database:delete:elemento-rup', idElementoRUP);
    })
}