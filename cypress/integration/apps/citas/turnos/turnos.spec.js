/// <reference types="Cypress" />
// Realiza las pruebas del camino básico: crear paciente, agendas, dar turno del dia, profesional, programado (crea solicitudes)
context('Aliasing', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        })
    })
    beforeEach(() => {
        cy.viewport(1280, 720)
    })

    it('Registrar bebé desde punto de Inicio de Turnos', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
        // Rutas para control
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
        cy.route('POST', '**api/core/mpi/pacientes').as('bebeAgregado');

        cy.get('paciente-buscar input').first().type('4659874562');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('BEBÉ').click();

        // Se completa datos básicos
        cy.get('plex-text[name="apellido"] input').first().type('apellidoBebe12').should('have.value', 'apellidoBebe12');

        cy.get('plex-text[name="nombre"] input').first().type('nombreBebe12').should('have.value', 'nombreBebe12');

        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');

        cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        // Se completa datos
        cy.get('paciente-buscar[label="Buscar"] input').first().type('11181222');

        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se selecciona el progenitor 
        cy.get('paciente-listado').find('td').contains('11181222').click();


        // Se actualizan los datos del domicilio
        cy.get('plex-button[label="Actualizar"]').click();

        cy.get('plex-button[label="Guardar"]').click();

        // Se espera la actualización de la relación del progenitor con el bebé
        cy.wait('@relacionProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.relaciones).to.have.length(1)
        });

        // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
        cy.wait('@bebeAgregado').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.contains("BEBE");
            expect(xhr.response.body.nombre).to.contains("BEBE");
        });
    });

    it('Crear agenda hoy y publicarla', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
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
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('14');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('15');
        cy.get('plex-select[name="modelo.tipoPrestaciones"] input').type('consulta de medicina general{enter}');
        cy.route('GET', '**/api/core/tm/profesionales**').as('profesional')
        cy.get('plex-select[name="modelo.profesionales"] input').type('huenchuman natalia', {
            force: true
        });
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="modelo.profesionales"] input').type('{enter}', {
                force: true
            });
        });
        cy.get('plex-int[name="cantidadTurnos"] input').type('4');
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type('4');
        cy.wait(1000);
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=**').as('filtroAgendas');
        cy.get('plex-button[label="Guardar"]').click();

        // // publico la agenda
        cy.wait('@filtroAgendas').then(() => {
            cy.get('table tbody tr').find('td').contains('14:00 a 15:00 hs').parent().parent().as('fila');
            cy.get('@fila').find('td').eq(2).should('contain', 'Huenchuman, Natalia').click();
            // cy.get('@fila').find('td').eq(3).find('badge').should('contain', 'EN PLANIFICACIÓN').click();
            // cy.get('table tbody div').contains('Huenchuman, Natalia').and('14:00 a 15:00 hs').click();
            cy.get('botones-agenda plex-button[title="Publicar"]').click();
            cy.get('button').contains('CONFIRMAR').click();
        });
    })

    it.skip('dar turno de día', () => { // TODO: no encuentra agenda para los filtros ingresados por mas que se cree en el caso de prueba anterior
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();

        cy.route('GET', '**/api/core/mpi/pacientes?type=multimatch&cadenaInput=12325484').as('consultaPaciente');
        cy.get('paciente-buscar input').first().type('12325484');
        cy.wait('@consultaPaciente').then(() => {
            cy.get('table tbody').contains('12325484').click();
        });
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.get('plex-select[placeholder="Tipos de Prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click();

        cy.get('div[class="dia"]').contains(Cypress.moment().format('D')).click({
            force: true
        });
        cy.get('dar-turnos div').contains('13:30').click();
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se le dio el turno
        cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');
    });

    it.skip('Crear agenda semana próxima y publicarla', () => { // TODO: no aparece el boton de guardar cuando se ejecuta desde consola $npx cypress run --browser chrome --spec [url this spec]
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
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
        cy.get('plex-select[name="modelo.profesionales"] input').type('prueba usuario', {
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
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('botonAgenda');
        cy.get('table tbody div').contains('USUARIO, PRUEBA').click({
            force: true
        });

        cy.wait('@botonAgenda').then(() => {
            cy.get('botones-agenda plex-button[title="Publicar"]').click();
            cy.get('button').contains('CONFIRMAR').click();
        });
    })

    it.skip('Crear solicitud diferente profesional y prestación, misma organización', () => { // TODO: Hay que sacar el wizard
        cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
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

    it.skip('Crear solicitud autocitado', () => { // TODO: no encuentra pacienteSearch
        cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
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