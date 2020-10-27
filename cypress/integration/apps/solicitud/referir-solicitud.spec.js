/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context('SOLICITUDES - REFERIR', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.createSolicitud('solicitudes/solicitud-auditoria', token);
            cy.task('database:seed:agenda', { tipoPrestaciones: '59ee2d9bf00c415246fd3d6b', fecha: 2, profesionales: '5c82a5a53c524e4c57f08cf3', estado: 'disponible', tipo: 'profesional' });
        })
    })

    beforeEach(() => {

        cy.goto('/solicitudes', token);
        cy.server();
        cy.route('GET', '**/api/modules/top/reglas?**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes**').as('solicitudes');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones').as('tipoPrestaciones');
    })

    it('crear solicitud de entrada y referirla', () => {
        cy.get('plex-item').contains('CORTES, JAZMIN').click();
        cy.plexButtonIcon('lock-alert').first().click();

        cy.plexButton('Referir').click();

        cy.plexSelectAsync('label="Organización destino"', 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON', '@getReglas', 0);
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', 'consulta de cardiología').click({ force: true });
        cy.plexSelectAsync('label="Profesional destino"', 'ALICIA', '@getProfesional', 0);

        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.historial[0].accion).to.be.eq('referir');
        });

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].solicitud.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body[0].solicitud.profesional.id).to.be.eq('5c82a5a53c524e4c57f08cf2');
            expect(xhr.response.body[0].solicitud.tipoPrestacion.conceptId).to.be.eq('291000013102');
            expect(xhr.response.body[0].solicitud.historial[0].accion).to.be.eq('referir');
        });
        cy.get('plex-item').contains('CORTES, JAZMIN').click();
        cy.get('historial-solicitud').contains('Referida por Natalia Huenchuman');

    });
})
