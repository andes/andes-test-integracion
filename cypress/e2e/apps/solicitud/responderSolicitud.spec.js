/// <reference types="Cypress" />

context('RESPONDER SOLICITUD', () => {
    let token;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.createPrestacion('solicitudes/solicitud-auditoria', token)
        });
    });

     beforeEach(() => {
        cy.goto('/solicitudes', token);
        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes**').as('solicitudes');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchSolicitud');
    });

    it('responder', () => {
        cy.server();
        cy.get('plex-dropDown').click().get('a').contains('Auditar').click();
        cy.plexButton('Responder').click();
        cy.get('textarea').last().type('No se acepta por ...', { force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@patchSolicitud').then((xhr) => {
            const i = xhr.response.body.solicitud.historial.length - 1;
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[1].observaciones).to.be.eq('No se acepta por ...');
            expect(xhr.response.body.solicitud.historial[i].observaciones).to.be.eq('No se acepta por ...');
        
        });
        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('CONTRARREFERIDA');
    });
});
