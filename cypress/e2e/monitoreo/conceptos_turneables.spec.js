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
const snomedBuscador = [
    {
        "conceptId": "0000000000001",
        "fsn": "nuevo ct (procedimiento)",
        "semanticTag": "procedimiento",
        "term": "nuevo ct",
        "refsetIds": []
    }
]

context('Conceptos Turneables', () => {
    let token

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;

        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/conceptos-turneables', token);
        cy.route('GET', '**api/core/term/snomed?search=**', snomedBuscador).as('busq');
        cy.route('GET', '**api/core/tm/conceptos-turneables**').as('conceptos');

    });

    /*  
    ///////////////////////
    /// CASOS DE EXITO
    ///////////////////////
    */
    it('Alta de un concepto turneable', () => {
        cy.plexButton('Nuevo').click();
        cy.route('POST', '**api/core/tm/conceptos-turneables**').as('create');
        complete({
            nombre: 'educacion',
        });

        cy.wait('@busq').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.get('tr[label="elemento conceptos snomed"]').eq(0).click();

        cy.get('plex-bool[name="nominalizada"]').click();
        cy.get('plex-bool[name="auditable"]').click();
        cy.plexButton('Guardar').click();
        cy.contains('CONFIRMAR').click();

        cy.wait('@create').then((xhr) => {
            cy.log('@create');
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.any.keys('conceptId');
            expect(xhr.response.body).to.have.any.keys('term');
            expect(xhr.response.body).to.have.any.keys('semanticTag');

        });
        cy.contains('Aceptar').click();
    });

    it('Editar un concepto turneable', () => {
        cy.route('PATCH', '**api/core/tm/conceptos-turneables/**').as('edit');

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

    it.skip('Eliminar un concepto turneable', () => {
        cy.route('DELETE', '**api/core/tm/conceptos-turneables/**').as('delete');

        complete({
            conceptId: '385805005',
            term: 'educacion',
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