
Cypress.Commands.add('modalPrivacidad', (options) => {
    if (typeof options === 'boolean') {
        return cy.get('modal-motivo-acceso-huds').contains('CANCELAR').click();
    } else if (typeof options === 'string') {
        cy.get('modal-motivo-acceso-huds').contains(options).click();
        cy.get('modal-motivo-acceso-huds').contains('ACEPTAR').click();
        return;
    }
    return cy.get('modal-motivo-acceso-huds');
});