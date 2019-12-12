/// <reference types="Cypress" />

context('auditoria', () => {
    let token;
    let validado1;
    let validado2;
    let validado3;
    let temporal1;
    let temporal2;
    let temporal3;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        // [TODO] poder crear tres o más paciente de un tiro.
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
            validado1 = p;
        });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
            validado2 = p;
        });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
            validado3 = p;
        });
        cy.task('database:create:paciente', { template: 'temporal' }).then(p => {
            temporal1 = p;
        });
        cy.task('database:create:paciente', { template: 'temporal' }).then(p => {
            temporal2 = p;
        });
        cy.task('database:create:paciente', { template: 'temporal' }).then(p => {
            temporal3 = p;
        });
    })
    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**/api/core/mpi/pacientes/**').as('vincularPaciente');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.goto('/apps/mpi/auditoria', token);
    })

    it('vincular dos pacientes validados', () => {
        cy.plexText('name="buscador"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(validado1.nombre).click();
        cy.wait(100);
        cy.plexButton('Vincular').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', validado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(validado2.nombre).click();

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
        cy.plexText('name="buscador"', temporal1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(temporal1.nombre).click();
        cy.wait(100);

        cy.plexButton('Vincular').click();
        // cy.wait();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', temporal2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(temporal2.nombre).click();

        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente validado con uno temporal', () => {
        cy.plexText('name="buscador"', validado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(validado3.documento).click();
        cy.wait(100);

        cy.plexButton('Vincular').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', temporal3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(temporal3.nombre).click();

        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');















        // cy.server();
        // cy.get('paciente-buscar').get('plex-text input').first().type('31965283'); // paciente validado
        // cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        // cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Validado').first().click(); // selecciono el primer resultado de la tabla
        // cy.get('plex-layout-footer plex-button[label="Vincular"]').click();
        // cy.wait(2000);
        // cy.get('legend').should('have.text', 'Listado de pacientes candidatos'); // debe cambiar de componente para hacer la búsqueda del paciente a vincular con el primero
        // cy.get('paciente-buscar').get('plex-text input').first().type('35468716'); // paciente temporal
        // cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        // cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-warning').should('contain', 'Temporal').first().click(); // valido que la persona buscada esté validada y la selecciono
        // cy.get('plex-button[label="Vincular"]').click();
        // cy.get('button').contains('CONFIRMAR').click();
        // cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        // cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });
})