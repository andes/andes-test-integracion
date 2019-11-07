describe('CITAS - Planicar Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createProfesional('apps/citas/agendas/gestor-agendas-listado/profesional', token);
            cy.createAgenda('apps/citas/agendas/gestor-agendas-listado/agendaMedicinaGeneralPublicada', 0, 0, 1, token);
            cy.createAgenda('apps/citas/agendas/gestor-agendas-listado/agendaPlanificada', 0, 2, 3, token);
            cy.createAgenda('apps/citas/agendas/gestor-agendas-listado/agendaMedicinaGeneralAPublicar', 0, 0, 0, token);
            cy.createAgenda('apps/citas/agendaDarSobreturno', 0, 0, 1, token);
            cy.createPaciente('paciente-dinamico', token);
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.visit('/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }

        });
    })

    it('crea agenda de turnos programados y publicarla', () => {
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.selectOption('label="Tipos de prestación"', '"598ca8375adc68e2a0c121b8"');
        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);
        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('La agenda se guardó');

        cy.selectOption('label="Prestación"', '"598ca8375adc68e2a0c121b8"')
        cy.wait('@get');
        cy.wait(2000);
        cy.get('table tr').contains('En planificación').first().click();
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('La agenda cambió el estado');
        // cy.swal('confirm');
    });

    it('crear agenda con turnos del día y publicarla', () => {
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.selectOption('label="Tipos de prestación"', '"5951051aa784f4e1a8e2afe1"');

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10);
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.wait('@get');
        cy.get('table tr').contains('En planificación').first().click();
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.contains('La agenda cambió el estado');
        cy.swal('confirm');
    });

    it('crear agenda hoy y publicarla', () => {
        cy.visit('/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
        cy.route('GET', '**//api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.route('GET', '**/api/core/tm/profesionales**').as('profesional')
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=**').as('filtroAgendas');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.get('div').then(($body) => {
            if ($body.hasClass('swal2-container')) {
                cy.get('.swal2-cancel').click({
                    force: true
                })
            }
        })

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        let ahora = Cypress.moment();
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type(ahora.add(-1, 'hour').hour());
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type(ahora.add(1, 'hour').hour());

        cy.selectWrite('name="modelo.tipoPrestaciones"', 'consulta de medicina general');
        cy.wait('@prestacion').then(() => {
            cy.selectWrite('name="modelo.tipoPrestaciones"', '');
        });
        cy.selectWrite('name="modelo.profesionales"', 'huenchuman natalia');
        cy.wait('@profesional').then(() => {
            cy.selectWrite('name="modelo.profesionales"', '');
        });
        cy.get('plex-int[name="cantidadTurnos"] input').type('4');
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type('4');
        cy.wait(1000);
        cy.get('plex-button[label="Guardar"]').click();

        // // publico la agenda
        cy.wait('@filtroAgendas');
        cy.get('table tbody tr').find('td').contains(`${ahora.add(-1, 'hour').format('HH')}:00 a ${ahora.add(1, 'hour').format('HH')}:00 hs`).parent().parent().as('fila');
        cy.get('@fila').find('td').eq(2).should('contain', 'Huenchuman, Natalia').click();
        cy.get('botones-agenda plex-button[title="Publicar"]').click();
        cy.get('button').contains('CONFIRMAR').click();
    })

    it('crea agenda dinámica para la fecha actual', () => {
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');

        const hoy = Cypress.moment().format('DD/MM/YYYY')
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.selectOption('label="Tipos de prestación"', '"5951051aa784f4e1a8e2afe1"')

        cy.get('plex-bool[name="dinamica"] input[type="checkbox"]').check({
            force: true
        }).should('be.checked')

        cy.get('plex-text[name="descripcion"] input').eq(0).type('soy una descripcion', {
            force: true
        }).should('have.value', 'soy una descripcion');


        cy.get('plex-bool[name="cupo"] input[type="checkbox"]').check({
            force: true
        }).should('be.checked')

        cy.get('plex-int[name="cupoMaximo"] input').type('8').should('have.value', '8');

        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.wait('@get');

        cy.get('table tr').contains('En planificación').first().click();
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });

    it('crea agenda semana próxima y publicarla', () => {
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1**').as('getPrestacion');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/espacioFisico?activo=**').as('getEspaciosFisicos');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=**').as('getAgendas');
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

        cy.selectOption('name="modelo.tipoPrestaciones"', '"598ca8375adc68e2a0c121b8"');
        cy.selectWrite('name="modelo.profesionales"', 'perez maria');

        cy.wait('@getProfesional').then(() => {
            cy.selectWrite('name="modelo.profesionales"', '');
        });
        cy.selectWrite('name="espacioFisico"', 'aula 1 docencia');
        cy.wait('@getEspaciosFisicos');

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
        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('PEREZ, MARIA').click({
            force: true
        });

        cy.get('botones-agenda plex-button[title="Publicar"]').click();
        cy.get('button').contains('CONFIRMAR').click();
        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.contains('La agenda cambió el estado');
        cy.swal('confirm');

    })

    it('crea agenda no nominalizada', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=**').as('getAgendas');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.get('div').then(($body) => {
            if ($body.hasClass('swal2-container')) {
                cy.get('.swal2-cancel').click({
                    force: true
                })
            }
        })

        let hoy = Cypress.moment().format('DD/MM/YYYY');
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy);
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('15');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('17');
        cy.selectOption('name="modelo.tipoPrestaciones"', '"5b61d59968954f3e6ea84586"');

        cy.get('legend').contains('Acceso Directo').should('not.be.visible');
        cy.get('legend').contains('Reservado').should('not.be.visible');
        cy.get('legend').contains('Bloque').should('be.visible');
        cy.selectWrite('name="modelo.profesionales"', 'perez maria');

        cy.wait('@getProfesional').then(() => {
            cy.selectWrite('name="modelo.profesionales"', '');
        });

        cy.get('plex-button[label="Guardar"]').click({
            force: true
        });

        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('actividades con la comunidad').click({
            force: true
        });

        cy.get('botones-agenda plex-button[title="Cambiar a disponible"]').click();

        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    })



    // it('clona agenda para una fecha posterior', () => {
    //     cy.server();
    //     cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
    //     cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
    //     cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgenda');
    //     cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');

    //     // Se crea la primer agenda..
    //     cy.get('plex-button[label="Crear una nueva agenda"]').click();
    //     cy.swal('cancel');
    //     const hoy = Cypress.moment().format('DD/MM/YYYY')

    //     cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

    //     cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

    //     cy.get('plex-dateTime[name="modelo.horaFin"] input').type('0900').should('have.value', '0900');

    //     cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
    //         .find('.option[data-value="598ca8375adc68e2a0c121db"]').click({
    //             force: true
    //         });

    //     cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('PRUEBA').as('profesional');
    //     cy.wait('@getProfesional');
    //     cy.get('@profesional').type('{enter}');

    //     cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
    //     cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

    //     cy.get('plex-button[label="Guardar"]').click();

    //     cy.wait('@crear').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200)
    //     });

    //     cy.wait(1000); // Solo para observar el toast, luego se lo clickea para ocultarlo
    //     cy.get('simple-notification').children('.simple-notification').first().click();

    //     // Se crea la segunda agenda ..
    //     cy.get('plex-button[label="Crear una nueva agenda"]').click();
    //     cy.swal('cancel');
    //     const manana = Cypress.moment(new Date()).add(1, 'days').format('DD/MM/YYYY');

    //     cy.get('plex-dateTime[name="modelo.fecha"] input').type(manana).should('have.value', manana);

    //     cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

    //     cy.get('plex-dateTime[name="modelo.horaFin"] input').type('0900').should('have.value', '0900');

    //     cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
    //         .find('.option[data-value="598ca8375adc68e2a0c121db"]').click({
    //             force: true
    //         });

    //     cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('USUARIO PRUEBA').as('profesional');
    //     cy.wait('@getProfesional');
    //     cy.get('@profesional').type('{enter}');

    //     cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
    //     cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

    //     cy.get('plex-button[label="Guardar"]').click();
    //     cy.wait('@crear').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //         cy.log(xhr);
    //     });

    //     // Se obtiene la primera agenda con estado 'En planificación'        
    //     cy.get('tbody tr').find('span').contains('En planificación').first().click({
    //         force: true
    //     });

    //     // Se intenta clonar la agenda obtenida
    //     cy.get('botones-agenda').find('plex-button[title="Clonar"]').first().click();

    //     cy.get('tbody tr').children('.outline-success').first().next().click();

    //     cy.get('plex-button[label="Clonar Agenda"]').click();
    //     cy.get('button').contains('CONFIRMAR').click();
    // })

    it('clonación de agendas con y sin conflictos', () => {
        cy.createAgenda('agendasClonar/agendaOriginal', 8, null, null, token);
        cy.createAgenda('agendasClonar/agendaClonar1', 16, null, null, token);
        cy.createAgenda('agendasClonar/agendaClonar2', 17, null, null, token);
        cy.createAgenda('agendasClonar/agendaClonar3', 17, null, null, token);
        cy.createAgenda('agendasClonar/agendaClonar4', 17, null, null, token);
        cy.createAgenda('agendasClonar/agendaClonar5', 16, null, null, token);

        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/espacioFisico?activo=**').as('getEspaciosFisicos');
        cy.route('GET', '**/api/modules/turnos/agenda?fechaDesde=**').as('getAgendas');
        cy.route('POST', '**/api/modules/turnos/agenda/clonar').as('clonar');

        // cy.get('plex-button[class="mdi mdi-chevron-down"]').click(); // esta comentado porque no logro clickear el botón "Filtros avanzados"
        // cy.get('plex-button[icon="chevron-down"]').click();
        // cy.get('plex-select[label="Equipo de Salud"] input').type('perez maria');
        // cy.wait('@getProfesional');
        // cy.get('plex-select[label="Equipo de Salud"] input').type('{enter}');

        // cy.get('plex-select[label="Espacio Físico"] input').type('aula 1 docencia');
        // cy.wait('@getEspaciosFisicos');
        // cy.get('plex-select[label="Espacio Físico"] input').type('{enter}');

        let fechaAgendaOriginal = Cypress.moment().add(8, 'days');
        cy.get('plex-datetime[name="fechaDesde"] input').type('{selectall}{backspace}' + fechaAgendaOriginal.format('DD/MM/YYYY'));
        cy.get('plex-datetime[name="fechaHasta"] input').type('{selectall}{backspace}' + fechaAgendaOriginal.format('DD/MM/YYYY'));
        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('PEREZ, MARIA').click({
            force: true
        });

        cy.get('botones-agenda plex-button[title="Clonar"]').click();
        let fechaClonadaConflicto = Cypress.moment().add(17, 'days');
        if (fechaClonadaConflicto.month() > fechaAgendaOriginal.month()) {
            cy.get('plex-button[icon="chevron-right"]').click();
        }
        cy.wait('@getAgendas');

        cy.get('table td div').contains(fechaClonadaConflicto.date()).click();
        cy.get('div').contains('Agendas en conflicto');
        // cy.get(`plex-panel[ng-reflect-titulo-principal="${fechaClonadaConflicto.format('DD/MM/YYYY')} 09:00 - 11:00"]`).click({
        //     force: true
        // });
        // cy.get('li').contains('Conflicto con Equipo de Salud');
        // cy.get(`plex-panel[ng-reflect-titulo-principal="${fechaClonadaConflicto.format('DD/MM/YYYY')} 12:00 - 14:00"]`).click({
        //     force: true
        // });
        // cy.get('li').contains('Conflicto con Espacio Físico');
        // cy.get(`plex-panel[ng-reflect-titulo-principal="${fechaClonadaConflicto.format('DD/MM/YYYY')} 12:00 - 14:00"]`);


        cy.get('plex-button[label="Clonar Agenda"]').click();
        cy.contains('Seleccione al menos un día válido del calendario');
        cy.get('button').contains('Aceptar').click();

        let fechaClonadaSinConflicto = Cypress.moment().add(16, 'days');
        if (fechaClonadaSinConflicto.month() === fechaAgendaOriginal.month() && fechaClonadaConflicto.month() > fechaAgendaOriginal.month()) {
            cy.get('plex-button[icon="chevron-left"]').click();
            cy.wait('@getAgendas');
        }
        cy.get('table td div').contains(fechaClonadaSinConflicto.date()).click();
        cy.get('plex-button[label="Clonar Agenda"]').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@clonar').then((xhr) => {
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('La Agenda se clonó correctamente');
        cy.swal('confirm');
    })

    it('dar sobreturno', () => {
        let horaInicioOffset = 0;
        let horaFinOffset = 1;

        let nuevaHoraInicio = Cypress.moment().add(horaInicioOffset, 'hours');
        let nuevaHoraFin = Cypress.moment().add(horaFinOffset, 'hours');
        cy.server();
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');
        cy.route('GET', '**/api/core/mpi/pacientes?type=multimatch&cadenaInput=**').as('getPaciente');

        cy.get('plex-datetime[name="fechaHasta"] input').type('{selectall}{backspace}' + Cypress.moment().add(1, 'day').format('DD/MM/YYYY'));

        cy.selectOption('label="Prestación"', '"59ee2d9bf00c415246fd3d6a"');

        cy.wait('@getAgenda');
        cy.wait(2000);
        cy.get('table tbody div').contains('darSobreturno, prueba').click({
            force: true
        });
        // cy.wait('@getAgenda');
        // cy.get('botones-agenda plex-button[title="Publicar"]').click();
        // cy.get('button').contains('CONFIRMAR').click();
        // cy.wait('@patchAgenda');
        cy.get('botones-agenda plex-button[title="Agregar Sobreturno"]').click();

        cy.get('sobreturno paciente-buscar plex-text[name="buscador"] input').first().type('38906735');
        cy.wait('@getPaciente');
        cy.get('table td').contains('PRUEBA, PRUEBA').click();
        cy.log(`${Number(nuevaHoraInicio.format('HH'))}:00`);
        cy.log(`${Number(nuevaHoraFin.format('HH'))}:00`);

        cy.get('plex-datetime[name="horaTurno"] input').type(`${Number(nuevaHoraInicio.format('HH')) - 2}:00`);
        cy.get('div[class="form-control-feedback"]').contains(`El valor debe ser mayor a ${nuevaHoraInicio.format('HH')}:00`);

        // let horaMas2 = Number(nuevaHoraInicio.format('HH')) + 2;
        // if (horaMas2 > 23) {
        //     horaMas2 = 24 - horaMas2;
        // }

        // cy.get('plex-datetime[name="horaTurno"] input').type(`{selectall}{backspace}${horaMas2}:00`);
        // cy.get('div[class="form-control-feedback"]').contains(`El valor debe ser menor a ${nuevaHoraFin.format('HH')}:00`);

        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('Debe completar los datos requeridos');
        cy.swal('confirm');

        cy.wait(4000);
        cy.get('plex-datetime[name="horaTurno"] input').type(`{selectall}{backspace}${nuevaHoraInicio.format('HH')}:00`, {
            force: true
        });
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait(4000);
        cy.wait('@patchAgenda').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.sobreturnos).to.have.length(1);
        });
    })

    it('editar agenda publicada', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('agendaPublicada, prueba').click({
            force: true
        });
        cy.get('plex-button[title="Editar"]').click();
        cy.get('.remove-button').click();
        cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('Lopex Mario').as('profesional');
        cy.wait('@getProfesional');
        cy.get('@profesional').type('{enter}');
        cy.get('plex-select[label="Espacio Físico"]').children().children('.selectize-control').find('input').first().type('Huemul Consultorio 3 PB').as('espacio');
        cy.wait(2000);
        cy.get('@espacio').type('{enter}');
        cy.get('plex-button[label="Guardar"]').click();
        cy.get('.nombres-profesionales').contains('Lopex, Mario');
        cy.get('table tbody tr td').contains('Huemul Consultorio 3 PB (Huemul)');
    })

    it('editar agenda en planificación', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('agendaPlanificada, prueba').click({
            force: true
        });
        cy.get('plex-button[title="Editar"]').click();
        cy.swal('cancel');
        cy.get('.item[data-value="59ee2d9bf00c415246fd3d6a"] .remove-button').click();
        const manana = Cypress.moment().add(1, 'days').format('DD/MM/YYYY');
        cy.get('plex-dateTime[name="modelo.fecha"] input').type('{selectall}{backspace}' + manana);
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('{selectall}{backspace}' + '1400');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('{selectall}{backspace}' + '1900');
        cy.selectOption('name="modelo.tipoPrestaciones"', '"59ee2d9bf00c415246fd3d85"');
        cy.get('plex-select[label="Equipo de Salud"] .remove-button').click();
        cy.get('plex-select[label="Equipo de Salud"]').children().children('.selectize-control').find('input').first().type('Lopex Mario').as('profesional');
        cy.wait('@getProfesional');
        cy.get('@profesional').type('{enter}');
        cy.get('plex-button[label="Guardar"]').click();
        cy.get('plex-dateTime[label="Desde"] input').type('{selectall}{backspace}' + manana);
        cy.get('plex-dateTime[label="Hasta"] input').type('{selectall}{backspace}' + manana);
        cy.get('.nombres-profesionales').contains('Lopex, Mario');
        cy.get('.tipo-prestacion').contains('Consulta de ortopedia');
        cy.get('.datos-agenda').contains(' 14:00 a 19:00 hs - ');
    })

    it('publicar agenda en planificación', () => {
        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('agendaAPublicar, prueba').click({
            force: true
        });
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');
        cy.get('table tbody div').contains('agendaAPublicar, prueba').click({
            force: true
        });
        cy.get('.bloques-y-turnos .badge-success').contains('Publicada');
        cy.get('table tbody .bg-inverse').contains('Publicada');

    })


})