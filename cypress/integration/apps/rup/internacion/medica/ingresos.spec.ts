['medica', 'enfermeria'].forEach((capa) => {

    describe(`Capa ${capa} - Ingresos`, () => {
        let token;
        let pacientes;
        let camas;
        let salas;
        before(() => {
            cy.seed();

            cy.loginCapa(capa).then(([user, t, pacientesCreados]) => {
                token = t;
                pacientes = pacientesCreados;
                cy.factoryInternacion({
                    configCamas: [
                        { estado: 'disponible', fechaIngreso: Cypress.moment().add(-2, 'm').toDate() }
                    ]
                }).then(camasCreadas => {
                    camas = camasCreadas
                    cy.factoryInternacion({
                        sala: true,
                        config: [
                            { estado: 'disponible' }
                        ]
                    }).then(salasCreadas => {
                        salas = salasCreadas
                        return cy.goto('/mapa-camas', token);
                    });
                });
            });
        });

        beforeEach(() => {
            cy.server();
            cy.route('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
            cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
            cy.route('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
            cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.route('POST', '**/api/modules/rup/internacion/sala-comun/**').as('internarPaciente');
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.viewport(1920, 1080);
        });

        it('Ingreso simplificado cambiando paciente', () => {
            cy.get('table tbody tr td').contains(camas[0].cama.nombre).first().click();
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('plus').click();
            cy.plexText('name="buscador"', pacientes[0].nombre);
            cy.wait('@busquedaPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.responseBody.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[0].nombre).click();
            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.plexButtonIcon('arrow-left').click();

            cy.plexText('name="buscador"').clear();
            cy.plexText('name="buscador"', pacientes[1].nombre);
            cy.wait('@busquedaPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.responseBody.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[1].nombre).click();
            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha Ingreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
            cy.wait('@getCamas');

            cy.plexSelectType('label="Cama"', 'CAMA');
            cy.plexButtonIcon('check').click();

            cy.wait('@patchCamas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.swal('confirm', 'Paciente internado');
        });

        it('Ingreso a sala comun', () => {
            cy.get('table tr').contains(salas[0].nombre).first().click();
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('plus').click();
            cy.plexText('name="buscador"').clear();
            cy.plexText('name="buscador"', pacientes[0].nombre);
            cy.wait('@busquedaPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.responseBody.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[0].nombre).click();

            cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha Ingreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
            cy.wait('@getCamas');
            cy.plexSelectType('label="Cama"', 'SALA');

            cy.plexButtonIcon('check').click();

            cy.wait('@internarPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.swal('confirm', 'Paciente internado');
        });
    });
});