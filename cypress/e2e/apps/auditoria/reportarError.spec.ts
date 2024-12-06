/// <reference types="Cypress" />

context('auditoria', () => {
    let token;
    let validado5, validado6, validado7, validado8;
    const nombreCorrecto = 'JUAN';
    const apellidoCorrecto = 'AUDITADO';

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
            nombreCorrectoReportado: nombreCorrecto

        }).then(p => {
            validado6 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            reportarError: true,
            apellidoCorrectoReportado: apellidoCorrecto

        }).then(p => {
            validado7 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            reportarError: true,
            nombreCorrectoReportado: nombreCorrecto,
            apellidoCorrectoReportado: apellidoCorrecto
        }).then(p => {
            validado8 = p;
        });
    })

    beforeEach(() => {
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes?reportarError**').as('getReportados');
        cy.intercept('PATCH', '**api/core-v2/mpi/pacientes/**').as('patchPaciente');
        cy.goto('/apps/mpi/auditoria', token);
    })

    it('Reportar error desde mpi y verificar que aparezca en el listado y detalle', () => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');

        cy.plexText('name="buscador"', `${validado5.nombre} ${validado5.apellido}`);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);

        });
        cy.get('paciente-listado plex-item').contains(validado5.nombre);
        cy.plexButtonIcon('pencil').click();

        cy.wait('@getPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.plexTab('datos básicos').click();
        cy.plexBool('name="reportarError"', true);
        cy.plexText('name="apellidoError"', `{selectall}{backspace}${apellidoCorrecto}`);
        cy.plexText('name="nombreError"', `{selectall}{backspace}${nombreCorrecto}`);

        // completamos datos obligatorios por si no están creados
        cy.plexTab('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);

        cy.plexButton('Guardar').click();
        cy.wait('@patchPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.reportarError).to.eq(true);
            expect(response.body.nombreCorrectoReportado).to.eq(nombreCorrecto);
            expect(response.body.apellidoCorrectoReportado).to.eq(apellidoCorrecto);
        });
        cy.contains('Los datos se actualizaron correctamente');

        // Nos dirijimos a la vista de ERRORES REPORTADOS
        cy.goto('/apps/mpi/auditoria', token);

        cy.plexTab('Errores reportados').click()
        cy.wait('@getReportados').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.length).to.gte(1);
        });
        cy.get('plex-item').contains(validado5.nombre).click();
        cy.get('plex-layout-sidebar').contains(validado5.nombre);
        cy.get('plex-layout-sidebar').contains(validado5.apellido);
        cy.get('plex-layout-sidebar').contains(nombreCorrecto);
        cy.get('plex-layout-sidebar').contains(apellidoCorrecto);
    });


    it('Modificar nombre de un paciente reportado con error', () => {

        cy.goto('/apps/mpi/auditoria', token);
        let cantReportes = 0;
        cy.plexTab('Errores reportados').click()
        cy.wait('@getReportados').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            cantReportes = response.body.length;
        });

        cy.get('plex-item').contains(validado6.nombre).click();
        cy.get('plex-layout-sidebar').contains(validado6.nombre);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado6.nombre);
        cy.plexText('name="nombre"', `{selectall}{backspace}${nombreCorrecto}`);
        cy.plexButton(' ACEPTAR ').click();

        // verificamos que se guarde el cambio en el campo nombre
        cy.wait('@patchPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.nombre).to.be.eq(nombreCorrecto);
            expect(response.body.apellido).to.be.eq(validado6.apellido);
            expect(response.body.reportarError).to.be.eq(false)
            expect(response.body.notaError).to.be.eq('');
        });

        cy.toast('success', 'Los datos se actualizaron correctamente!');

        cy.wait('@getReportados').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body).to.have.length(cantReportes);
        });

    });

    it('Modificar apellido de un paciente reportado con error', () => {

        cy.goto('/apps/mpi/auditoria', token);

        cy.plexTab('Errores reportados').click()
        let cantReportes;
        cy.wait('@getReportados').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            cantReportes = response.body.length;
        });

        cy.get('plex-item').contains(validado7.apellido).click();
        cy.get('plex-layout-sidebar').contains(validado7.apellido);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado7.nombre);
        cy.plexText('name="apellido"', `{selectall}{backspace}${apellidoCorrecto}`);
        cy.plexButton(' ACEPTAR ').click();

        // verificamos que se guarde el cambio en el campo apellido
        cy.wait('@patchPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.nombre).to.be.eq(validado7.nombre);
            expect(response.body.apellido).to.be.eq(apellidoCorrecto);
            expect(response.body.reportarError).to.be.eq(false)
            expect(response.body.notaError).to.eq('');
        });
        cy.toast('success', 'Los datos se actualizaron correctamente!');
        cy.wait('@getReportados').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
    });

    it('Modificar datos de un paciente reportado con error y cancelar, verificar que los datos no se modifiquen', () => {
        cy.plexTab('Errores reportados').click();
        cy.get('plex-item').contains(validado8.apellido).click();
        cy.get('plex-layout-sidebar').contains(validado8.apellido);
        cy.get('plex-layout-sidebar').plexButton('corregir').click();
        cy.get('plex-modal').get('plex-item').contains(validado8.nombre);
        cy.plexText('name="nombre"', `{selectall}{backspace}${nombreCorrecto}`);
        cy.plexText('name="apellido"', `{selectall}{backspace}${apellidoCorrecto}`);
        cy.plexButton(' CANCELAR ').click();

        // verificamos que el paciente siga estando en el listado
        cy.get('plex-item').contains(validado8.nombre).contains(validado8.apellido);

    });
});