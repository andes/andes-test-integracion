/// <reference types="Cypress" />

context('select organizacion', () => {
    let token;
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });


    })

    it('cambiar organizacion', () => {
        cy.server();
        cy.route('POST', '/api/auth/v2/organizaciones').as('selectOrg');

        cy.goto('/', token);
        cy.plexMenu('home');
        cy.get('ul.list-group li').should('have.length', 3);

        cy.get('ul.list-group li').eq(1).click();

        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        })

        cy.get('.userinfo > div > :nth-child(3)').contains('HOSPITAL DE AREA PLOTTIER');
    })


})