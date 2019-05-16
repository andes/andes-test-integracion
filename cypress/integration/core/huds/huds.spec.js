import {
    testearPermisoAccesoModulo
} from './../../util'
import {
    USER_USR_LOGIN,
    USER_PWRD_LOGIN
} from '../../../../config.private';

/// <reference types="Cypress" />

context('HUDS', () => {
    let token;
    before(() => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN);
    })

    beforeEach(() => {});

    const permiso = "huds:visualizacionHuds";
    const modulo = "huds";
    const ruta = Cypress.env('ROUTE_HUDS');

    it('Testear permisos de acceso al módulo', () => {
        testearPermisoAccesoModulo(permiso, modulo, ruta)
    });
})