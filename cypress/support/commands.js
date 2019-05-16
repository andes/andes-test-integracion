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

Cypress.Commands.add("login", (usuario, password) => {
    let token;
    return cy.request('POST', Cypress.env('API_SERVER')+'/api/auth/login', { usuario, password }).then((response) => {
        token = response.body.token;
        return response = cy.request({
            url: Cypress.env('API_SERVER')+'/api/auth/organizaciones',
            method: 'GET',
            headers: {
                Authorization: 'JWT ' + token
            },
        }).then((response) => {
            let org = response.body[0];
            return response = cy.request({
                url: Cypress.env('API_SERVER')+'/api/auth/organizaciones',
                method: 'POST',
                headers: {
                    Authorization: 'JWT ' + token
                },
                body: { organizacion: org.id }
            }).then((response) => {
                return response.body.token;
            });
        });
    });
});

Cypress.Commands.add('createPaciente', (name, token) => {
    return cy.fixture(name).then((paciente) => {
        cy.request({ 
            method: 'POST', 
            url: Cypress.env('API_SERVER') + '/api/core/mpi/pacientes', 
            body: paciente,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('swal', (acction) => {
    return cy.get('div').then(($body) => {
        if ($body.hasClass('swal2-container')) {
             cy.get(`.swal2-${acction}`).click({ force: true })
        }
    });
})

Cypress.Commands.add('goto', (url, token) => {
    return cy.visit( Cypress.env('BASE_URL') + url, {
        onBeforeLoad: (win) => {
            win.sessionStorage.setItem('jwt', token);
        }
    }); 
});


Cypress.Commands.add('post', (path, value, token) => {
    return  cy.request({ 
        method: 'POST', 
        url: Cypress.env('API_SERVER') + path, 
        body: value,
        failOnStatusCode: false,
        headers: {
            Authorization: `JWT ${token}`
        }
    });
});

Cypress.Commands.add('get', (path, token, query = null) => {
    return cy.request({ 
        method: 'GET', 
        qs: query,
        url: Cypress.env('API_SERVER') + path, 
        headers: {
            Authorization: `JWT ${token}`
        },
        failOnStatusCode: false
    });

});

Cypress.Commands.add('patch', (path, body, token) => {
    return cy.request({ 
        method: 'PATCH', 
        url: Cypress.env('API_SERVER') + path, 
        body: body,
        failOnStatusCode: false,
        headers: {
            Authorization: `JWT ${token}`
        }
    });

});

Cypress.Commands.add('put', (path, body, token) => {
    return cy.request({ 
        method: 'PUT', 
        url: Cypress.env('API_SERVER') + path, 
        body: body,
        failOnStatusCode: false,
        headers: {
            Authorization: `JWT ${token}`
        }
    });
});

Cypress.Commands.add('delete', (path, token) => {
    return cy.request({ 
        method: 'DELETE', 
        url: Cypress.env('API_SERVER') + path, 
        failOnStatusCode: false,
        headers: {
            Authorization: `JWT ${token}`
        }
    });
});


