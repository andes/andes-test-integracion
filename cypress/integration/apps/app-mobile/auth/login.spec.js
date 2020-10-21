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
        cy.route('POST', '**/api/modules/mobileApp/login').as('login');
        cy.route('POST', '**/api/auth/login').as('loginProfesional');
        cy.goto("/mobile/");
    });

    it('Login de usuario de tipo paciente existente', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
    });

    it('Login de usuario inexistente', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('pepe@gmail.com');
        cy.get('#password').first().type('pepe');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(422);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(false);
        });
    });

    it('Login de usuario de tipo profesional', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('4402222');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@loginProfesional').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola JAZMIN');
    });
});