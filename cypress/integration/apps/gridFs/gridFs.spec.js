/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.task('database:seed:paciente');
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPrestacion("prestacion-validada", token);
        });
    });


    describe('archivos', () => {
        let idPrestacion = '5f7762530bc129596e4bc7b8';
        beforeEach(() => {
            cy.server();
            cy.route('GET', '/api/modules/registro-novedades/novedades**').as('novedades');
            cy.route('GET', '/api/modules/rup/prestaciones**').as('prestaciones');
            cy.route('GET', '/api/modules/rup/prestaciones/solicitudes**').as('solicitudes');
            cy.route('GET', '/api/modules/cda/paciente/**').as('cda');
            cy.route('POST', '/api/modules/rup/store**').as('store');
            cy.route('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');
        })

        it('cargar adjunto', () => {
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
            cy.wait('@novedades');
            cy.wait('@prestaciones');
            cy.wait('@solicitudes');
            cy.wait('@cda');
            cy.plexButtonIcon('chevron-down').eq(0).click( { force: true } );
             
            const fileName = '/archivos/cat.png';
            cy.get('[type="file"]').attachFile(fileName);
            cy.wait('@store').then((xhr) => {
                expect(xhr.status).to.be.eq(200);;
            });
            cy.plexButton("Guardar sesión de informes de enfermería").click(); 
            cy.wait('@patchPrestacion').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.ejecucion.registros[0].valor.documentos[0].ext).to.be.eq('png');
            });
        });
    })
})