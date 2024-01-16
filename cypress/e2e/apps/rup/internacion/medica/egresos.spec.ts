const moment = require('moment');

['medica', 'enfermeria'].forEach((capa) => {
    describe(`Capa ${capa} - Egresos`, () => {
        let token;
        let pacientes;
        let camas;
        let salas;
        before(() => {
            cy.seed();

            cy.loginCapa(capa).then(([user, t, pacientesCreados]) => {
                pacientes = pacientesCreados;
                token = t;
                cy.factoryInternacion({ configCamas: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment('2020-01-10').toDate() }] })
                    .then(camasCreadas => {
                        camas = camasCreadas;
                        cy.factoryInternacion({ sala: true, config: [{ estado: 'ocupada', pacientes: [pacientes[1]], fechaIngreso: moment().subtract(1, 'hour').toDate() }] })
                            .then(salasCreadas => {
                                salas = salasCreadas;
                                return cy.goto('/mapa-camas', token);
                            });
                    });
            });
        });

        beforeEach(() => {
            cy.intercept('GET', '**/api/modules/rup/internacion/camas/historial?**').as('getHistorial');
            cy.intercept('GET', '**api/modules/rup/internacion/medica/**').as('getHistorial2');
            cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/camaEstados/**').as('patchCamaEstados');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');

            cy.viewport(1920, 1080);
        });

        it('Egreso simplificado', () => {
            cy.getCama(pacientes[0].apellido).click();
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexIcon('menos').click().get('a').contains('Egresar paciente').click();

            cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
            cy.plexDatetime('label="Fecha y hora de egreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha y hora de egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

            cy.plexButtonIcon('check').click();

            cy.wait('@patchCamaEstados')
            cy.swal('confirm');
        });

        it('Egreso en Sala Comun', () => {
            cy.goto('/mapa-camas', token);
            cy.getCama(pacientes[0].apellido).click();
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.plexDropdown('icon="menos"').first().click().get('a').contains('Egresar paciente').click();

            cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
            cy.plexDatetime('label="Fecha y hora de egreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha y hora de egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

            cy.plexButtonIcon('check').click();

            cy.wait('@egresoSalaComun').then(({ response }) => {
                expect(response.statusCode).to.eq(200);
            });
            cy.swal('confirm');
            cy.getCama().should('have.length', 2);
        });
    });
});