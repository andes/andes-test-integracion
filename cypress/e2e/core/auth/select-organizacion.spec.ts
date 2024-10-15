/// <reference types="Cypress" />

context('select organizacion', () => {
    let token;
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.intercept('POST', '/api/auth/v2/organizaciones').as('selectOrg');
        cy.intercept('GET', '**/api/auth/organizaciones**', req => {
            delete req.headers['if-none-match'] // evita que responda con datos de caché (statusCode 304)
        }).as('getOrganizaciones');
        cy.intercept('GET', '**/api/core/tm/disclaimer?**').as('disclaimer');
        cy.goto('/', token);
    })

    it('cambiar organizacion', () => {

        cy.plexMenu('home');
        cy.get('ul.list-group li').should('have.length', 3);

        cy.get('ul.list-group li').eq(1).click();

        cy.wait('@selectOrg').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(typeof response.body.token === 'string').to.be.eq(true);
        });

        cy.wait('@getOrganizaciones').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body).to.have.length(3);
        });
        cy.get('.userinfo > div span:nth-child(3)').contains('HOSPITAL DE AREA PLOTTIER');
    })
})