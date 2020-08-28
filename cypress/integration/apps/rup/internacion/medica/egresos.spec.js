const moment = require('moment');

describe('Capa Medica - Egresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        cy.loginCapa('medica').then(([user, t, pacientesCreados]) => {
            pacientes = pacientesCreados;
            token = t;
            cy.factoryInternacion({ configCamas: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment('2020-01-10').toDate() }] }).then(camasCreadas => {
                return cy.goto('/internacion/mapa-camas', token);
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/rup/internacion/camas/historial?**', true).as('getHistorial');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**', true).as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**', true).as('patchCamas');
        cy.viewport(1920, 1080);
    });

    it('Egreso simplificado', () => {
        cy.plexButtonIcon('minus').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexDatetime('label="Fecha Egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

        cy.plexButtonIcon('check').click();

        cy.wait('@patchCamas')
        cy.toast('success', 'Prestacion guardada correctamente');
    });
});