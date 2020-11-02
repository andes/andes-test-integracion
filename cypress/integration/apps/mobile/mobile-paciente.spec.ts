context('Pagina de login', () => {
    let token;
    before(() => {
        cy.seed();
        cy.task('database:seed:nomivac',
        {
            "_id": "59d095442ad22a064cf9b7e5",
            "idvacuna": 3,
            "documento": "35593546",
            "nombre": "MARIANO ANDRES",
            "apellido": "PALAVECINO",
            "fechaNacimiento": "1991-01-18T20:00:00.000-03:00",
            "sexo": "masculino",
            "vacuna": "Neumococo Conjugada VCN 13",
            "dosis": "1er Dosis",
            "fechaAplicacion": "2014-07-26T21:00:00.000-03:00",
            "efector": "CENTRO DE SALUD SAN LORENZO SUR"
        });
        cy.loginMobile('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente("paciente-mobile", token);
            cy.createCampania('campanias/campania', token);
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
        cy.route('GET', '**/api/core/tm/campanias').as('campanias');
        cy.route('PUT', '**/api/modules/mobileApp/account').as('updateAccount');
        cy.route('GET', '**/api/modules/mobileApp/paciente/**').as('getProfile');
        cy.route('GET', '**/api/modules/mobileApp/vacunas/count**').as('countVacunas');
        cy.route('GET', '**/api/modules/mobileApp/vacunas**').as('getVacunas');
    });

    it('Login de paciente inexistente', () => {
        cy.goto("/mobile/");
        cy.get('.nologin').click();
        cy.get('input').first().type('pepe@gmail.com');
        cy.get('#password').first().type('pepe');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(422);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(false);
        });
    });2147483648

    it('Login de paciente existente', () => {
        cy.goto("/mobile/");
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

    it('Visualización de perfil', () => {
        cy.contains('Hola MARIANO ANDRES');
        cy.contains('Datos personales').click({ force: true });
        cy.contains('Entiendo').click();
        cy.contains('mariano andres palavecino');
        cy.contains('Documento 35593546');
        cy.contains('Fecha de nacimiento 18/01/1991');
    });

    it('Modificación de email', () => {
        cy.contains('Contactos').click();
        cy.get('[placeholder="E-mail"]').type('marianopalavecino7@gmail.com');
        cy.get('.success').click();
        cy.get('.back-button').last().click();

    });

    it('Verificar campañas', () => {
        cy.get('.ion-md-andes-agendas').click();
        cy.wait('@campanias').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.andes-list').find('li').should('have.length', 1);
        cy.get('.andes-list').find('li').click();
        cy.contains("Desde: 1 de octubre del 2018");
        cy.contains("Hasta: 31 de octubre del 2030");
        cy.get('.info').contains("mas info");
        cy.get('.back-button').last().click();
        cy.get('.back-button').eq(1).click();
    });

    it('Consulta de vacunas', () => {
        cy.get('[name="andes-vacuna"]').click();
        cy.wait('@countVacunas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.be.eq(1);
        });
        cy.wait('@getVacunas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });
        
        cy.get('.andes-list').find('li').should('have.length', 1);
        cy.get('.back-button').last().click();
    });
}); 