/// <reference types="Cypress" />

context('Pagina de login', () => {
    beforeEach(() => {
        cy.visit(Cypress.env('BASE_URL'), {
            onBeforeLoad: (win) => {
                win.sessionStorage.clear()
            }
        });
    })

    it('login complete', () => {

        cy.server();

        cy.route('POST', '**/api/auth/login').as('login');
        cy.route('GET', '**/api/auth/organizaciones').as('organizaciones');

        
        cy.get('[name="usuario"] input').type('hola').should('have.value', '');

        cy.get('[name="usuario"] input').type('38906735').should('have.value', '38906735');

        cy.get('[name="password"] input[type="password"]').type('anypasswordfornow').should('have.value', 'anypasswordfornow');

        cy.get('plex-button').click();


        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.wait('@organizaciones');
        
        cy.get('ul.list-group li').should('have.length', 3);
    })

    it('login failed', () => {

        cy.server();

        cy.route('POST', '**/api/auth/login').as('login');

        cy.get('[name="usuario"] input').type('10000001').should('have.value', '10000001');

        cy.get('[name="password"] input[type="password"]').type('anypasswordfornow').should('have.value', 'anypasswordfornow');

        cy.get('plex-button').click();

        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(403)
        });



    });
})