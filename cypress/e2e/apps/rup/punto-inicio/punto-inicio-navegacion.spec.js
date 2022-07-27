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
        });

        it('iniciar prestacion fuera de agenda', () => {
            cy.plexButton('PACIENTE FUERA DE AGENDA').click();
            cy.url().should('include', '/rup/crear/fueraAgenda')
        });

        it('ver huds', () => {
            cy.plexButton('HUDS DE UN PACIENTE').click();
            cy.url().should('include', '/huds')
        });

        it('autocitar paciente', () => {
            cy.plexButton('PACIENTE AUTOCITADO').click();
            cy.url().should('include', '/rup/crear/autocitar')
        });
    });

});