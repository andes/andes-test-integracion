/// <reference types="Cypress" />

context('auditoria', () => {
    let token;
    let validado1;
    let validado2;
    let validado3;
    let validado4;
    let temporal1;
    let temporal2;
    let temporal3;
    let temporal4;
    let sinDocumento1;
    let sinDocumento2;
    let sinDocumento3;
    let sinDocumento4;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        // [TODO] poder crear tres o más paciente de un tiro.
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            validado1 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            validado2 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            validado3 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            validado4 = p;
        });
        cy.task('database:create:paciente', {
            template: 'temporal'
        }).then(p => {
            temporal1 = p;
        });
        cy.task('database:create:paciente', {
            template: 'temporal'
        }).then(p => {
            temporal2 = p;
        });
        cy.task('database:create:paciente', {
            template: 'temporal'
        }).then(p => {
            temporal3 = p;
        });
        cy.task('database:create:paciente', {
            template: 'temporal'
        }).then(p => {
            temporal4 = p;
        });
        cy.task('database:create:paciente', {
            template: 'sin-documento'
        }).then(p => {
            sinDocumento1 = p;
        });
        cy.task('database:create:paciente', {
            template: 'sin-documento'
        }).then(p => {
            sinDocumento2 = p;
        });
        cy.task('database:create:paciente', {
            template: 'sin-documento'
        }).then(p => {
            sinDocumento3 = p;
        });
        cy.task('database:create:paciente', {
            template: 'sin-documento'
        }).then(p => {
            sinDocumento4 = p;
        });
    })
    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**/api/core/mpi/pacientes/**').as('vincularPaciente');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.goto('/apps/mpi/auditoria', token);
    })

    it('vincular dos pacientes validados', () => {
        cy.plexText('name="buscador"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains(validado1.nombre).click();

        cy.plexButton('Vincular').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', validado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains(validado2.nombre).click();

        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente temporal con uno temporal', () => {
        cy.plexText('name="buscador"', temporal1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains(temporal1.nombre).click();
        cy.plexButton('Vincular').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', temporal2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains(temporal2.nombre).click();
        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente validado con uno temporal', () => {
        cy.plexText('name="buscador"', validado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(validado3.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(validado3.apellido);
        });
        cy.get('plex-item').contains(validado3.nombre).click();
        cy.plexButton('Vincular').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', temporal3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains(temporal3.nombre).click();
        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente validado con uno sin documento', () => {
        cy.plexText('name="buscador"', validado4.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(validado4.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(validado4.apellido);
        });
        cy.get('plex-item').contains(validado4.nombre).click();
        cy.plexButton('Vincular').click();
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', `${sinDocumento1.nombre} ${sinDocumento1.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(sinDocumento1.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(sinDocumento1.apellido);
        });
        cy.get('plex-item').contains(sinDocumento1.nombre).click();
        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular un paciente temporal con uno sin documento', () => {
        cy.plexText('name="buscador"', temporal4.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(temporal4.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(temporal4.apellido);
        });
        cy.get('plex-item').contains(temporal4.nombre).click();
        cy.plexButton('Vincular').click();
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('name="buscador"', `${sinDocumento2.nombre} ${sinDocumento2.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(sinDocumento2.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(sinDocumento2.apellido);
        });
        cy.get('plex-item').contains(sinDocumento2.nombre).click();
        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });

    it('vincular dos pacientes sin documento', () => {
        cy.plexText('name="buscador"', `${sinDocumento3.nombre} ${sinDocumento3.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(sinDocumento3.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(sinDocumento3.apellido);
        });
        cy.get('plex-item').contains(sinDocumento3.nombre).click();
        cy.plexButton('Vincular').click();
        cy.plexText('name="buscador"', `${sinDocumento4.nombre} ${sinDocumento4.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq(sinDocumento4.nombre);
            expect(xhr.response.body[0].apellido).to.be.eq(sinDocumento4.apellido);
        });
        cy.get('plex-item').contains(sinDocumento4.nombre).click();
        cy.plexButton('Vincular').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@vincularPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.vinculos).to.have.length(2);
        });
        cy.get('tbody tr').first().find('span').should('have.class', 'badge badge-success').should('contain', 'Activo'); // valido que la persona buscada esté validada y la selecciono
        cy.get('plex-button[label="Desactivar"]').should('have.attr', 'type', 'warning');
    });
})