/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context('ANULAR SOLICITUD', () => {
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
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');
    })

    it('aceptar', () => {
        cy.server();
        cy.plexButtonIcon('lock-alert').first().click();
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
        cy.plexButtonIcon('calendar-plus');
        anular();
    })
})

function anular() {
    cy.plexButtonIcon('delete').click();
    cy.get('textarea').last().type('Una observacion anular', { force: true });
    cy.plexButton('Confirmar').click();
    cy.wait('@auditarSolicitud').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
        const i = xhr.response.body.solicitud.historial.length - 1;
        expect(xhr.response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion anular');  
        expect(xhr.response.body.solicitud.historial[i].accion).to.be.eq('anulada');
        expect(xhr.response.body.solicitud.historial[i].descripcion).to.be.eq('Anulada');
    });
    cy.wait('@solicitudes');
    cy.plexButtonIcon('chevron-down').click();
    cy.plexSelectType('label="Estado"', 'ANULADA');
    cy.wait('@solicitudes');
    cy.wait('@solicitudes').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
        const i = xhr.response.body[0].solicitud.historial.length - 1;
        expect(xhr.response.body[0].solicitud.historial[i].descripcion).to.be.eq('Anulada');
        expect(xhr.response.body[0].solicitud.historial[i].observaciones).to.be.eq('Una observacion anular');
    }); 

}
