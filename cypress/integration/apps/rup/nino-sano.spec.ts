/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token, idPrestacion;
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
        cy.task(
            'database:seed:prestacion',
            { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '57f5069d69fe79a5980b072e' }
        ).then((prestacion) => {
            idPrestacion = prestacion._id;
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
        });

    })

    it('Iniciar prestación - Niño sano', () => {

        cy.server();
        cy.route(/api\/modules\/rup\/frecuentesProfesional\?/).as('search');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');

        cy.RupBuscarConceptos('consulta de niño sano, recién nacido', 'SUGERIDOS');
        cy.seleccionarConcepto(0);
        cy.assertRupCard(0, { semanticTag: 'procedimiento', term: 'consulta de niño sano, recién nacido' }).then($elem => {
            cy.wrap($elem).plexFloat('label="Peso"', 63);
            cy.wrap($elem).plexInputDinamico('float', 'Percentilo de Peso', 70);
            cy.wrap($elem).plexFloat('name="talla"', 120);
            cy.wrap($elem).plexInputDinamico('float', 'Percentilo de Talla', 70);
            cy.wrap($elem).plexInputDinamico('float', 'Perímetro Cefálico', 70);
            cy.wrap($elem).plexInputDinamico('float', 'Percentilo de Perímetro Cefálico', 70);
            cy.wrap($elem).get('plex-bool').first().click();
        })


        cy.plexButton('Guardar consulta de niño sano').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.null;
            expect(xhr.response.body.solicitud.tipoPrestacion.conceptId).to.be.eq("410620009");
            expect(xhr.response.body.paciente.documento).to.be.eq('10000000');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.eq(undefined);
        });

        cy.toast('success');
        cy.plexButton('Validar consulta de niño sano').click();

        // Popup alert
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.null;
            expect(xhr.response.body.solicitud.tipoPrestacion.conceptId).to.be.eq("410620009");
            expect(xhr.response.body.paciente.documento).to.be.eq('10000000');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.eq(undefined);
        });
    });

});