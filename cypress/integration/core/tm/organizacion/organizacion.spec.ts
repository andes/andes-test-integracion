/// <reference types="Cypress" />

context('Organizacion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', '12345').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/tm/organizacion', token);
        cy.route('PUT', '**/api/core/tm/organizaciones/**').as('putzonaSanitaria');
    })

    it('Seleccionar zona sanitaria', () => {
        cy.get('table tbody tr').eq(0).plexButton('Editar').click();
        cy.plexSelect('name="zonasSanitarias"', 0).click();
        cy.plexButton('Guardar').click();
        cy.swal('confirm', 'Los datos se actualizaron correctamente');
        cy.wait('@putzonaSanitaria').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    })
})