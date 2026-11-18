context('gestor-pantallas', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.goto('/pantallas', token);
        cy.intercept('GET', '**/api/modules/turnero/pantalla').as('pantallas');
        cy.intercept('DELETE', '**/api/modules/turnero/pantalla/**').as('deletePantalla');
        cy.intercept('GET', '**/api/modules/turnos/espacioFisico**').as('espacios');
        cy.intercept('POST', '**/api/modules/turnero/pantalla').as('postPantalla');
        cy.intercept('PATCH', '**/api/modules/turnero/pantalla/**').as('patchPantalla');
    });

    // El espacio del hospital no aparece en el desplegable.
    it.skip('Crear nueva pantalla para turnero y editarla', () => {
        cy.plexButton(' Nueva pantalla ').click();
        cy.plexText('label="Nombre"', 'Pantalla turnero');
        cy.plexSelectType('name="tipoPantalla"', 'Turnero').contains('Turnero').click({ force: true });
        cy.plexText('label="Contenido digital"', "http://youtube.com", { force: true });
        cy.plexSelectAsync('label="Espacios físicos"', 'consultorio 1', '@espacios', 0);
        cy.plexButton('Guardar').click();
        cy.contains('Pantalla guardada correctamente');
        let tokenPantalla;
        cy.wait('@postPantalla').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq('Pantalla turnero');
            expect(xhr.response.body.playlist).to.be.eq('http://youtube.com');
            expect(xhr.response.body.tipo).to.be.eq('turnero');
            tokenPantalla = xhr.response.body.token;
            cy.get('table tr td').contains(tokenPantalla);
        });
        cy.plexButtonIcon('pencil').last().click();
        cy.plexSelect('label="Espacios físicos"').find('.remove-button').click({ force: true });
        cy.plexSelectAsync('label="Espacios físicos"', 'Consultorio 8', '@espacios', 0);
        cy.plexButton('Guardar').click();
        cy.wait('@patchPantalla').then((xhr) => {
            cy.contains('Pantalla guardada correctamente');
            expect(xhr.response.statusCode).to.be.eq(200);
            cy.get('table tr td').contains('Consultorio 8');
        });
    });

    it('Crear nueva pantalla para totem, editarla y eliminarla', () => {
        cy.plexButton(' Nueva pantalla ').click();
        cy.plexText('label="Nombre"', 'Pantalla totem');
        cy.plexSelectType('name="tipoPantalla"', 'Totem').contains('Totem').click({ force: true });
        cy.plexButton('Guardar').click();
        cy.contains('Pantalla guardada correctamente');
        let tokenPantalla;
        cy.wait('@postPantalla').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq('Pantalla totem');
            expect(xhr.response.body.tipo).to.be.eq('totem');
            tokenPantalla = xhr.response.body.token;
            cy.get('table tr td').contains(tokenPantalla);
        });
        cy.plexButtonIcon('pencil').last().click();
        cy.plexText('label="Nombre"', ' nueva');
        cy.plexButton('Guardar').click();
        cy.wait('@patchPantalla').then((xhr) => {
            cy.contains('Pantalla guardada correctamente');
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq('Pantalla totem nueva');
            cy.get('table tr td').contains('Pantalla totem nueva');
        });
        cy.plexButtonIcon('delete').last().click();
        cy.contains('Eliminar pantalla "Pantalla totem nueva"');
        cy.swal('cancel');
        cy.plexButtonIcon('delete').last().click();
        cy.contains('Eliminar pantalla "Pantalla totem nueva"');
        cy.swal('confirm');
        cy.wait('@deletePantalla').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
        });
    });
});