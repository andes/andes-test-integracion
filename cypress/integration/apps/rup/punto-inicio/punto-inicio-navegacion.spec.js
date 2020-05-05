/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {

    let token;
    let pacientes;

    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    describe('Navegacion', () => {
        beforeEach(() => {
            cy.goto('/rup', token);
            cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
            cy.route('POST', '**/api/modules/huds/accesos/token**').as('tokenHuds');
        });

        it('iniciar prestacion fuera de agenda', () => {
            cy.plexButton('PACIENTE FUERA DE AGENDA').click();
            cy.url().should('include', '/rup/crear/fueraAgenda')
        });

        it('ver huds', () => {
            cy.plexButton('HUDS DE UN PACIENTE').click();
            cy.url().should('include', '/rup/huds');
            cy.plexText('name="buscador"', '3399661');
            cy.wait('@searchPaciente');
            cy.get('paciente-listado').find('td').contains('3399661').click();
            cy.get('plex-radio input').first().click({ force: true });
            cy.plexButton('ACEPTAR').click();
            cy.wait('@tokenHuds').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('plex-tabs').contains('Accesos a la HUDS').click({ force: true });
            cy.get('plex-tabs').contains('Registros del Paciente').click({ force: true });
            cy.get('plex-tabs').contains('Resumen del Paciente').click({ force: true });
        });

        it('autocitar paciente', () => {
            cy.plexButton('PACIENTE AUTOCITADO').click();
            cy.url().should('include', '/rup/crear/autocitar')
        });
    });

});