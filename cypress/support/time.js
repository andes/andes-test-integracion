

export function today(format = null) {
    return Cypress.moment().format(format || 'DD/MM/YYYY');
};

cy.today = today;