import { testearPermisoAccesoModulo } from './../../util'

/// <reference types="Cypress" />

context('HUDS', () => {
    let token
    before(() => {
        cy.login(Cypress.env('USER_USR_LOGIN'), Cypress.env('USER_PWRD_LOGIN')).then(t => {
            token = t;
        })
    })

    beforeEach(() => {
    });

    const permiso = "huds:visualizacionHuds";
    const modulo = "huds";
    const ruta = Cypress.env('ROUTE_HUDS');

    it('Testear permisos de acceso al modulo', () => { testearPermisoAccesoModulo(permiso, modulo, ruta) });
})