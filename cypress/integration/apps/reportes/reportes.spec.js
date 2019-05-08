/// <reference types="Cypress" />

/* Para ejecutar este test correctamente se deben modificar los permisos del
    usuario que se este usando para loggearse, asignando permisos para reportes
    en una ejecución y quitandolos para la siguiente.
*/

context('Reportes', () => {
    let token
    before(() => {
        cy.login('34377650', '159753000').then(t => {   // <---- Credenciales que se deben modificar (uss, pass)
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