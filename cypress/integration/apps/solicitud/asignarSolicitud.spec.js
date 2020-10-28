/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context(' ASIGNAR SOLICITUD', () => {
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
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');

    })

    it('asignar', () => {
        cy.server();
        cy.plexButtonIcon('lock-alert').first().click();
        cy.plexButton('Asignar').click();
        cy.get('textarea').last().type('Una observacion asignar', { force: true });
        cy.plexSelectAsync('label="Profesional"', 'CORTES JAZMIN', '@getProfesional', '58f74fd3d03019f919e9fff2');
        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            const i = xhr.response.body.solicitud.historial.length - 1;
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[1].observaciones).to.be.eq('Una observacion asignar');
            expect(xhr.response.body.solicitud.historial[i].descripcion).to.be.eq('Profesional asignado');
            expect(xhr.response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion asignar');
        
        });
        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('asignada');
    })

})