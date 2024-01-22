/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {

    let token;

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
            cy.get('[tooltip="Fuera de agenda"]').then((items) => {
                items[0].click()
            });
        });

        it('ver huds', () => {
            cy.get('[tooltip="HUDS de paciente"]').then((items) => {
                items[0].click()
            });
        });

        it('autocitar paciente', () => {
            cy.get('[tooltip="Autocitado"]').then((items) => {
                items[0].click()
            });
        });
    });

});