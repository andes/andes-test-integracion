/// <reference types="Cypress" />

context('select organizacion', () => {
    let token;
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '/api/auth/v2/organizaciones').as('selectOrg');
        cy.route('GET', '**/api/auth/organizaciones').as('getOrganizaciones');
        cy.route('GET', '**/api/core/tm/disclaimer?**').as('disclaimer');
        cy.goto('/', token);
    })

    it('cambiar organizacion', () => {

        cy.plexMenu('home');
        cy.get('ul.list-group li').should('have.length', 3);

        cy.get('ul.list-group li').eq(1).click();

        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });

        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(3);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.userinfo > div span:nth-child(3)').contains('HOSPITAL DE AREA PLOTTIER');
    })
})