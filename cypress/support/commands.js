// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (usuario, password, id) => {
    let token;
    return cy.request('POST', Cypress.env('API_SERVER') + '/api/auth/login', {
        usuario,
        password
    }).then((response) => {
        token = response.body.token;
        return response = cy.request({
            url: Cypress.env('API_SERVER') + '/api/auth/organizaciones',
            method: 'GET',
            headers: {
                Authorization: 'JWT ' + token
            },
        }).then((response) => {
            let org = response.body[0];
            if (id) {
                org.id = id;
            }
            return response = cy.request({
                url: Cypress.env('API_SERVER') + '/api/auth/organizaciones',
                method: 'POST',
                headers: {
                    Authorization: 'JWT ' + token
                },
                body: {
                    organizacion: org.id
                }
            }).then((response) => {
                return response.body.token;
            });
        });
    });
});




Cypress.Commands.add('goto', (url, token) => {
    return cy.visit(Cypress.env('BASE_URL') + url, {
        onBeforeLoad: (win) => {
            win.sessionStorage.setItem('jwt', token);
        }
    });
});


