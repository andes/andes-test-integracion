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
        cy.goto('/tm/organizacion', token);
        cy.viewport(1600, 900);
        cy.intercept('PUT', '**/api/core/tm/organizaciones/**').as('putzonaSanitaria');
        cy.intercept('GET', '**/api/core/tm/localidades**', req => {
            delete req.headers['if-none-match'] // evita que responda con datos de caché (statusCode 304)
        }).as('localidades');
        cy.intercept('GET', '**/api/core/tm/organizaciones?**').as('efector');
        cy.intercept('GET', '/api/core/term/snomed/expression**', []).as('expression');
    })

    it('Seleccionar zona sanitaria', () => {
        cy.plexText('name="nombre"', 'rendon');
        cy.get('table tbody tr').should('have.length', 1);
        cy.get('table tbody tr td').contains('10580352167033');
        cy.get('table tbody tr').eq(0).plexButton('Editar').click({ force: true });

        cy.wait('@localidades').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);

            cy.plexSelect('name="zonasSanitarias"', 0).click();

            cy.plexButton('Guardar').click();
            cy.swal('confirm', 'Los datos se actualizaron correctamente');
        });
    })
})