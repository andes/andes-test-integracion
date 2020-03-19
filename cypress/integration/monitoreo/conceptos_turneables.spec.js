/// <reference types="Cypress" />

const complete = (dto) => {
    if (dto.nombre) {
        cy.plexText('label="Ingrese Nombre"', dto.nombre)
    }

    if (dto.conceptId) {
        cy.plexText('label="Ingrese ConceptID"', dto.conceptId)
    }

    if (dto.term) {
        cy.plexText('label="Ingrese Term"', dto.term)
    }
}

context('Conceptos Turneables', () => {
    let token
    before(() => {
        cy.login('34934522', '34934522').then(t => {
            token = t;
            cy.log(t);
            cy.goto('/monitoreo', token);
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/conceptos-turneables', token);
        cy.route('GET', '**api/core/term/snomed?search=**').as('busq');
        cy.route('GET', '**/core/tm/conceptoTurneable**').as('conceptos');
        //cy.get('div[label="Boton Conceptos Turneables"]').click();

    });

    /*  
    ///////////////////////
    /// CASOS DE EXITO
    ///////////////////////
    */
    it('Alta de un concepto turneable', () => {
        cy.plexButton('Nuevo').click();
        cy.route('POST', '**api/core/tm/conceptoTurneable**').as('create');
        complete({
            nombre: 'educacion',
        });

        cy.wait('@busq').then((xhr) => {
            cy.log('@busq');
            expect(xhr.status).to.be.eq(200)
        });

        cy.get('tr[label="elemento conceptos snomed"]').eq(0).click();

        cy.get('plex-bool[name="nominalizada"]').click();
        cy.get('plex-bool[name="auditable"]').click();
        cy.plexButton('Guardar').click();
        cy.contains('CONFIRMAR').click();

        cy.wait('@create').then((xhr) => {
            cy.log('@create');
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('Aceptar').click();
    });

    it('Editar un concepto turneable', () => {
        cy.route('GET', '**/core/tm/conceptoTurneable**').as('conceptos');
        cy.route('PATCH', '**/core/tm/conceptoTurneable/**').as('edit');

        complete({
            conceptId: '700152009',
            term: 'cribado para papilomavirus humano (procedimiento)',
        });

        cy.wait('@conceptos').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.get('tr[label="elemento conceptos turneables"]').eq(0).click();

        cy.plexButton('Editar').click();

        cy.get('plex-bool[name="nominalizada"]').click();
        cy.get('plex-bool[name="auditable"]').click();
        cy.plexButton('Guardar').click();

        cy.contains('¿Desea guardar cambios?');
        cy.contains('CONFIRMAR').click();

        cy.wait('@edit').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('El concepto turneable fue editado');
        cy.contains('Aceptar').click();
    });

    it('Eliminar un concepto turneable', () => {

        cy.route('DELETE', '**/core/tm/conceptoTurneable/**').as('delete');

        complete({
            conceptId: '409073007',
            term: 'educación',
        });

        cy.wait('@conceptos').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.get('tr[label="elemento conceptos turneables"]').eq(0).click();

        cy.plexButton('Eliminar').click();

        cy.contains('¿Desea eliminar?');
        cy.contains('CONFIRMAR').click();

        cy.wait('@delete').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('El Concepto Turneable fue eliminado');
        cy.contains('Aceptar').click();
    });
});