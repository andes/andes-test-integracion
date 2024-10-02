describe('Capa Estadistica - Ingresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();
        cy.loginCapa('estadistica').then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({
                configCamas: [
                    { estado: 'disponible', fechaIngreso: Cypress.moment().add(-2, 'm').toDate() },
                    { estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: Cypress.moment().add(-2, 'd').toDate() }
                ]
            }).then(camasCreadas => {
                return cy.goto('/mapa-camas', token);
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.intercept('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '/api/core/term/snomed/expression?expression=<<394658006&words=**', [{
            "conceptId": "1234",
            "term": "Enfermeria en Rehabilitación",
        }, {
            "conceptId": "666",
            "term": "Dolor",
        }]).as('expEspecialidad');
        cy.route('GET', '**/api/core/tm/ocupacion?nombre=**', [{
            "_id": "5c793679af78f1fa5d0a8e1e",
            "id": "5c793679af78f1fa5d0a8e1e",
            "nombre": "Abogado",
            "codigo": "131"
        }, {
            "_id": "5c793679af78f1fa5d0a8e1a",
            "id": "5c793679af78f1fa5d0a8e1a",
            "nombre": "Medico",
            "codigo": "132"
        }]).as('getOcupacion')

        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestaciones');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/camaEstados/**').as('patchCamaEstados');
        cy.viewport(1600, 900);
    });

    it('Ingreso completo cambiando paciente', () => {
        cy.get('*[class="adi adi-plus ii-light sm"]').click({ force: true });

        cy.plexText('name="buscador"', pacientes[0].nombre);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.length).to.be.gte(1);
        });

        cy.get('plex-layout-sidebar paciente-listado plex-item').contains(pacientes[0].nombre).click();
        cy.swal('confirm', 'Paciente ya internado');

        cy.plexText('name="buscador"').clear();
        cy.plexText('name="buscador"', pacientes[1].nombre);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.length).to.be.gte(1);
        });

        cy.wait(1000)
        cy.get('plex-layout-sidebar paciente-listado plex-item').contains(pacientes[1].nombre).click();
        cy.wait('@getPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.plexDatetime('label="Fecha y hora de ingreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha y hora de ingreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
        cy.plexSelectType('name="origen"', 'Emergencia');
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexText('name="motivo"', 'Estornudo');
        cy.plexSelectAsync('name="especialidad"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectType('label="Cobertura"', 'Ninguno');
        cy.plexSelectType('name="situacionLaboral"', 'No trabaja y no busca trabajo');
        cy.plexSelectAsync('name="ocupacionHabitual"', 'Abog', '@getOcupacion', 0);
        cy.plexSelectType('name="nivelInstruccion"', 'Ninguno');
        cy.plexSelectType('label="Cama"').click().get('.option').contains('CAMA').click()

        cy.plexButtonIcon('check').click();

        cy.wait('@patchCamaEstados').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.swal('confirm', 'Paciente internado');
    });

    it('Editar ingreso', () => {
        cy.goto('/mapa-camas', token);
        cy.get('table tbody tr td').contains(pacientes[0].nombre).first().click();

        cy.get('plex-tabs ul li').eq(1).click();
        cy.get('plex-title[titulo="INGRESO"] div').eq(2);
        cy.get('plex-layout-sidebar plex-button[tooltip="Editar ingreso"]').first().click({ force: true });
        cy.plexSelect('name="origen"').clearSelect();
        cy.plexSelectType('name="origen"', 'Emergencia');

        cy.plexSelect('name="profesional"').clearSelect();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexText('name="motivo"', 'Estornudo');
        cy.plexSelectAsync('name="especialidad"', 'Dol', '@expEspecialidad', 0);
        cy.plexSelectType('label="Cobertura"', 'Plan o Seguro publico');
        cy.plexSelectType('name="situacionLaboral"', 'Trabaja o está de licencia');
        cy.plexSelectAsync('name="ocupacionHabitual"', 'Med', '@getOcupacion', 0);
        cy.plexSelectType('name="nivelInstruccion"', 'Ninguno');

        cy.plexButtonIcon('check').click();

        cy.wait('@patchPrestaciones').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.swal('confirm', 'Los datos se actualizaron correctamente');
    });
});