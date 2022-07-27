/// <reference types="Cypress" />

context('Pagina de login', () => {
    beforeEach(() => {
        cy.visit('/monitoreo', {
            onBeforeLoad: (win) => {
                win.sessionStorage.clear()
            }
        });
    })

    it('login complete', () => {
        cy.server();
        cy.route('POST', '**/api/auth/login').as('login');
        cy.route('GET', '**/api/auth/organizaciones').as('organizaciones');
        cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
        cy.plexText('name="password"', 'asd').should('have.value', 'asd');

        cy.plexButton('Iniciar sesión').click();

        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.any.keys('token');
        });
        cy.wait('@organizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    })

    it('login failed', () => {
        cy.server();
        cy.route('POST', '**/api/auth/login').as('login');

        cy.plexInt('name="usuario"').type('100001100010998771111');
        cy.plexText('name="password"', 'anypasswordfornow');
        cy.plexButton('Iniciar sesión').click();

        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(403);
        });
    });
});
