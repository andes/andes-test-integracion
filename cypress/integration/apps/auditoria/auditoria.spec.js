/// <reference types="Cypress" />

context('auditoria', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        })
    })
    beforeEach(() => {
        cy.viewport(1280, 720);

        cy.visit('/apps/mpi/auditoria', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })
    it.skip('vincular dos pacientes validados', () => {
        cy.server();
        cy.get('paciente-buscar').get('plex-text input').first().type('39130233');
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Validado').first().click(); // selecciono el primer resultado de la tabla
        cy.get('plex-layout-footer plex-button[label="Vincular"]').click();
        cy.wait(4000);
        cy.get('paciente-buscar').get('plex-text input').first().type('39404080');
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Validado').first().click(); // valido que la persona buscada esté validada y la selecciono

        cy.get('plex-button[label="Vincular"]').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it.skip('vincular un paciente temporal con uno temporal', () => {
        cy.server();
        cy.get('paciente-buscar').get('plex-text input').first().type('36606632'); // paciente temporal
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-warning').should('contain', 'Temporal').first().click(); // selecciono el primer resultado de la tabla
        cy.get('plex-layout-footer plex-button[label="Vincular"]').click();
        cy.wait(2000);
        cy.get('legend').should('have.text', 'Listado de pacientes candidatos'); // debe cambiar de componente para hacer la búsqueda del paciente a vincular con el primero
        cy.get('paciente-buscar').get('plex-text input').first().type('nicolas vicentelo'); // paciente temporal
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-warning').should('contain', 'Temporal').first().click(); // valido que la persona buscada esté validada y la selecciono

        cy.get('plex-button[label="Vincular"]').click();
        cy.get('button').contains('CONFIRMAR').click();
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