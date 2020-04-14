Cypress.Commands.add('buscarPermisos', (valor1, valor2) => {
    cy.get('plex-layout-sidebar arbol-permisos>div').eq(valor1).plexAccordion().eq(valor2);
});