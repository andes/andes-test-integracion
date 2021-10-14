const moment = require('moment');


export function today(format = null) {
    return moment().format(format || 'DD/MM/YYYY');
};

cy.today = today;

export function esFinDeMes() {
    return cy.today() === moment().endOf('month').format('DD/MM/YYYY');
}

cy.esFinDeMes = esFinDeMes;
