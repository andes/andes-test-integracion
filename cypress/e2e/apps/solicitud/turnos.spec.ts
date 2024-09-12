// <reference types="Cypress" />

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente');
    const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
    cy.get('paciente-listado plex-item').contains(documento).click();
}

context('TOP: Acciones con turno', () => {
    let token, dni, pacientes;
    const pasadoManiana = Cypress.moment().add(2, 'days');

    before(() => {
        cy.seed();
        cy.task('database:seed:agenda', {
            inicio: '1',
            fin: '3',
            fecha: 2,
            profesionales: '5d02602588c4d1772a8a17f8',
            tipoPrestaciones: '598ca8375adc68e2a0c121b8',
            tipo: 'gestion'
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.createSolicitud('solicitudes/solicitudAutocitado', token);
            cy.createAgenda48hs('solicitudes/agendaProfesional', token);
        });

        cy.task('database:seed:paciente').then(p => { pacientes = p; })
    })

    beforeEach(() => {
        cy.intercept('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('searchPaciente');
        cy.intercept('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('tipoPrestacion');
        cy.intercept('GET', '**/api/modules/top/reglas?**', req => { delete req.headers['if-none-match'] }).as('reglas');
        cy.intercept('GET', '**/api/modules/turnos/agenda?**').as('listadoAgendas');
        cy.intercept('GET', '**/api/modules/turnos/agenda/**').as('getAgenda');
        cy.intercept('GET', '**/api/modules/rup/prestaciones/solicitudes?**', req => { delete req.headers['if-none-match'] }).as('getSolicitudes');
        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**').as('patchSolicitud');
        cy.intercept('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.intercept('POST', '**/api/auth/file-token').as('file-token');
        cy.intercept('POST', '**/api/modules/turnos/listaEspera**').as('listaEspera');
        cy.intercept('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');

        cy.goto('/solicitudes', token);
        cy.plexButton("Nueva Solicitud").click();

    });

    describe('Nuevo turno', () => {

        it('intentar dar turno autocitado y cancelar', () => {

            cy.plexButtonIcon('chevron-down').click();
            cy.plexSelectType('label="Estado"', 'pendiente');

            cy.wait('@getSolicitudes').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body[0].estados[0].tipo).to.be.eq('pendiente');
                expect(response.body[0].paciente.documento).to.be.eq('32589654');
                expect(response.body[0].solicitud.profesional.nombre).to.be.eq('MARIA');
                expect(response.body[0].solicitud.profesional.apellido).to.be.eq('PEREZ');
                expect(response.body[0].solicitud.tipoPrestacion.id).to.be.eq('59ee2d9bf00c415246fd3d6b');
                expect(response.body[0].solicitud.tipoPrestacion.term).to.be.eq('Consulta de clínica médica');
            });
            cy.get('table tbody td').should('contain', 'AUTOCITADO').and('contain', 'PEREZ, MARIA');
            cy.get('table tbody td').contains('PEREZ, MARIA').click();
            cy.get('plex-layout-sidebar').plexButtonIcon('calendar-plus').click();
            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });

            if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
                cy.plexButtonIcon('chevron-right').click();
                cy.wait('@listadoAgendas').then(({ response }) => {
                    expect(response.statusCode).to.be.eq(200);
                });
            }
            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                cy.get('app-calendario .dia').contains(Cypress.moment().add(2, 'days').format('D')).click({ force: true });
            });

            cy.get('plex-card').eq(0).click();
            cy.plexButton('Volver').click();
            cy.get('table tbody td').should('contain', 'pendiente').and('contain', 'PEREZ, MARIA');
        });


        it('dar turno autocitado exitoso', () => {

            cy.plexButtonIcon('chevron-down').click({ force: true });
            cy.plexSelectType('label="Estado"', 'pendiente');

            cy.wait('@getSolicitudes').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body[0].estados[0].tipo).to.be.eq('pendiente');
                expect(response.body[0].paciente.documento).to.be.eq('32589654');
                expect(response.body[0].solicitud.profesional.nombre).to.be.eq('MARIA');
                expect(response.body[0].solicitud.profesional.apellido).to.be.eq('PEREZ');
                expect(response.body[0].solicitud.tipoPrestacion.id).to.be.eq('59ee2d9bf00c415246fd3d6b');
                expect(response.body[0].solicitud.tipoPrestacion.term).to.be.eq('Consulta de clínica médica');
            });
            cy.get('table tbody td').should('contain', 'AUTOCITADO').and('contain', 'PEREZ, MARIA');
            cy.get('table tbody td').contains('PEREZ, MARIA').click();
            cy.get('plex-layout-sidebar').plexButtonIcon('calendar-plus').click();

            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });


            if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
                cy.plexButtonIcon('chevron-right').click();
                cy.wait('@listadoAgendas').then(({ response }) => {
                    expect(response.statusCode).to.be.eq(200);
                });
            }

            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                cy.get('app-calendario .dia').contains(Cypress.moment().add(2, 'days').format('D')).click({ force: true });
            });

            cy.get('plex-card').eq(0).click();
            cy.plexButton('Confirmar').click();
            cy.wait('@confirmarTurno').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.profesionales[0].nombre).to.be.eq('MARIA');
                expect(response.body.profesionales[0].apellido).to.be.eq('PEREZ');
            });

            cy.plexButtonIcon('chevron-down').click();
            cy.plexSelectType('label="Estado"').clearSelect();
            cy.plexSelectType('label="Estado"', 'turno dado');
            cy.get('table tbody td').contains('PEREZ, MARIA').click();
            cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
            cy.get('historial-solicitud').contains('Turno asignado por Natalia Huenchuman');
        });
    });


    describe('TOP: Liberar turno', () => {

        it('controlar estado de turno de solicitud liberado', () => {
            cy.viewport(1920, 1080);

            let idPrestacion;

            // <! -- CREAR SOLICITUD
            seleccionarPaciente(pacientes[0].documento);

            cy.plexDatetime('label="Fecha de solicitud"', cy.today());
            cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de medicina general', '@tipoPrestacion', 0);
            cy.wait('@reglas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });
            cy.plexSelect('label="Organización origen"', 0).click();
            cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
                idPrestacion = elemento.attr('data-value');
            }).click({ force: true });
            cy.plexSelectAsync('label="Profesional solicitante"', 'NATALIA HUENCHUMAN', '@profesionalSolicitante', 0);
            cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
            cy.plexButton('Guardar').click({ force: true });
            cy.wait('@createSolicitud').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.paciente.documento).to.be.eq(pacientes[0].documento);
                expect(response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
                expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
            });
            cy.toast('success');
            cy.wait('@getSolicitudes');

            cy.get('table tbody td').contains(pacientes[0].documento).click();
            cy.get('plex-layout-sidebar').plexButtonIcon('lock-alert').click();
            cy.wait('@file-token').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200)
            });
            cy.plexButton("Aceptar").click({ force: true });
            cy.plexTextArea('name="observaciones"', 'prueba de observacion')
            cy.plexButtonIcon("check").click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.estados[0].tipo).to.be.eq('auditoria');
                expect(response.body.estados[1].tipo).to.be.eq('pendiente');
                expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
                expect(response.body.solicitud.historial[1].accion).to.be.eq('pendiente');
                expect(response.body.solicitud.historial[1].observaciones).to.be.eq('prueba de observacion');
            });
            // CREAR SOLICITUD -->

            // <!-- ASIGNAR TURNO
            cy.get('table tbody td').contains(pacientes[0].nombre).click();
            cy.get('plex-layout-sidebar').plexButtonIcon('calendar-plus').click();
            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200)
            });
            cy.wait('@listadoAgendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200)
            });

            if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
                cy.plexButtonIcon('chevron-right').click();
                cy.wait('@listadoAgendas').then(({ response }) => {
                    expect(response.statusCode).to.be.eq(200)
                });
            }
            cy.get('div[class="dia"]').contains(pasadoManiana.format('D')).click({ force: true });
            cy.get('plex-card').eq(1).click();
            cy.plexButton("Confirmar").click({ force: true });
            cy.wait('@patchSolicitud').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.estados[0].tipo).to.be.eq('auditoria');
                expect(response.body.estados[1].tipo).to.be.eq('pendiente');
                expect(response.body.solicitud.historial[2].accion).to.be.eq('asignarTurno');
            });

            // ASIGNAR TURNO -->

            // <! -- LIBERAR TURNO
            cy.goto('/citas/gestor_agendas', token);
            cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + pasadoManiana.format('DD/MM/YYYY'));
            cy.get('table tbody td').first().click({ force: true });
            cy.wait('@getAgenda').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
                expect(response.body.profesionales[0].apellido).to.be.eq('Huenchuman');
                expect(response.body.profesionales[0].nombre).to.be.eq('Natalia');
            });
            // cy.wait(2000);
            // cy.get('table tbody td').contains('DNI ' + pacientes[0].documento).click({ force: true });
            // cy.plexButtonIcon('account-off').click({ force: true });
            // cy.plexButtonIcon('check').click();
            // cy.goto('/solicitudes', token);

            // cy.get('span.badge-info').contains('pendiente');
            // cy.get('table tbody td').contains('Huenchuman, Natalia').click();
            // cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
            // cy.get('historial-solicitud .item-list').should('length', 4);
            // cy.get('historial-solicitud').contains('Turno liberado por Natalia Huenchuman');
            // // <! -- LIBERAR TURNO
        });
    });
});