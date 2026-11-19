context('CITAS - Espacios físicos', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });

    });

    beforeEach(() => {
        cy.goto('/tm/mapa_espacio_fisico', token);
    });

    it('Filtrar espacios físicos', () => {
        //Rutas para control
        cy.intercept('GET', '**api/modules/turnos/agenda?fechaDesde**').as('buscarEspacios');
        cy.intercept('GET', '**api/modules/turnos/espacioFisico?**').as('getEspaciosFisicos');

        cy.plexSelectType('name="edificio"', 'Huemul');

        cy.plexButton('Buscar').click();

        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
        });
        cy.wait('@getEspaciosFisicos').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
        });
    })
})