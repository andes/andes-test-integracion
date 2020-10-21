context('Configuración de cuenta', () => {
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
        cy.goto("/mobile/");
    });

    it('Login de usuario y actualización de telefono/email', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
        cy.contains('Configurar cuenta').click({ force: true });
        cy.get('input').first().clear();
        cy.get('input').first().type('2995421584');
        cy.get('input').last().clear();
        cy.get('input').last().type('marianopalavecino72@gmail.com');
        cy.get('.success').click();
        cy.wait('@updateAccount').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.account.email).to.be.eq('marianopalavecino72@gmail.com');
            expect(xhr.response.body.account.telefono).to.be.eq('2995421584');
        });
        cy.contains('Cerrar sesión').click({ force: true });
        cy.get('.nologin').last().click();
        cy.get('input').first().type('marianopalavecino72@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').first().click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Configurar cuenta').click({ force: true });
        cy.get('input').last().clear();
        cy.get('input').last().type('marianopalavecino7@gmail.com');
        cy.get('.success').click();
        cy.wait('@updateAccount').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.account.email).to.be.eq('marianopalavecino7@gmail.com');
        });
    });

    it('Login de usuario y actualización de contraseña', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
        cy.contains('Configurar cuenta').click({ force: true });
        cy.get('.danger').last().click();
        cy.get('[placeholder="Contraseña actual"]').type('martin');
        cy.get('[placeholder="Nueva contraseña"]').type('martin123');
        cy.get('[placeholder="Repita contraseña"]').type('martin123');
        cy.get('.success').click();
        cy.wait('@updateAccount').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('Cerrar sesión').click({ force: true });
        cy.get('.nologin').last().click();
        cy.get('input').first().type('marianopalavecino7@gmail.com', { force: true });
        cy.get('#password').first().type('martin');
        cy.get('.success').first().click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(422);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(false);
        });
        cy.get('#password').first().clear();
        cy.wait(500);
        cy.get('#password').first().type('martin123');
        cy.get('.success').first().click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
    });

});