const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Capa Medica - Egresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964', permisos: [...permisosUsuario, 'internacion:rol:medica', 'internacion:egreso'] }).then(user => {
            cy.log(user);
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;

                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({ configCamas: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment('2020-01-10').toDate() }] }).then(camasCreadas => {
                        return cy.goto('/internacion/mapa-camas', token);
                    });
                });
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
        cy.plexDatetime('label="Fecha Egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true});

        cy.plexButtonIcon('check').click();

        cy.wait('@patchCamas')
        cy.toast('success', 'Prestacion guardada correctamente');
    });
});