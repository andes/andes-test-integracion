context('Pagina de login', () => {
    let token;
    before(() => {
        cy.seed();
        cy.loginMobile('38906735', 'asd').then(t => {
            token = t;
            cy.createPrestacion('prestaciones-adjunto/prestacion', token);
            cy.createPrestacionAdjunto('prestaciones-adjunto/prestacion-adjunto', token);
        });
    })

    beforeEach(() => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            console.log(err);
            return false;
        })
        cy.server();
        cy.route('POST', '**/api/modules/mobileApp/login').as('login');
        cy.route('POST', '**/api/auth/login').as('loginProfesional');
        cy.route('GET', '**/api/modules/mobileApp/prestaciones-adjuntar').as('prestaciones-adjuntar');
        cy.route('PATCH', '**/api/modules/mobileApp/prestaciones-adjuntar/**').as('patch-adjuntar');
    });

    it('Log in', () => {
        cy.goto("/mobile/");
        cy.get('.nologin').click();
        cy.get('input').first().type('38906735');
        cy.get('#password').first().type('asd');
        cy.get('.success').click();
        cy.wait('@loginProfesional').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON').click();
        cy.contains('Hola PRUEBA');
    })

    it('Adjunto RUP', () => {        
        cy.get('[name="andes-vacuna"]').eq(1).click();
        cy.wait('@prestaciones-adjuntar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('[name="search"]').click();
        const fileName = '/archivos/cat.png';
        cy.get('[type="file"]').attachFile(fileName);
        cy.get('[name="checkmark"]').click();
        cy.wait('@patch-adjuntar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.status).to.be.eq("ok");
        });
    });
});