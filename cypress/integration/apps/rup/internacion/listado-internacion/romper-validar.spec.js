const moment = require('moment');

describe('Capa Estadistica - listado internacion', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();
        cy.loginCapa('estadistica').then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({
                configCamas: [
                    { estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: Cypress.moment().add(-2, 'd').toDate(), fechaEgreso: moment().toDate() },
                    { estado: 'ocupada', pacientes: [pacientes[1]], fechaIngreso: moment().subtract(5, 'hour').toDate(), fechaEgreso: moment().toDate(), validada: true }
                ]
            }).then(camasCreadas => {
                return cy.goto('/internacion/listado-internacion', token);
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
            "id": "59bbf1ed53916746547cb91a",
            "idCie10": 3,
            "idNew": 2384,
            "capitulo": "05",
            "grupo": "09",
            "causa": "F80",
            "subcausa": "8",
            "codigo": "F80.8",
            "nombre": "Otros trastornos del desarrollo del habla y del lenguaje",
            "sinonimo": "Otros trastornos del desarrollo del habla y del lenguaje",
            "descripcion": "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2": false
        }, {
            "id": "59bbf1ed53916746547cb941",
            "idCie10": 42,
            "idNew": 2423,
            "capitulo": "05",
            "grupo": "10",
            "causa": "F94",
            "subcausa": "0",
            "codigo": "F94.0",
            "nombre": "Mutismo electivo",
            "sinonimo": "Mutismo electivo",
            "descripcion": "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2": false
        }]).as('getDiagnostico');
        cy.route('GET', '**/api/core/mpi/pacientes/**', true).as('getPaciente');
        cy.route('GET', '**/api/modules/rup/internacion/camas**').as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestaciones');
        cy.viewport(1920, 1080);
    });

    it('Validar internacion', () => {
        cy.get('table tbody tr').eq(0).click({ force: true });
        cy.plexButton("VALIDAR").click();
        cy.contains("Confirmar validación");
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patchPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[xhr.response.body.estados.length - 1].tipo).to.be.eq('validada');
        });
    });

    it('Romper internacion', () => {
        cy.get('table tbody tr').eq(1).click({ force: true });
        cy.plexButton("ROMPER VALIDACION").click();
        cy.contains("Romper validación");
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patchPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[xhr.response.body.estados.length - 1].tipo).to.be.eq('ejecucion');
        });
    });
});