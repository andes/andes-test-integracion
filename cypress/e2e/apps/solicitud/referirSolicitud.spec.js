/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context(' REFERIR SOLICITUD', () => {
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
        cy.route('GET', '**/api/core-v2/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('conceptosTurneables');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes**').as('solicitudes');
        cy.route('GET', '**/api/core/tm/organizaciones**').as('getOrganizaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('POST', '**/api/modules/top/reglas').as('guardarRegla');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');
    })

    it('referir', () => {
        cy.server();
        cy.get('plex-dropDown').click().get('a').contains('Auditar').click();
        cy.plexButton('Referir').click();
        cy.get('textarea').last().type('Una observacion referir', { force: true });
        cy.plexSelect('label="Organización destino"', 0).click();
        cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).click();
        cy.plexSelectAsync('label="Profesional destino"', 'CORTES JAZMIN', '@getProfesional', '58f74fd3d03019f919e9fff2');

        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            const i = xhr.response.body.solicitud.historial.length - 1;
            expect(xhr.response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion referir');
            expect(xhr.response.body.solicitud.historial[i].descripcion).to.be.eq('Referida');
        });
        cy.get('plex-badge').contains('auditoria');
        cy.get('plex-dropDown').click().get('a').contains('Auditar');
    })

})