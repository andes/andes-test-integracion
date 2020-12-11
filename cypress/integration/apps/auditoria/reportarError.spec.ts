/// <reference types="Cypress" />

context('auditoria', () => {
    let token;
    let validado5, validado6, validado7, validado8;

    const notaError = 'cambiar nombre por Juan Auditado';
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });


        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            validado5 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            reportarError: true,
            notaError
        }).then(p => {
            validado6 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            reportarError: true,
            notaError
        }).then(p => {
            validado7 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            reportarError: true,
            notaError
        }).then(p => {
            validado8 = p;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/core/mpi/pacientes/search?reportarError**').as('getReportados');
        cy.route('PUT', '**api/core/mpi/pacientes/**').as('putPaciente');
        cy.goto('/apps/mpi/auditoria', token);
    })

    // it('Reportar error desde mpi y verificar que aparezca en el listado y detalle', () => {
    //     cy.goto('/apps/mpi/busqueda', token);
    //     cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');

    //     cy.plexText('name="buscador"', `${validado5.nombre} ${validado5.apellido}`);
    //     cy.wait('@busquedaPaciente').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //         expect(xhr.response.body[0].nombre).to.be.eq(validado5.nombre);
    //         expect(xhr.response.body[0].apellido).to.be.eq(validado5.apellido);
    //     });
    //     cy.get('paciente-listado plex-item').contains(validado5.nombre);
    //     cy.plexButtonIcon('pencil').click();

    //     cy.wait('@getPaciente').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });
    //     cy.plexTab('datos básicos').click();
    //     cy.plexBool('name="reportarError"', true);
    //     cy.plexText('name="notaError"', notaError);

    //     // completamos datos obligatorios por si no están creados
    //     cy.plexTab('datos de contacto').click()
    //     cy.plexBool('label="Sin datos de contacto"', true);
    //     cy.plexBool('name="viveProvActual"', true);
    //     cy.plexBool('name="viveLocActual"', true);

    //     cy.plexButton('Guardar').click();
    //     cy.wait('@putPaciente').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //         expect(xhr.response.body.reportarError).to.eq(true);
    //         expect(xhr.response.body.notaError).to.eq(notaError);
    //     });
    //     cy.contains('Los datos se actualizaron correctamente');

    //     cy.goto('/apps/mpi/auditoria', token);

    //     cy.plexTab('Errores reportados').click()
    //     cy.wait('@getReportados').then(xhr => {
    //         expect(xhr.status).to.be.eq(200);
    //         cy.log(xhr);
    //         expect(xhr.response.body.length).to.gte(1);
    //     });
    //     cy.get('plex-item').contains(validado5.nombre).click();
    //     cy.get('plex-layout-sidebar').contains(validado5.nombre);
    //     cy.get('plex-layout-sidebar').contains(validado5.apellido);
    //     cy.plexTextArea('name="motivo"');
    // });


    it('Modificar nombre de un paciente reportado con error', () => {
        let nombreCorrecto = `${validado6.nombre}NN`;

        cy.goto('/apps/mpi/auditoria', token);
        let cantReportes = 0;
        cy.plexTab('Errores reportados').click()
        cy.wait('@getReportados').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            cantReportes = xhr.response.body.length;
        });

        cy.get('plex-item').contains(validado6.nombre).click();
        cy.get('plex-layout-sidebar').contains(validado6.nombre);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado6.nombre);
        cy.plexText('name="nombre"', `{selectall}{backspace}${nombreCorrecto}`);
        cy.plexButton(' ACEPTAR ').click();

        // verificamos que se guarde el cambio en el campo nombre
        cy.wait('@putPaciente').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.nombre).to.be.eq(nombreCorrecto);
            expect(xhr.responseBody.apellido).to.be.eq(validado6.apellido);
            expect(xhr.responseBody.reportarError).to.be.eq(false)
            expect(xhr.responseBody.notaError).to.be.eq('');
        });

        cy.toast('success', 'Los datos se actualizaron correctamente!');

        cy.wait('@getReportados').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody).to.have.length(cantReportes);
        });

    });

    it('Modificar apellido de un paciente reportado con error', () => {

        let apellidoCorrecto = `${validado7.apellido}AA`;

        cy.goto('/apps/mpi/auditoria', token);

        cy.plexTab('Errores reportados').click()
        let cantReportes;
        cy.wait('@getReportados').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            cantReportes = xhr.response.body.length;
        });

        cy.get('plex-item').contains(validado7.apellido).click();
        cy.get('plex-layout-sidebar').contains(validado7.apellido);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado7.nombre);
        cy.plexText('name="apellido"', `{selectall}{backspace}${apellidoCorrecto}`);
        cy.plexButton(' ACEPTAR ').click();

        // verificamos que se guarde el cambio en el campo apellido
        cy.wait('@putPaciente').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.nombre).to.be.eq(validado7.nombre);
            expect(xhr.responseBody.apellido).to.be.eq(apellidoCorrecto);
            expect(xhr.responseBody.reportarError).to.be.eq(false)
            expect(xhr.responseBody.notaError).to.eq('');
        });
        cy.toast('success', 'Los datos se actualizaron correctamente!');
        cy.wait('@getReportados').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('Modificar datos de un paciente reportado con error y cancelar, verificar que los datos no se modifiquen', () => {
        cy.plexTab('Errores reportados').click();
        cy.get('plex-item').contains(validado8.apellido).click();
        cy.get('plex-layout-sidebar').contains(validado8.apellido);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado8.nombre);
        cy.plexText('name="nombre"', `{selectall}{backspace}NNN`);
        cy.plexText('name="apellido"', `{selectall}{backspace}AAA`);
        cy.plexButton(' CANCELAR ').click();

        // verificamos que el paciente siga estando en el listado
        cy.get('plex-item').contains(validado8.nombre).contains(validado8.apellido);

    });
});