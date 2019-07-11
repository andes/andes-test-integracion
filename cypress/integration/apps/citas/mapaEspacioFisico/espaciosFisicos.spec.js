context('CITAS - Espacios físicos', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    });

    beforeEach(() => {
        cy.goto('/tm/mapa_espacio_fisico', token);
    });

    it('Filtrar espacios físicos', () => {
        cy.server()
        //Rutas para control
        cy.route('GET', '**api/modules/turnos/agenda?fechaDesde**').as('buscarEspacios');

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf30"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-select[name="edificio"]').children().children('.selectize-control').click()
            .find('.option[data-value="589c578355bf4277035bcf2a"]').click();
        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@buscarEspacios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
    })
})