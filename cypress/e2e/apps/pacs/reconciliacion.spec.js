/// <reference types="Cypress" />

// Corre contra el stack de pacs:up. La app está en el 8090 y el Mongo en el 27067.
// Usa un paciente distinto a radiografia.spec.js para no chocar en la búsqueda por
// PatientID + StudyDate (multiple-match).

context('PACS - reconciliación', () => {
    let token;
    const documento = '31549268';

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-turno', token);
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '/api/modules/huds/motivosHuds/motivosHuds**', { fixture: 'huds/modalHuds.json' }).as('motivosHuds');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('pacientes');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
    });

    it('reconcilia el estudio enviado con otro StudyInstanceUID', () => {
        cy.task('pacs:borrar-estudios', { patientId: documento }, { timeout: 60000 });

        cy.goto('/rup', token);
        cy.get('[tooltip="Fuera de agenda"]').then((items) => {
            items[0].click();
        });

        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'radiografía');

        cy.plexText('name="buscador"', documento);
        cy.wait('@pacientes');
        cy.get('paciente-listado plex-item').contains(formatDocumento(documento)).click();
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.solicitud.tipoPrestacion.conceptId).to.eq('168537006');
            const prestacionId = response.body.id || response.body._id;
            cy.task('pacs:worklist', { prestacionId }, { timeout: 90000 }).then((estudio) => {
                const worklistUID = estudio.studyInstanceUID;
                const sentUID = `${worklistUID}.9`;
                expect(estudio.patientId).to.eq(documento);
                expect(estudio.studyDate).to.match(/^\d{8}$/);

                cy.task('pacs:enviar-estudio', {
                    ...estudio,
                    studyInstanceUID: sentUID,
                }, { timeout: 60000 });

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
                        expect(location).to.include(`http://localhost:8888/viewer/${sentUID}`);

                        cy.request({
                            url: `/api/modules/rup/prestaciones/${prestacionId}`,
                            headers: { Authorization: `JWT ${token}` },
                        }).then(({ body }) => {
                            const valor = (key) => body.metadata.find(item => item.key === key)?.valor;
                            expect(valor('pacs-uid')).to.eq(sentUID);
                            expect(valor('pacs-canonical-uid')).to.eq(worklistUID);
                            expect(valor('pacs-reconciliation')).to.include({ status: 'reconciled' });
                        });

                        cy.origin('http://localhost:8888', { args: { location, uid: sentUID } }, ({ location, uid }) => {
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
