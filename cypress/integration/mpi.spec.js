

/// <reference types="Cypress" />

context('MPI', () => {
    let token
    before(() => {
        cy.login('34934522', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/apps/mpi', token);
    })

    it('registro de paciente', () => {
        cy.get('plex-text input[type="text"]').first().type('botta').should('have.value', 'botta');

        cy.get('div.alert.alert-danger').should('exist');

        cy.get('plex-button[label="Registrar paciente temporal"]').click();

        cy.get('plex-int[name="documento"] input').type('hola').should('have.value', '');

        cy.get('plex-int[name="documento"] input').type('11111111').should('have.value', '11111111');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        cy.server();
        cy.fixture('renaper-1').as('fxRenaper')
        cy.route('**/api/modules//fuentesAutenticas/renaper**', '@fxRenaper').as('renaper')

        cy.get('plex-button[label="Validar con servicios de Renaper"]').click();

        cy.wait('@renaper').then(function(xhr) {
            expect(xhr.status).to.eq(200);
        });

        cy.get('plex-text[name="nombre"] input').should('have.value', 'PRUEBA');
        cy.get('plex-text[name="apellido"] input').should('have.value', 'PRUEBA');
 
    });
    
});