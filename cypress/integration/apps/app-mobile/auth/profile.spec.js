context('Perfil de usuario', () => {
    before(() => {
        cy.seed();
    })

    beforeEach(() => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            console.log(err);
            return false;
        })
        cy.server();
        cy.route('POST', '**/api/modules/mobileApp/login').as('login');
        cy.route('PUT', '**/api/modules/mobileApp/account').as('updateAccount');
        cy.route('GET', '**/api/modules/mobileApp/paciente/**').as('getProfile')
        cy.goto("/mobile/");
    });

    it('Login de usuario y visualización de perfil', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
        cy.contains('Datos personales').click({ force: true });
        cy.wait('@getProfile').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('Entiendo').click();
        cy.contains('mariano andres palavecino');
        cy.contains('Documento 35593546');
        cy.contains('Fecha de nacimiento 18/01/1991');
    });

    it.skip('Login de usuario y modificación de email', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
        cy.contains('Datos personales').click({ force: true });
        cy.wait('@getProfile').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait(500);
        cy.contains('Entiendo').click();
        cy.contains('Contactos').click();
        cy.get('[placeholder="E-mail"]').type('marianopalavecino7@gmail.com');
        cy.get('.success').click();
    });
});