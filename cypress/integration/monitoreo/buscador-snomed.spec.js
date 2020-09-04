context('Buscador de conceptos SNOMED', () => {
    let token;
    const conceptAutocitacion = [
        {
            "conceptId": "811000013106",
            "fsn": "Autocitación (procedimiento)",
            "semanticTag": "procedimiento",
            "term": "Autocitación",
            "refsetIds": []
        }
    ];

    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/buscador-snomed', token);
        cy.route('GET', '**/api/core/term/snomed?search=concepto cualquiera', []).as('busquedaInexistente');
        cy.route('GET', '**/api/core/term/snomed?search=autocitacion', conceptAutocitacion).as('busquedaAutocitacion');
    });

    it('buscar concepto por term y verificar que no existe', () => {
        // cy.plexMenu('magnify');
        cy.plexText('name="searchTerm"', 'concepto cualquiera');
        cy.wait('@busquedaInexistente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('plex-item').should('have.length', 0);
        });
    });

    it('buscar concepto por term y verificar existe', () => {
        // cy.plexMenu('magnify');
        cy.plexText('name="searchTerm"', 'autocitacion');
        cy.wait('@busquedaAutocitacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('plex-item').should('have.length', 1);
            cy.plexBadge('procedimiento', 'buscador');
            cy.plexLabel('Autocitación');
            cy.plexLabel('811000013106');
        });
    });
});
