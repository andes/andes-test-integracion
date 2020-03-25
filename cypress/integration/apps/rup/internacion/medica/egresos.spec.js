const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Capa Estadistica - Ingresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { permisos: [...permisosUsuario, 'internacion:rol:medica'] }).then(user => {
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
        cy.route('GET', '**/api/core/term/cie10?**').as('getDiagnostico');
        cy.viewport(1920, 1080);
    });

    it('Egreso simplificado', () => {
        cy.plexButtonIcon('minus').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexButtonIcon('check').click();

        cy.wait(100)
        cy.toast('success', 'Prestacion guardada correctamente');
    });
});