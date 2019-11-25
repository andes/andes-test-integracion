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

        cy.selectOption('name="edificio"', '"589c578355bf4277035bcf30"');
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.selectOption('name="edificio"', '"589c578355bf4277035bcf2a"');
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
    })
})