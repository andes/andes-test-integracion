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
        cy.route('GET', '**/api/core/term/cie10?**', [{
            id: '59bbf1ed53916746547cbdba',
            idCie10: 1187.0,
            idNew: 3568.0,
            capitulo: '10',
            grupo: '02',
            causa: 'J12',
            subcausa: '9',
            codigo: 'J12.9',
            nombre: '(J12.9) Neumonía viral, no especificada',
            sinonimo: 'Neumonia viral, no especificada',
            descripcion: '10.Enfermedades del sistema respiratorio (J00-J99)',
            c2: true,
            reporteC2: 'Neumonia',
        }, {
            "id" : "59bbf1ed53916746547cb91a",
            "idCie10" : 3,
            "idNew" : 2384,
            "capitulo" : "05",
            "grupo" : "09",
            "causa" : "F80",
            "subcausa" : "8",
            "codigo" : "F80.8",
            "nombre" : "Otros trastornos del desarrollo del habla y del lenguaje",
            "sinonimo" : "Otros trastornos del desarrollo del habla y del lenguaje",
            "descripcion" : "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2" : false
        }, {
            "id" : "59bbf1ed53916746547cb941",
            "idCie10" : 42,
            "idNew" : 2423,
            "capitulo" : "05",
            "grupo" : "10",
            "causa" : "F94",
            "subcausa" : "0",
            "codigo" : "F94.0",
            "nombre" : "Mutismo electivo",
            "sinonimo" : "Mutismo electivo",
            "descripcion" : "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2" : false
        }]).as('getDiagnostico');
        cy.route('GET', '**/api/modules/rup/internacion/camas/historial?**', true).as('getHistorial');
        cy.route('GET', '**/api/core/mpi/pacientes/**', true).as('getPaciente');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**', true).as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**', true).as('patchPrestaciones');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**', true).as('patchCamas');
        cy.viewport(1920, 1080);
    });

    it('Egreso completo', () => {
        cy.plexButtonIcon('minus').click();
        cy.contains('Egresar paciente').click();

        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexSelectAsync('label="Diagnostico Principal al egreso"', 'Neumo', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otro Diagnóstico"', 'Otros trastornos', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otras circunstancias"', 'Mutismo', '@getDiagnostico', 0);
        cy.plexDatetime('label="Fecha Egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true});

        cy.plexButtonIcon('check').click();

        cy.wait(100)
        cy.contains('Los datos se actualizaron correctamente')
        cy.contains('Aceptar').click();
    });
});