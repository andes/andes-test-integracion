describe('Capa Médica - Ingresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        cy.loginCapa('medica').then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;

            // CREA UN MUNDO IDEAL DE INTERNACION
            cy.factoryInternacion({
                configCamas: [
                    { estado: 'disponible', fechaIngreso: Cypress.moment().add(-2, 'm').toDate() }
                ]
            }).then(camasCreadas => {
                return cy.goto('/internacion/mapa-camas', token);
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.viewport(1920, 1080);
    });

    it('Ingreso simplificado cambiando paciente', () => {
        cy.get('table tr').plexButtonIcon('plus').click();

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

        cy.contains('Paciente internado')
        cy.contains('Aceptar').click();
    });
});