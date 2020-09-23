const moment = require('moment');

describe('Capa Medica - Egresos', () => {
    let token;
    let pacientes;
    let camas;
    let salas;
    before(() => {
        cy.seed();

        cy.loginCapa('medica').then(([user, t, pacientesCreados]) => {
            pacientes = pacientesCreados;
            token = t;
            cy.factoryInternacion({ configCamas: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment('2020-01-10').toDate() }] })
            .then(camasCreadas => {
                camas = camasCreadas;
                cy.factoryInternacion({ sala:true, config: [{ estado: 'ocupada', pacientes: [pacientes[1]], fechaIngreso: moment().subtract(1, 'hour').toDate() }] })
                .then(salasCreadas => {
                    salas = salasCreadas;
                    return cy.goto('/internacion/mapa-camas', token);
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/rup/internacion/camas/historial?**').as('getHistorial');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');
        
        cy.viewport(1920, 1080);
    });

    it('Egreso simplificado', () => {
        cy.get('table tr').contains(camas[0].cama.nombre).first().click();
        cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexDatetime('label="Fecha Egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

        cy.plexButtonIcon('check').click();

        cy.wait('@patchCamas')
        cy.toast('success', 'Prestacion guardada correctamente');
    });
    
    it('Egreso en Sala Comun', () => {
        cy.get('table tr').contains(salas[0].nombre).first().click();
        cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexDatetime('label="Fecha Egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

        cy.plexButtonIcon('check').click();

        cy.wait('@egresoSalaComun').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Prestacion guardada correctamente');
    });
});