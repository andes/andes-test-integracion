

export function today(format = null) {
    return Cypress.moment().format(format || 'DD/MM/YYYY');
};

cy.today = today;

export function esFinDeMes() {
    return cy.today() === Cypress.moment().endOf('month').format('DD/MM/YYYY');
}

cy.esFinDeMes = esFinDeMes;
