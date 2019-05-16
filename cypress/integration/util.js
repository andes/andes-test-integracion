import {
    ANDES_KEY,
    USER_USR_LOGIN,
    USER_PWRD_LOGIN
} from "../../config.private";

/**
 * Utiliza función testearPermiso para testear permiso de acceso,
 * enviando como parametro 2 y 3, respectivamente
 *  - Una funcion que valida que al navegar a la ruta dada redirija a inicio (permiso denegado)
 *  - Una funcion que valida que al navegar a la ruta pueda ingresar a la misma (permiso permitico)
 *
 * @param {*} permiso: permiso que quiero testestar 
 * @param {*} modulo: modulo que quiero testestar
 * @param {*} ruta: ruta sobre la cual quiero probar permiso de acceso
 * @param {*} ruta: ruta sobre la cual quiero probar permiso de acceso
 */
export const testearPermisoAccesoModulo = (permiso, modulo, ruta) => {
    testearPermiso(
        permiso,
        modulo,
        (token) => {
            cy.goto(ruta, token).then(() => {
                cy.url().should('eq', Cypress.env('BASE_URL') + Cypress.env('ROUTE_INICIO'))
            });
        },
        (token) => {
            cy.goto(ruta, token).then(() => {
                cy.url().should('eq', Cypress.env('BASE_URL') + ruta);
            })
        }
    );
};

/**
 *
 *
 * @param {*} permiso: permiso que quiero testestar
 * @param {*} modulo: modulo que quiero testear
 * @param {*} cbPermisoDenegado: funcion callback para probar caso de 'camino NO feliz'
 * @param {*} cbPermisoPermitido: funcion callback para probar caso de 'camino feliz'
 */
export const testearPermiso = (permiso, modulo, cbPermisoDenegado, cbPermisoPermitido) => {
    const url = `/api/core/tm/permisos/usuario/${Cypress.env('USER_OBJECT_ID')}/organizacion/${Cypress.env('ORGANIZACION_OBJECT_ID')}/modulo/${modulo}`;

    const actualizarPermisos = (_permisos) => {
        return cy.request({
            url: Cypress.env('API_SERVER') + url,
            method: 'PATCH',
            headers: {
                Authorization: 'JWT ' + ANDES_KEY
            },
            body: {
                permisos: _permisos
            }
        })
    };

    const foo = (cb) => {
        cy.login(USER_USR_LOGIN, USER_PWRD_LOGIN).then(t => { cb(t) });
    }

    actualizarPermisos([]) // limpia permisos
        .then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            foo((token) => {
                cbPermisoDenegado(token);
                actualizarPermisos([permiso]) // agrega permisos
                    .then((xhr) => {
                        expect(xhr.status).to.be.eq(200);
                        foo(cbPermisoPermitido);
                    });
            });
        });
}