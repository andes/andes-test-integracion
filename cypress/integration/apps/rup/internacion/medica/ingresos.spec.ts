['medica', 'enfermeria'].forEach((capa) => {

    describe(`Capa ${capa} - Ingresos`, () => {
        let token;
        let pacientes;
        let camas;
        let salas;
        let posPaciente = (capa === 'medica') ? 0 : 2;
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
            cy.intercept('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
            cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**' , req => {
                delete req.headers['if-none-match']
            }).as('getPaciente');
            cy.intercept('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
            cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.intercept('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.intercept('POST', '**/api/modules/rup/internacion/sala-comun/**').as('internarPaciente');
            cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.viewport(1920, 1080);
        });

        it('Ingreso simplificado cambiando paciente', () => {
            cy.get('table tbody tr td').contains(camas[0].cama.nombre).first().click({force: true});
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('plus').click();
            cy.plexText('name="buscador"', pacientes[posPaciente].nombre);
            cy.wait('@busquedaPaciente').then(({response}) => {
                expect(response.statusCode).to.eq(200);
                expect(response.body.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[posPaciente].nombre).click({force: true});
            cy.wait('@getPaciente').then(({response}) => {
                expect(response.statusCode).to.be.eq(200);
            });

            cy.plexButtonIcon('arrow-left').click();

            cy.plexText('name="buscador"').clear();
            cy.plexText('name="buscador"', pacientes[posPaciente + 1].nombre);
            cy.wait('@busquedaPaciente').then(({response}) => {
                expect(response.statusCode).to.eq(200);
                expect(response.body.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[posPaciente + 1].nombre).click();
            cy.wait('@getPaciente').then(({response}) => {
                expect(response.statusCode).to.eq(200);
            });

            cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha Ingreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
            cy.wait('@getCamas');

            cy.plexSelectType('label="Cama"', 'CAMA');
            cy.plexButtonIcon('check').click();

            cy.wait('@patchCamas').then(({response}) => {
                expect(response.statusCode).to.eq(200);
            });

            cy.swal('confirm', 'Paciente internado');
        });

        it('Ingreso a sala comun', () => {
            cy.get('table tr').contains(salas[0].nombre).first().click({force: true});
            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2);
            cy.get('plex-layout-sidebar').plexButtonIcon('plus').click({force: true});
            cy.plexText('name="buscador"').clear();
            cy.plexText('name="buscador"', pacientes[posPaciente].nombre);
            cy.wait('@busquedaPaciente').then(({response}) => {
                expect(response.statusCode).to.eq(200);
                expect(response.body.length).to.be.gte(1);
            });

            cy.get('paciente-listado plex-item').contains(pacientes[posPaciente].nombre).click();

            cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
            cy.plexDatetime('label="Fecha Ingreso"', { text: Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
            cy.wait('@getCamas');
            cy.plexSelectType('label="Cama"', 'SALA');

            cy.plexButtonIcon('check').click();

            cy.wait('@internarPaciente').then(({response}) => {
                expect(response.statusCode).to.eq(200);
            });

            cy.swal('confirm', 'Paciente internado');
        });
    });
});