context('Pagina de login', () => {
    before(() => {
        cy.seed();
    }
    )

    beforeEach(() => {
        cy.goto('/');
        cy.intercept('POST', '**/api/auth/login' ,req => {
            delete req.headers['if-none-match']
        }).as('login');
        cy.intercept('GET', '**/api/auth/organizaciones').as('organizaciones');
        cy.intercept('POST', '**/api/core/tm/disclaimer').as('disclaimer');
        cy.intercept('GET', '**/api/core/tm/disclaimer').as('disclaimers');
        cy.intercept('POST', '/api/auth/v2/organizaciones').as('selectOrg');
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.sessionStorage.clear();
            }
        });
    });



    it('Login de usuario con disclaimer', () => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/tm/disclaimer',
            body:
            {
                "version": "1.1.0",
                "texto": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
                "activo": true
            }
        }).then((response) => {
            let disclaimer = response.body;
            cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
            cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');
            cy.plexButton('Iniciar sesión').click();
            cy.wait('@login').then(({response}) => {
                expect(response.statusCode).to.eq(200)
            });
            cy.wait('@organizaciones');
            cy.get('ul.list-group li').eq(1).click();
            cy.wait('@selectOrg').then(({response}) => {
                expect(response.statusCode).to.eq(200);
                expect(typeof response.body.token === 'string').to.be.eq(true);
            });
            cy.contains("Versión 1.1.0");
            cy.get('.btn-success').contains('ACEPTO').click();
            cy.plexMenu('logout');
            cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
            cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');
            cy.plexButton('Iniciar sesión').click();
            cy.wait('@login').then(({response}) => {
                expect(response.statusCode).to.eq(200)
            });
            cy.request({
                method: 'PATCH',
                url: Cypress.env('API_SERVER') + '/api/core/tm/disclaimer/' + disclaimer.id,
                body: {
                    "activo": false
                }
            });
        });

    });

    it('Login de usuario rechazando disclaimer', () => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/tm/disclaimer',
            body:
            {
                "version": "1.2.0",
                "texto": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
                "activo": true
            }
        }).then((response) => {
            let disclaimer = response.body;
            cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
            cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');
            cy.plexButton('Iniciar sesión').click();
            cy.wait('@login').then(({response}) => {
                expect(response.statusCode).to.be.eq(200)
            });
            cy.wait('@organizaciones');
            cy.get('ul.list-group li').eq(1).click();

            cy.wait('@selectOrg').then(({response}) => {
                expect(response.statusCode).to.be.eq(200);
                expect(typeof response.body.token === 'string').to.be.eq(true);
            });
            cy.contains("Versión 1.2.0");
            cy.plexButton('NO ACEPTO').click();
            cy.wait(1000);
            cy.contains("Ingrese su usuario provincial OneLogin");
            cy.request({
                method: 'PATCH',
                url: Cypress.env('API_SERVER') + '/api/core/tm/disclaimer/' + disclaimer.id,
                body: {
                    "activo": false
                }
            });
        });
    })

    it('Login de usuario con nuevo disclaimer', () => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/tm/disclaimer',
            body: {
                "version": "1.3.0",
                "texto": "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
                "activo": true
            }
        });
        cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
        cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@login').then(({response}) => {
            expect(response.statusCode).to.eq(200)
        });
        cy.wait('@organizaciones');
        cy.get('ul.list-group li').eq(1).click();

        cy.wait('@selectOrg').then(({response}) => {
            expect(response.statusCode).to.eq(200);
            expect(typeof response.body.token === 'string').to.be.eq(true);
        });
        cy.contains("Versión 1.3.0");
        cy.get('.btn-success').contains('ACEPTO').click();
        cy.plexMenu('logout');
        cy.wait(1000);
        cy.plexInt('name="usuario"').type('38906735').should('have.value', '38906735');
        cy.plexText('name="password"', 'anypasswordfornow').should('have.value', 'anypasswordfornow');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@login').then(({response}) => {
            expect(response.statusCode).to.be.eq(200)
        });
        cy.wait('@organizaciones');
    })

    it('Login con credenciales incorrectas', () => {
        cy.wait(1000);
        cy.plexInt('name="usuario"').type('10000001');
        cy.plexText('name="password"', 'anypasswordfornow');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@login').then(({response}) => {
            expect(response.statusCode).to.be.eq(403)
        });
    });

    it('Login usuario sin permisos para ninguna organizacion', () => {
        cy.plexInt('name="usuario"').type('33650509');
        cy.plexText('name="password"', 'asd');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@organizaciones').then(({response}) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(0);
        });
        cy.get('plex-label').contains('Usted no tiene permisos para acceder a ninguna organización.');

    })
});