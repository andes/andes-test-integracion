/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)
        // Navego al punto de inicio para dar un turno al paciente
        cy.visit(Cypress.env('BASE_URL') + '/citas/puntoInicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })


    it('Paciente con Instituto de seguridad social del neuquén', () => {
        cy.server();
        cy.route('**/api/core/mpi/pacientes**').as('mpi')
        // cy.route('**/api/modules/obraSocial/paciente').as('financiador')

        cy.get('plex-text input[type=text]').first().type('27381849').should('have.value', '27381849')
        cy.wait('@mpi').then(function (xhr) {
            expect(xhr.status).to.eq(200);
            cy.route('**/api/modules/obraSocial/paciente/**').as('financiador');
            cy.get('tr').first().click();
            cy.wait('@financiador').then(function (xhr) {
                expect(xhr.status).to.eq(200);
                expect(xhr.response).property('body').to.have.length(1)
                cy.get('div.col-6').contains('O.S.P. NEUQUEN')
            })
        });
    });

    it('Paciente con SUMAR', () => {
        cy.server();
        cy.route('**/api/core/mpi/pacientes**').as('mpi')
        // paciente que no tiene obra social, pero esta en afiliados sumar
        cy.get('plex-text input[type=text]').first().type('30476715').should('have.value', '30476715')
        cy.wait('@mpi').then(function (xhr) {
            expect(xhr.status).to.eq(200);
            cy.route('**/api/modules/obraSocial/paciente/**').as('financiador')
            cy.get('tr').first().click();
            cy.wait('@financiador').then(function (xhr) {
                expect(xhr.status).to.eq(200);
                expect(xhr.response).property('body').to.have.length(1)
                cy.get('div.col-6').contains('SUMAR')
            })
        });
    })

    it('Paciente sin OS', () => {
        cy.server();
        cy.route('**/api/core/mpi/pacientes**').as('mpi')
        // paciente que no tiene obra social
        cy.get('plex-text input[type=text]').first().type('32951434').should('have.value', '32951434')
        cy.wait('@mpi').then(function (xhr) {
            expect(xhr.status).to.eq(200);
            cy.route('**/api/modules/obraSocial/paciente/**').as('financiador')
            cy.get('tr').first().click();
            cy.wait('@financiador').then(function (xhr) {
                expect(xhr.status).to.eq(200);
                expect(xhr.response).property('body').to.have.length(0)

            })
        });
    })

});