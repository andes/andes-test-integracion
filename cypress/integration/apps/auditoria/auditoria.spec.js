/// <reference types="Cypress" />

context('auditoria', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('apps/auditoria/paciente-validado1.json', token);
            cy.createPaciente('apps/auditoria/paciente-validado2.json', token);
            cy.createPaciente('apps/auditoria/paciente-temporal1.json', token);
            cy.createPaciente('apps/auditoria/paciente-temporal2.json', token);
        })
    })
    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.server();
        cy.goto('/apps/mpi/auditoria', token);
        cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaPaciente');
        cy.route('POST', '**api/core/mpi/pacientes/**').as('vincularPaciente');
    })

    it('vincular dos pacientes validados', () => {
        cy.plexText('name="buscador"', '12386056');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains('VALIDADO1').click();
        cy.plexButton('Vincular').click();
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', '12386056');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('VALIDADO2').click();

        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });

        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente temporal con uno temporal', () => {
        cy.plexText('name="buscador"', '1598607');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains('TEMPORAL1').click();
        cy.plexButton('Vincular').click();
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', '1598607');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('TEMPORAL2').click();

        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it.skip('vincular un paciente validado con uno temporal', () => {
        cy.server();
        cy.get('paciente-buscar').get('plex-text input').first().type('31965283'); // paciente validado
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Validado').first().click(); // selecciono el primer resultado de la tabla
        cy.get('plex-layout-footer plex-button[label="Vincular"]').click();
        cy.wait(2000);
        cy.get('legend').should('have.text', 'Listado de pacientes candidatos'); // debe cambiar de componente para hacer la búsqueda del paciente a vincular con el primero
        cy.get('paciente-buscar').get('plex-text input').first().type('35468716'); // paciente temporal
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-warning').should('contain', 'Temporal').first().click(); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Vincular"]').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });
})