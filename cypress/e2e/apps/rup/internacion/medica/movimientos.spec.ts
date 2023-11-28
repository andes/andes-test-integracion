const moment = require('moment');

['medica', 'enfermeria'].forEach((capa) => {
    describe(`Capa ${capa} - Movimientos`, () => {
        let token;
        let pacientes;
        let camas;
        let salas;
        before(() => {
            cy.seed();

            cy.loginCapa(capa).then(([user, t, pacientesCreados]) => {
                pacientes = pacientesCreados;
                token = t;
                cy.factoryInternacion({ configCamas: [{ estado: 'disponible' }] })
                    .then(camasCreadas => {
                        camas = camasCreadas;
                        cy.factoryInternacion({ sala: true, config: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment().subtract(1, 'hour').toDate() }] })
                            .then(salasCreadas => {
                                salas = salasCreadas;
                                return cy.goto('/mapa-camas', token);
                            });
                    });
            });
        });

        beforeEach(() => {
            cy.intercept('GET', `**/api/modules/rup/internacion/${capa}/**`).as('getHistorial');
            cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/camaEstados/**').as('patchCamaEstados');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');

            cy.viewport(1920, 1080);
        });

        it('Movimiento Sala -> Cama', () => {
            cy.getCama(pacientes[0].apellido).click();

            cy.wait('@getHistorial').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });

            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('menos').click();
            cy.plexButton('Pase de unidad organizativa').click();

            cy.plexSelectType('label="Cama"', 'CAMA');

            cy.plexButtonIcon('check').click();

            cy.wait('@patchCamaEstados').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });

            cy.wait('@egresoSalaComun').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });


            cy.swal('confirm', 'Pase de unidad organizativa exitoso');

            cy.getCama().should('have.length', 2);
        });
    });
});