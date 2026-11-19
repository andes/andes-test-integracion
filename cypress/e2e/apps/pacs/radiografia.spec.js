/// <reference types="Cypress" />

// Corre contra el stack de pacs:up. La app está en el 8090 y el Mongo en el 27067.
// npm run pacs:test

context('PACS - radiografía', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '/api/modules/huds/motivosHuds/motivosHuds**', { fixture: 'huds/modalHuds.json' }).as('motivosHuds');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables?**').as('conceptos');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('pacientes');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
    });

    it('inicia la radiografía, consulta la worklist y abre la imagen en OHIF', () => {
        cy.goto('/rup', token);
        cy.get('[tooltip="Fuera de agenda"]').then((items) => {
            items[0].click();
        });

        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'radiografía', false);
        cy.wait('@conceptos');
        cy.get('plex-select[label="Seleccione el tipo de prestación"] input').type('{enter}', { force: true });

        cy.plexText('name="buscador"', '3399661');
        cy.wait('@pacientes');
        cy.get('paciente-listado plex-item').contains(formatDocumento('3399661')).click();
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.solicitud.tipoPrestacion.conceptId).to.eq('168537006');
            const prestacionId = response.body.id || response.body._id;
            cy.task('pacs:worklist', { prestacionId }, { timeout: 90000 }).then((estudio) => {
                expect(estudio.patientId).to.eq('3399661');
                expect(estudio.accessionNumber).to.be.a('string').and.not.be.empty;
                expect(estudio.studyInstanceUID).to.match(/^2\.16\.840\.1\.113883\.2\.10\.35\.1\.900\./);
                cy.task('pacs:enviar-estudio', estudio, { timeout: 60000 });
                cy.goto(`/rup/ejecucion/${prestacionId}`, token);
                cy.window().then((win) => {
                    cy.stub(win, 'open').as('visor');
                });
                cy.contains('VER IMAGEN', { timeout: 20000 }).click();
                cy.get('@visor').should('be.called').then((stub) => {
                    const abierto = stub.getCall(0).args[0];
                    const url = abierto.startsWith('http') ? abierto : `${Cypress.config('baseUrl')}${abierto}`;
                    cy.request({ url, followRedirect: false }).then((redirect) => {
                        expect(redirect.status).to.be.oneOf([301, 302]);
                        const location = redirect.headers.location;
                        expect(location).to.include(`http://localhost:8888/viewer/${estudio.studyInstanceUID}`);
                        cy.origin('http://localhost:8888', { args: { location, uid: estudio.studyInstanceUID } }, ({ location, uid }) => {
                            cy.visit(location);
                            cy.location('pathname').should('include', `/viewer/${uid}`);
                            cy.get('canvas', { timeout: 30000 }).should('exist');
                        });
                    });
                });
            });
        });
    });
});

function formatDocumento(documentoPac) {
    if (documentoPac) {
        return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
    }
    return documentoPac;
}
