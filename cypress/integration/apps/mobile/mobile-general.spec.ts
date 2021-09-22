context('mobile general', () => {
    before(() => {
    })

    beforeEach(() => {
        cy.server();
        cy.viewport(550, 750);
    });

    it('Versión de app móvil visible', () => {
        cy.goto('/mobile/home')

        cy.get('ion-menu-button').first().click();

        cy.contains('Andes Neuquén. v').should('be.visible');
    });
});