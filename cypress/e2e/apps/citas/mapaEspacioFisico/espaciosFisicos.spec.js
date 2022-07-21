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
        cy.server()
        //Rutas para control
        cy.route('GET', '**api/modules/turnos/agenda?fechaDesde**').as('buscarEspacios');
        cy.route('GET', '**api/modules/turnos/espacioFisico?**').as('getEspaciosFisicos');

        cy.plexSelectType('name="edificio"', 'Huemul');

        cy.plexButton('Buscar').click();

        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getEspaciosFisicos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    })
})