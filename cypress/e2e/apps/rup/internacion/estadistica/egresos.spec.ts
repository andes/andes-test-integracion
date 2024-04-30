describe('Capa Estadistica - Egresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();
        cy.loginCapa('estadistica').then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({
                configCamas: [{
                    estado: 'ocupada', pacientes: [pacientes[1]],
                    fechaIngreso: Cypress.moment().subtract(1, 'day').toDate(),
                    extras: { ingreso: true }
                }]
            });
            cy.task('database:seed:prestacion',
                {
                    paciente: pacientes[1]._id,
                    estado: 'ejecucion',
                    fecha: Cypress.moment().subtract(1, 'day').toDate(),
                    ambitoOrigen: 'internacion'
                }
            )
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/api/core/term/cie10?**', [{
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
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas**').as('getCamas');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas/historial?**').as('getHistorial');
        cy.intercept('GET', '**/api/modules/rup/internacion/prestaciones?fechaIngresoDesde=?**').as('getListado');

        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestaciones');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/camaEstados/**').as('patchCamaEstados');
        cy.viewport(1920, 1080);

        cy.goto('/mapa-camas', token);
        cy.wait(300)
    });

    it('Egreso completo', () => {
        cy.wait(300)
        cy.plexDropdown('icon="menos"').click().wait(500).get('a').contains('Egresar paciente').click();
        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexSelectAsync('label="Diagnostico Principal al egreso"', 'Neumo', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otros Diagnósticos"', 'Otros trastornos', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otras circunstancias que prolongan la internación"', 'Mutismo', '@getDiagnostico', 0);
        cy.plexDatetime('label="Fecha y hora de egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha y hora de egreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });

        cy.plexButtonIcon('check').click();

        cy.wait('@patchPrestaciones').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.swal('confirm', 'Los datos se actualizaron correctamente');
    });

    it('Editar egreso desde listado', () => {
        cy.plexButton('LISTADO DE INTERNACIÓN').click()
        cy.wait('@getListado');
        cy.get('plex-table tr td').first().click();
        cy.get('plex-options').contains('EGRESO').click({ force: true });

        cy.get('app-informe-egreso plex-button[icon="pencil"]').click({ force: true });

        cy.plexSelect('label="Tipo de egreso"').find('.remove-button').click();
        cy.plexSelectType('label="Tipo de egreso"', 'Defuncion').click();
        cy.plexSelect('label="Otros Diagnósticos"').find('.remove-button').click();;
        cy.plexSelectAsync('label="Otros Diagnósticos"', 'Otros trastornos', '@getDiagnostico', 0);

        cy.plexButtonIcon('check').click();

        cy.wait('@patchPrestaciones').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.swal('confirm', 'Los datos se actualizaron correctamente');
    });
});