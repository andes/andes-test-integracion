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
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    });

    beforeEach(() => {
        cy.visit('/monitoreo');
        cy.viewport(1280, 720);
        cy.server();
        cy.get('div[label="Boton Conceptos Turneables"]').click()
    });

    /*  
    ///////////////////////
    /// CASOS DE EXITO
    ///////////////////////
    */
    it('Alta de un concepto turneable', () => {
        cy.plexButton('Nuevo').click();
        cy.route('POST', '**/core/tm/conceptosTurneables**').as('create');

        complete({
            nombre: 'educacion',
        });

        cy.wait(1000);

        cy.get('tr[label="elemento conceptos snomed"]').eq(0).click();

        cy.get('plex-bool[name="nominalizada"]').click();
        cy.get('plex-bool[name="auditable"]').click();
        cy.plexButton('Guardar').click();
        cy.contains('CONFIRMAR').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('Aceptar').click();
    });

    it('Editar un concepto turneable', () => {
        cy.route('GET', '**/core/tm/conceptosTurneables**').as('conceptos');
        cy.route('PATCH', '**/core/tm/conceptosTurneables/**').as('edit');

        complete({
            conceptId: '1007',
            term: 'enseñanza de puericultura',
        });

        cy.wait(600);

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
        cy.route('GET', '**/core/tm/conceptosTurneables**').as('conceptos');
        cy.route('DELETE', '**/core/tm/conceptosTurneables/**').as('delete');

        complete({
            conceptId: '409073007',
            term: 'educación',
        });

        cy.wait(600);

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