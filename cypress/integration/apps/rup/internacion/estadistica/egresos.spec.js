const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Capa Estadistica - Egresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964', permisos: [...permisosUsuario, 'internacion:rol:estadistica', 'internacion:egreso'] }).then(user => {
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
        cy.route('GET', '**/api/modules/rup/internacion/camas/historial?**', true).as('getHistorial');
        cy.route('GET', '**/api/core/mpi/pacientes/**', true).as('getPaciente');
        cy.viewport(1920, 1080);
    });

    it('Egreso completo', () => {
        cy.plexButtonIcon('minus').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexSelectAsync('label="Diagnostico Principal al egreso"', 'Autismo', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otro Diagnóstico"', 'Blefaritis', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otras circunstancias"', 'Meningitis', '@getDiagnostico', 0);

        cy.plexButtonIcon('check').click();

        cy.wait(100)
        cy.contains('Los datos se actualizaron correctamente')
        cy.contains('Aceptar').click();
    });
});