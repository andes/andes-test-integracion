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
        cy.route('GET', '**/api/modules/mobileApp/vacunas/count**').as('countVacunas');
        cy.route('GET', '**/api/modules/mobileApp/vacunas**').as('getVacunas');
        cy.goto("/mobile/");
    });

    it('Login de usuario y consulta de vacunas', () => {
        cy.get('.nologin').click();
        cy.get('input').first().type('marianopalavecino7@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola MARIANO ANDRES');
        cy.get('[name="andes-vacuna"]').click();
        cy.wait('@countVacunas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.be.eq(2);
        });
        cy.wait('@getVacunas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(2);
        });
        cy.contains('Entiendo').click();
        cy.get('.andes-list').find('li').should('have.length', 2);
    });
});