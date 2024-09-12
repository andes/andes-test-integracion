Cypress.Commands.add('buscarPermisos', (name) => {
    cy.get('plex-layout-sidebar gestor-usarios-perfiles-detail').contains(name);
});
