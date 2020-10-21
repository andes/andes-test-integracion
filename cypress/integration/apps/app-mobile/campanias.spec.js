context('Pagina de login', () => {
    before(() => {
        cy.seed();
    })

    beforeEach(() => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            console.log(err);
            return false;
        })
        cy.server();
        cy.route('GET', '**/api/core/tm/campanias').as('campanias');
        cy.goto("/mobile/");
    });

    it('Verificar campañas', () => {
        cy.get('.ion-md-andes-agendas').click();
        cy.wait('@campanias').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.andes-list').find('li').should('have.length', 1);
        cy.get('.andes-list').find('li').click();
        cy.contains("Desde: 1 de octubre del 2018");
        cy.contains("Hasta: 31 de octubre del 2030");
        cy.get('.info').contains("mas info");
    });
});