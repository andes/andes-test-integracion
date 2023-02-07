/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context('ACEPTAR SOLICITUD', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.createPrestacion('solicitudes/solicitud-auditoria', token)
        })
    })

     beforeEach(() => {
        cy.goto('/solicitudes', token);
        cy.server();
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes**').as('solicitudes');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');
    })



    it('aceptar', () => {
        cy.server();
        cy.get('plex-dropDown').click().get('a').contains('Auditar').click();
        cy.plexButton('Aceptar').click();
        cy.get('textarea').last().type('Una observacion aceptar', { force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            const i = xhr.response.body.solicitud.historial.length - 1;
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.historial[i].descripcion).to.be.eq('Aceptada');
            expect(xhr.response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion aceptar');  
        });
        cy.get('plex-badge').contains('pendiente');
        cy.get('plex-dropDown').click().get('a').contains('Dar Turno');
    })
})