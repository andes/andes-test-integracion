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
        cy.route('GET', '**/api/core/tm/localidades**').as('localidades');
        cy.route('GET', '**/api/core/tm/organizaciones?**').as('efector');
    })

    it('Seleccionar zona sanitaria', () => {
        cy.plexText('name="nombre"', 'rendon');
        cy.get('table tbody tr').should('have.length', 1);
        cy.get('table tbody tr td').contains('10580352167033');
        cy.get('table tbody tr').eq(0).plexButton('Editar').click({ force: true });

        cy.wait('@localidades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);

            cy.plexSelect('name="zonasSanitarias"', 0).click();

            cy.plexButton('Guardar').click();
            cy.swal('confirm', 'Los datos se actualizaron correctamente');
        });
    })
})