context('Solicitudes', () => {

    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
        })
    })

    beforeEach(() => {
        cy.createPrestacion('solicitudes/solicitud-auditoria', token)
    })

    describe('Acciones sobre una solicitud existente', () => {

        beforeEach(() => {
            cy.goto('/solicitudes', token);
            cy.intercept('GET', '**/api/core-v2/mpi/pacientes**', req => {
                delete req.headers['if-none-match'] // evita que responda con datos de caché (statusCode 304)
            }).as('consultaPaciente');
            cy.intercept('GET', '**/api/core/tm/conceptos-turneables?**', req => { delete req.headers['if-none-match'] }).as('conceptosTurneables');
            cy.intercept('GET', '**/api/modules/top/reglas?organizacionDestino=**', req => { delete req.headers['if-none-match'] }).as('getReglas');
            cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesional');
            cy.intercept('GET', '**/api/modules/rup/prestaciones/solicitudes**', req => { delete req.headers['if-none-match'] }).as('solicitudes');
            cy.intercept('GET', '**/api/core/tm/organizaciones**', req => { delete req.headers['if-none-match'] }).as('getOrganizaciones');
            cy.intercept('POST', '**/api/modules/rup/prestaciones', req => { delete req.headers['if-none-match'] }).as('guardarSolicitud');
            cy.intercept('POST', '**/api/modules/top/reglas', req => { delete req.headers['if-none-match'] }).as('guardarRegla');
            cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**', req => { delete req.headers['if-none-match'] }).as('patchSolicitud');
        })


        it('Aceptar solicitud', () => {
            cy.get('plex-table tr').contains('auditoria').click();
            cy.get('plex-layout-sidebar').plexIcon('lock-alert').click({ force: true })
            cy.plexButton('Aceptar').click({ force: true });
            cy.get('textarea').last().type('Una observacion aceptar', { force: true });
            cy.plexIcon('check').click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                const i = response.body.solicitud.historial.length - 1;
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.solicitud.historial[i].descripcion).to.be.eq('Aceptada');
                expect(response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion aceptar');
            });
            cy.wait('@solicitudes');
            cy.get('plex-table tr').contains('pendiente')
        })

        it('Anular solicitud', () => {
            cy.get('plex-table tr').contains('pendiente').first().click();
            cy.get('plex-layout-sidebar').plexIcon('cancel').click({ force: true })
            cy.get('textarea').last().type('Una observacion anular', { force: true });
            cy.plexIcon('check').click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                const i = response.body.solicitud.historial.length - 1;
                expect(response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion anular');
                expect(response.body.solicitud.historial[i].accion).to.be.eq('anulada');
                expect(response.body.solicitud.historial[i].descripcion).to.be.eq('Anulada');
            });
            cy.wait('@solicitudes');
            cy.plexButtonIcon('chevron-down').click();
            cy.plexSelectType('label="Estado"', 'ANULADA');
            cy.wait('@solicitudes').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                const i = response.body[0].solicitud.historial.length - 1;
                expect(response.body[0].solicitud.historial[i].descripcion).to.be.eq('Anulada');
                expect(response.body[0].solicitud.historial[i].observaciones).to.be.eq('Una observacion anular');
            });
        });

        it('Asignar solicitud', () => {
            cy.get('plex-table tr').contains('auditoria').first().click();
            cy.get('plex-layout-sidebar .plex-box-content').scrollTo('bottom').wait(500);
            cy.get('plex-layout-sidebar').plexIcon('lock-alert').click({ force: true })
            cy.plexButton('Asignar').click({ force: true });
            cy.get('textarea').last().type('Una observacion asignar', { force: true });
            cy.plexSelectAsync('label="Profesional"', 'CORTES JAZMIN', '@getProfesional', 0);

            cy.plexIcon('check').click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                const i = response.body.solicitud.historial.length - 1;
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.estados[1].observaciones).to.be.eq('Una observacion asignar');
                expect(response.body.solicitud.historial[i].descripcion).to.be.eq('Profesional asignado');
                expect(response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion asignar');
            });
            cy.wait('@solicitudes').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });
            cy.get('plex-table tr').contains('asignada')
        })


        // PENDIENTE HASTA CORREGIR CIERRE DE PLEX-HELP AL SCROLLEAR YA QUE NO SE VE EL FORMULARIO COMPLETO
        it.skip('Referir solicitud', () => {
            cy.get('plex-table tr').contains('auditoria').first().click();
            cy.get('plex-layout-sidebar').plexIcon('lock-alert').click({ force: true })
            cy.plexButton('Referir').click({ force: true });
            cy.get('textarea').last().type('Una observacion referir', { force: true });
            cy.plexSelect('label="Organización destino"', 0).click();
            cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).click();
            cy.plexSelectAsync('label="Profesional destino"', 'CORTES JAZMIN', '@getProfesional', '58f74fd3d03019f919e9fff2');

            cy.plexIcon('check').click();
            cy.wait('@patchSolicitud').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                const i = response.body.solicitud.historial.length - 1;
                expect(response.body.solicitud.historial[i].observaciones).to.be.eq('Una observacion referir');
                expect(response.body.solicitud.historial[i].descripcion).to.be.eq('Referida');
            });
            cy.get('plex-table tr').contains('auditoria').first().click();
            cy.get('plex-layout-sidebar').contains('lock-alert')
        });


        it('Responder solicitud', () => {
            cy.get('plex-table tr').contains('auditoria').first().click();
            cy.get('plex-layout-sidebar').plexIcon('lock-alert').click({ force: true })
            cy.plexButton('Responder').click({ force: true });
            cy.get('textarea').last().type('No se acepta por ...', { force: true });
            cy.plexIcon('check').click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                const i = response.body.solicitud.historial.length - 1;
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.estados[1].observaciones).to.be.eq('No se acepta por ...');
                expect(response.body.solicitud.historial[i].observaciones).to.be.eq('No se acepta por ...');
            });
            cy.wait('@solicitudes').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });
            cy.get('plex-table tr').contains('CONTRARREFERIDA')
        });
    });
});

