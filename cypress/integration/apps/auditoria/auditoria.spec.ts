/// <reference types="Cypress" />

context('auditoria', () => {
    let token;
    let validado1;
    let validado2;
    let temporal1;
    let temporal2;
    let sinDocumento1;
    let sinDocumento2;

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
            template: 'sin-documento'
        }).then(p => {
            sinDocumento1 = p;
        });
        cy.task('database:create:paciente', {
            template: 'sin-documento'
        }).then(p => {
            sinDocumento2 = p;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/core/mpi/pacientes/search**').as('busquedaPaciente');
        cy.route('PATCH', '**/api/core-v2/mpi/pacientes/**').as('patchPaciente');
        cy.goto('/apps/mpi/auditoria', token);
    })

    it('vincular dos pacientes validados', () => {
        cy.plexText('name="buscadorAuditoria"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(format(validado1.documento));
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();
        cy.plexText('name="buscador"', validado2.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(format(validado2.documento)).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.eq(validado1.documento);
            expect(xhr.response.body.activo).to.eq(true);
        });
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(format(validado2.documento));
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
        cy.plexButton('desvincular').click();
        cy.swal('confirm', '¿Está seguro que desea desvincular a este paciente?');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'La desvinculación ha sido realizada correctamente');
    });

    it('vincular dos pacientes temporales', () => {
        cy.plexText('name="buscadorAuditoria"', temporal1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(format(temporal1.documento));
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();

        cy.plexText('name="buscador"', temporal2.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(format(temporal2.documento)).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.eq(temporal1.documento);
            expect(xhr.response.body.activo).to.eq(true);
        });
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(format(temporal2.documento));
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
        cy.plexButton('desvincular').click();
        cy.swal('confirm', '¿Está seguro que desea desvincular a este paciente?');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'La desvinculación ha sido realizada correctamente');
    });

    it('vincular un paciente validado con uno temporal', () => {
        cy.plexText('name="buscadorAuditoria"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(format(validado1.documento));
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();

        cy.plexText('name="buscador"', temporal1.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(format(temporal1.documento)).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.eq(validado1.documento);
            expect(xhr.response.body.activo).to.eq(true);
        });
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(format(temporal1.documento));
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
        cy.plexButton('desvincular').click();
        cy.swal('confirm', '¿Está seguro que desea desvincular a este paciente?');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'La desvinculación ha sido realizada correctamente');
    });

    it('vincular un paciente validado con uno sin documento', () => {
        cy.plexText('name="buscadorAuditoria"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(format(validado1.documento));
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();

        cy.plexText('name="buscador"', `${sinDocumento1.nombre} ${sinDocumento1.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(sinDocumento1.nombre).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(true);
            expect(xhr.response.body.nombre).to.be.eq(validado1.nombre);
        });

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(sinDocumento1.nombre);
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
        cy.plexButton('desvincular').click();
        cy.swal('confirm', '¿Está seguro que desea desvincular a este paciente?');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'La desvinculación ha sido realizada correctamente');
    });

    it('vincular un paciente temporal con uno sin documento', () => {
        cy.plexText('name="buscadorAuditoria"', temporal1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(format(temporal1.documento));
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();

        cy.plexText('name="buscador"', `${sinDocumento1.nombre} ${sinDocumento1.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(sinDocumento1.nombre).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(true);
            expect(xhr.response.body.nombre).to.be.eq(temporal1.nombre);
        });
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(sinDocumento1.nombre);
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
        cy.plexButton('desvincular').click();
        cy.swal('confirm', '¿Está seguro que desea desvincular a este paciente?');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'La desvinculación ha sido realizada correctamente');
    });

    it('vincular dos pacientes sin documento', () => {
        cy.plexText('name="buscadorAuditoria"', sinDocumento1.nombre);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('auditoria-listado').contains(sinDocumento1.nombre);
        cy.get('plex-dropDown').click().get('a').contains('VINCULAR').click();

        cy.plexText('name="buscador"', `${sinDocumento2.nombre} ${sinDocumento2.apellido}`);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(sinDocumento2.nombre).click();
        cy.plexButton('Confirmar vinculación').click();

        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(true);
            expect(xhr.response.body.nombre).to.be.eq(sinDocumento1.nombre);
        });
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.eq(false);
        });
        // chequea que el paciente figure en lista de vinculados
        cy.get('plex-list').find('plex-item').contains(sinDocumento2.nombre);
        cy.toast('success', 'La vinculación ha sido realizada correctamente');
    });
})

function format(s) {
    return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}