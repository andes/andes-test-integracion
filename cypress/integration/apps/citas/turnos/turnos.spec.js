/// <reference types="Cypress" />
// Realiza las pruebas del camino básico: crear paciente, agendas, dar turno del dia, profesional, programado (crea solicitudes)
context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })
    beforeEach(() => {
        cy.viewport(1280, 720)
    })

    it('Registrar paciente', () => {
        cy.goto('/citas/puntoInicio', token);
        cy.server();

        cy.get('plex-button[label="Nuevo Paciente temporal"]').click();
        cy.get('plex-int[label="Número de Documento"] input').type('99fs879546').should('have.value', '99879546');
        cy.get('plex-text[label="Nombre"] input').first().type('Rogelio');
        cy.get('plex-text[label="Apellido"] input').first().type('Gutierrez');
        cy.get('plex-datetime[label="Fecha de Nacimiento"] input').type('18/01/1995');
        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');
        cy.get('plex-bool[label="No posee ningún tipo de contacto"] input[type="checkbox"]').check({
            force: true
        });

        cy.route('GET', '**/api/core/mpi/pacientes**').as('guardarPaciente'); // **/api/core/mpi/pacientes?type=suggest&claveBlocking=documento&percentage=true&apellido=GUTIERREZ&nombre=ROGELIO&documento=99879546&sexo=masculino&fechaNacimiento=1995-01-18T03:00:00.000Z
        cy.get('plex-button[label="Guardar"]').click().click();
        cy.wait('@guardarPaciente').then(() => {
            cy.get('div').should('contain', 'Los datos se actualizaron correctamente');
        });
    });

    it('Crear agenda hoy y publicarla', () => {
        cy.goto('/citas/gestor_agendas', token);
        cy.server();

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.get('div').then(($body) => {
            if ($body.hasClass('swal2-container')) {
                cy.get('.swal2-cancel').click({
                    force: true
                })
            }
        })
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('12');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('14');
        cy.get('plex-select[name="modelo.tipoPrestaciones"] input').type('consulta de medicina general{enter}');
        cy.get('plex-select[name="modelo.profesionales"] input').type('alvarez angelica vanesa', {
            force: true
        });
        cy.wait(1000); // TODO no darle enter hasta que se haya cargado el profesional
        cy.get('plex-select[name="modelo.profesionales"] input').type('{enter}');
        cy.get('plex-int[name="cantidadTurnos"] input').type('4');
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type('4');
        cy.wait(1000);
        cy.get('plex-button[label="Guardar"]').click();

        // publico la agenda
        cy.get('table tbody div').contains('ALVAREZ, ANGELICA VANESA').click();
        cy.get('botones-agenda plex-button[title="Publicar"]').click();
        cy.get('button').contains('CONFIRMAR').click();
    })

    it('dar turno de día', () => {
        cy.goto('/citas/puntoInicio', token);
        cy.server();

        cy.route('GET', '**/api/core/mpi/pacientes?type=multimatch&cadenaInput=99879546').as('consultaPaciente');
        cy.get('paciente-search-turnos input').first().type('99879546');
        cy.wait('@consultaPaciente').then(() => {
            cy.get('table tbody').contains('99.879.546').click();
        });
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.get('plex-select[name = "profesional"] input').first().type('ALVAREZ ANGELICA VANESA');
        cy.wait(1000);
        cy.get('plex-select[name = "profesional"] input').first().type('{enter}');
        cy.wait(1000);

        cy.get('div[class="dia"]').contains(Cypress.moment().format('D')).click({
            force: true
        });
        cy.get('dar-turnos div').contains('13:30').click();
        // cy.get('plex-button[label="Confirmar"]').click();

        // // Confirmo que se le dio el turno
        // cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');
    });

    it('Crear agenda semana próxima y publicarla', () => {
        cy.goto('/citas/gestor_agendas', token);
        cy.server();

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.get('div').then(($body) => {
            if ($body.hasClass('swal2-container')) {
                cy.get('.swal2-cancel').click({
                    force: true
                })
            }
        })
        let proximaSemana = Cypress.moment().add(7, 'days').format('DD/MM/YYYY');
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(proximaSemana);
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('10');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('15');
        cy.get('plex-select[name="modelo.tipoPrestaciones"] input').type('consulta de medicina general (procedimiento){enter}');
        cy.get('plex-select[name="modelo.profesionales"] input').type('alvarez angelica vanesa', {
            force: true
        });
        cy.wait(1000); // TODO no darle enter hasta que se haya cargado el profesional
        cy.get('plex-select[name="modelo.profesionales"] input').type('{enter}');
        cy.get('plex-int[name="cantidadTurnos"] input').type('10');
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type('2');
        cy.get('plex-int[name="accesoDirectoProgramado"] input').type('3');
        cy.get('plex-int[name="reservadoGestion"] input').type('3');
        cy.get('plex-int[name="reservadoProfesional"] input').type('2');
        cy.get('plex-button[label="Guardar"]').click({
            force: true
        });

        // publico la agenda

        cy.get('plex-datetime[name="fechaDesde"] input').type('{selectall}{backspace}' + proximaSemana);
        cy.get('plex-datetime[name="fechaHasta"] input').type('{selectall}{backspace}' + proximaSemana);
        cy.wait(15000);
        cy.route('GET', '**/api/modules/turnos/agenda/5c2ca5df9b2ff016c7198f0f').as('botonAgenda');
        cy.get('table tbody div').contains('ALVAREZ, ANGELICA VANESA').click({
            force: true
        });

        cy.wait('@botonAgenda').then(() => {
            cy.get('botones-agenda plex-button[title="Publicar"]').click();
            cy.get('button').contains('CONFIRMAR').click();
        });
    })

    it('Crear solicitud diferente profesional y prestación, misma organización', () => {
        cy.goto('/citas/solicitudes', token);
        cy.server();

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('pacientesSearch plex-text[placeholder="Escanee un documento digital, o escriba un documento/apellido/nombre"] input').first().type('99879546');
        cy.get('table tbody td span').contains('99879546').click();
        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        // Prestación Destino (solicitada)
        cy.route('GET', '**//api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('consulta de medicina general (procedimiento)', {
            force: true
        });
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('{enter}');

        });
        // Organización Origen
        cy.get('plex-select[name="organizacionOrigen"] input').type('Castro Rendon');
        cy.get('plex-select[name="organizacionOrigen"] input').type('{enter}');

        // Prestación Origen
        cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('consulta de medicina general');
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('{enter}');

        });
        // Profesional Origen
        cy.route('GET', '**/api/core/tm/profesionales*').as('profesional')
        cy.get('plex-select[name="profesionalOrigen"] input').first().type('Yang So Min');
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="profesionalOrigen"] input').first().type('{enter}');
        });
        // Profesional Destino
        cy.get('plex-select[name="profesional"] input').type('ALVAREZ ANGELICA VANESA');
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="profesional"] input').type('{enter}');
        });

        cy.get('plex-text[name="motivo"] input').first().type('Prueba', {
            force: true
        });
        cy.get('plex-button[label="Guardar"]').click();
        cy.get('div[class="simple-notification toast success"]').contains('Solicitud guardada');

    });

    // it('FUNCIONA MAL : dar turno para profesional', () => { // TODO
    //     cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
    //         onBeforeLoad: (win) => {
    //             win.sessionStorage.setItem('jwt', token);
    //         }
    //     });
    //     cy.server();
    //     // cy.get('plex-button[type="default"]').click();
    //     // cy.get('plex-select[label="Estado"] input').type('auditoria{enter}');

    //     // cy.get('tbody td').should('contain', 'auditoria').and('contain', 'YANG, SO MIN');
    //     // cy.get('plex-button[title="Auditar Solicitud"]').click({
    //     //     force: true
    //     // });
    //     // cy.get('auditar-solicitud plex-button[type="success"]').should('have.text', 'Aceptar').click();

    //     // dar turno
    //     cy.get('tbody td').should('not.contain', 'auditoria').and('contain', 'YANG, SO MIN');
    //     cy.get('plex-button[title="Dar Turno"]').first().click({
    //         force: true
    //     });

    //     cy.route('GET', '**/api/modules/turnos/agenda*').as('agenda');
    //     cy.get('div[class="dia"]').contains(Cypress.moment().add(7, 'days').format('D')).click({
    //         force: true
    //     });
    //     // cy.wait('@agenda').then(() => {
    //     //     cy.get('dar-turnos div').contains('13:00').click({
    //     //         force: true
    //     //     }); // no carga el sidebar
    //     // });

    //     cy.wait(15000);
    //     cy.get('dar-turnos div').contains('13:00').click({
    //         force: true
    //     });


    //     cy.get('plex-button[label="Confirmar"]').click();
    //     cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');
    // });

    it('Crear solicitud autocitado', () => {
        cy.goto('/citas/solicitudes', token);
        cy.server();

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('pacientesSearch plex-text[placeholder="Escanee un documento digital, o escriba un documento/apellido/nombre"] input').first().type('99879546');
        cy.get('table tbody td span').contains('99879546').click();
        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('plex-bool[name="autocitado"] input').check({
            force: true
        });

        // Prestación Destino (solicitada)
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('consulta de medicina general (procedimiento)', {
            force: true
        });
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('{enter}');

        });
        // Profesional Origen
        cy.route('GET', '**/api/core/tm/profesionales*').as('profesional')
        cy.get('plex-select[name="profesionalOrigen"] input').first().type('ALVAREZ ANGELICA VANESA');
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="profesionalOrigen"] input').first().type('{enter}');
        });

        cy.get('plex-text[name="motivo"] input').first().type('Prueba', {
            force: true
        });
        cy.get('plex-button[label="Guardar"]').click();
        cy.get('div[class="simple-notification toast success"]').contains('Solicitud guardada');

    });

    // it('FALLA: dar turno autocitado', () => { // TODO
    //     cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
    //         onBeforeLoad: (win) => {
    //             win.sessionStorage.setItem('jwt', token);
    //         }
    //     });
    //     cy.server();

    //     cy.get('plex-button[type="default"]').click();
    //     cy.get('plex-select[label="Estado"] input').type('pendiente{enter}');

    //     cy.get('tbody td').should('contain', 'AUTOCITADO').and('contain', 'ALVAREZ, ANGELICA VANESA');
    //     cy.get('plex-button[title="Dar Turno"]').click({
    //         force: true
    //     });


    //     // dar turno 
    //     cy.route('GET', '**/api/modules/turnos/agenda*').as('agenda');
    //     cy.get('div[class="dia"]').contains(Cypress.moment().add(7, 'days').format('D')).click({
    //         force: true
    //     });
    //         cy.wait('@agenda').then(() => {
    //             cy.get('dar-turnos div').contains('13:30').click({
    //                 force: true
    //             }); // no carga el sidebar
    //         });
    //     cy.get('plex-button[label="Confirmar"]').click();
    //     cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');
    // });

})