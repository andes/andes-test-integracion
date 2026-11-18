/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;
    let idPrestacion;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');



        cy.cleanDB(['prestaciones']);

        cy.task('database:seed:elemento-rup', {
            componente: 'ObservacionesComponent',
            permiteRepetidos: true,
            params: {}
        });

        cy.task(
            'database:seed:prestacion',
            { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '5cdc4c865cd661b503d727a6' }
        ).then((prestacion) => {
            idPrestacion = prestacion._id;
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
        });
    });


    it('repetir conceptos', () => {

        const resultadoSnomed = [{
            "conceptId": "440377005",
            "term": "derivación por",
            "fsn": "derivación por (entidad observable)",
            "semanticTag": "entidad observable"
        }];
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.snomedSearchStub('derivaci', resultadoSnomed, 'rup-buscador');
        cy.RupBuscarConceptos('derivaci');
        cy.seleccionarConcepto(0);
        cy.assertRupCard(0, { semanticTag: 'procedimiento', term: 'derivación por' });

        cy.seleccionarConcepto(0);
        cy.assertRupCard(1, { semanticTag: 'procedimiento', term: 'derivación por' });

    });

});