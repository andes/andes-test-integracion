/// <reference types="Cypress" />

const complete = (dto) => {
    if (dto.nombre) {
        cy.plexText('label="Nombre"', dto.nombre);
    }

    if (dto.event) {
        cy.plexText('label="Event"', dto.event);
    }

    if (dto.url) {
        cy.plexText('label="Url"', dto.url);
    }
    if (dto.method) {
        cy.plexSelectType('label="Seleccione metodo"', dto.method);
    }
    if (dto.transform) {
        cy.plexSelectType('label="Seleccione transform"', dto.transform)
    }
}

context('Webhook', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/webhook', token);
        cy.route('GET', '**api/modules/webhook/webhook**').as('busq');
    });

    it('Alta de un webhook', () => {
        cy.plexButton('Nuevo').click();
        cy.route('POST', '**api/modules/webhook/webhook**').as('create');
        complete({
            nombre: 'Nombre',
            event: 'mpi:patient:create',
            url: 'http://172.16.1.82:3011/pacienteSumar/create',
            method: 'PUT',
            transform: 'fhir'
        });

        cy.plexBool('name="active"', true);
        cy.plexButton('Guardar').click();

        cy.wait('@create').then((xhr) => {
            cy.log('@create');
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('Aceptar').click();
    });

    it('Editar un webhook', () => {
        cy.route('PATCH', '**/api/modules/webhook/webhook/**').as('edit');

        cy.plexText('label="Filtrar (Nombre)"', ' ');

        cy.wait('@busq').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.get('table tbody tr').plexButtonIcon('pencil').first().click();
        cy.plexBool('name="active"', true);

        cy.plexButton('Guardar').click();

        cy.wait('@edit').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('El webhook fue editado');
        cy.contains('Aceptar').click();
    });

    it('Eliminar un webhook', () => {

        cy.route('DELETE', '**/api/modules/webhook/webhook/**').as('delete');

        cy.plexText('label="Filtrar (Nombre)"', 'Nombre');

        cy.wait('@busq').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.wait('@busq');
        cy.wait('@busq');
        cy.wait('@busq');
        cy.wait('@busq');
        cy.wait('@busq');

        cy.get('table tbody tr').plexButtonIcon('trash-can').click();

        cy.contains('¿Desea eliminar?');
        cy.contains('CONFIRMAR').click();

        cy.wait('@delete').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('El Webhook fue eliminado');
        cy.contains('Aceptar').click();

        cy.wait('@busq').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });
});