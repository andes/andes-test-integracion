/// <reference types="Cypress" />

context('Reportes', () => {
    let token
    before(() => {
        cy.login('34377650', '159753000').then(t => {
            token = t;
        })
    })


    it('Ingreso a REPORTES sin permisos', () => {

        cy.visit(Cypress.env('BASE_URL') + '/reportes', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        })
    });

});