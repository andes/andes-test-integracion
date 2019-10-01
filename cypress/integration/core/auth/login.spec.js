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

        cy.plexInt('name="usuario"').type('hola').should('have.value', '');
        cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
        cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');

        cy.plexButton('Iniciar sesión').click();

        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.wait('@organizaciones');

        cy.get('ul.list-group li').should('have.length', 3);
    })

    it('login failed', () => {
        cy.server();
        cy.route('POST', '**/api/auth/login').as('login');

        cy.plexInt('name="usuario"').type('10000001');
        cy.plexText('name="password"', 'anypasswordfornow');
        cy.plexButton('Iniciar sesión').click();

        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(403)
        });
    });
})