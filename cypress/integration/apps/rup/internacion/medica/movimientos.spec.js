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
            cy.server();
            cy.route('GET', `**/api/modules/rup/internacion/${capa}/**`).as('getHistorial');
            cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.route('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');

            cy.viewport(1920, 1080);
        });

        it('Movimiento Sala -> Cama', () => {
            cy.getCama(pacientes[0].apellido).click();

            cy.wait('@getHistorial').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('menos').click();
            cy.plexButton('Pase de unidad organizativa').click();

            cy.plexSelectType('label="Cama"', 'CAMA');

            cy.plexButtonIcon('check').click();

            cy.wait('@egresoSalaComun').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.wait('@patchCamas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.swal('confirm', 'Pase de unidad organizativa exitoso');

            cy.getCama().should('have.length', 2);
        });
    });
});