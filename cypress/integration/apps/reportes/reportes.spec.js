/// <reference types="Cypress" />

context('Reportes', () => {
    let token
    before(() => {
        cy.login('34377650', '159753000').then(t => {   // <---- Credenciales que se deben modificar (uss, pass)
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/reportes', token);
    })

    it('Ingreso a REPORTES sin permisos', () => {
        /* Para ejecutar este test correctamente se deben modificar los permisos del
    usuario que se este usando para loggearse, asignando permisos para reportes
    en una ejecución y quitandolos para la siguiente.
*/
    });

});