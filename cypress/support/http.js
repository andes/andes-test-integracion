Cypress.Commands.add('fetch', (path, token, query = null) => {
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

Cypress.Commands.add('post', (path, value, token) => {
    return cy.request({
        method: 'POST',
        url: Cypress.env('API_SERVER') + path,
        body: value,
        failOnStatusCode: false,
        headers: {
            Authorization: `JWT ${token}`
        }
    });
});