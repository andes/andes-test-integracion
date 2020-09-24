const moment = require('moment');

describe('Capa Medica - Movimientos', () => {
    let token;
    let pacientes;
    let camas;
    let salas;
    before(() => {
        cy.seed();

        cy.loginCapa('medica').then(([user, t, pacientesCreados]) => {
            pacientes = pacientesCreados;
            token = t;
            cy.factoryInternacion({ configCamas: [{ estado: 'disponible' }] })
            .then(camasCreadas => {
                camas = camasCreadas;
                cy.factoryInternacion({ sala: true, config: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment().subtract(1, 'hour').toDate() }] })
                .then(salasCreadas => {
                    salas = salasCreadas;
                    return cy.goto('/internacion/mapa-camas', token);
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/rup/internacion/medica/**').as('getHistorial');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');
        
        cy.viewport(1920, 1080);
    });

    it('Movimiento Sala -> Cama', () => {
        cy.get('table tr').contains(salas[0].nombre).first().click();

        cy.wait('@getHistorial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
        cy.contains('Pase de unidad organizativa').click();

        cy.plexSelectType('label="Cama"', 'CAMA');

        cy.plexButtonIcon('check').click();

        cy.wait('@egresoSalaComun').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@patchCamas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.contains('Pase de unidad organizativa exitoso!')
        cy.contains('Aceptar').click();
    });
});