describe('CITAS - Gestor Agendas', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }

        });
    })

    it('crea agenda de turnos programados', () => {
        cy.server();
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click()

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
        cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);
        cy.get('plex-button[label="Guardar"]').click();

        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('La agenda se guardó');
        cy.swal('confirm')
    });

    it('publica una agenda con turnos programados', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');
        // Se filtran las agendas por prestación
        cy.get('plex-select[label="Prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click()
        cy.wait('@get');
        cy.get('table tr').contains('En planificación').first().click();
        cy.get('plex-button[title="Publicar"]').click();
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('La agenda cambió el estado');
        cy.swal('confirm');

    });

    it('crear agenda con turnos del día y publicarla', () => {
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');
        const hoy = Cypress.moment().format('DD/MM/YYYY')

        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click()

        cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
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

    it('Crear agenda hoy y publicarla', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
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
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type(ahora.hour());
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type(ahora.add(1, 'hour').hour());

        cy.get('plex-select[name="modelo.tipoPrestaciones"] input').type('consulta de medicina general');
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[name="modelo.tipoPrestaciones"] input').type('{enter}');
        });
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
        cy.get('plex-button[label="Guardar"]').click();

        // // publico la agenda
        cy.wait('@filtroAgendas').then(() => {
            cy.get('table tbody tr').find('td').contains(`${ahora.add(-1, 'hour').format('HH')}:00 a ${ahora.add(1, 'hour').format('HH')}:00 hs`).parent().parent().as('fila');
            cy.get('@fila').find('td').eq(2).should('contain', 'Huenchuman, Natalia').click();
            cy.get('botones-agenda plex-button[title="Publicar"]').click();
            cy.get('button').contains('CONFIRMAR').click();
        });
    })

    it('crea agenda dinámica para la fecha actual', () => {

        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('get');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');

        const hoy = Cypress.moment().format('DD/MM/YYYY')
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

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
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1**').as('getPrestacion');
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
        let proximaSemana = Cypress.moment().add(7, 'days').format('DD/MM/YYYY');
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(proximaSemana);
        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('10');
        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('15');
        cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click();
        cy.get('plex-select[name="modelo.profesionales"] input').type('perez maria', {
            force: true
        });
        cy.wait('@getProfesional').then(() => {
            cy.get('plex-select[name="modelo.profesionales"] input').type('{enter}');
        });
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
        cy.server();
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
        cy.get('plex-select[name="modelo.tipoPrestaciones"]').children().children('.selectize-control').click()
            .find('.option[data-value="5b61d59968954f3e6ea84586"]').click();

        cy.get('legend').contains('Acceso Directo').should('not.be.visible');
        cy.get('legend').contains('Reservado').should('not.be.visible');
        cy.get('legend').contains('Bloque').should('be.visible');

        cy.get('plex-select[name="modelo.profesionales"] input').type('perez maria', {
            force: true
        });
        cy.wait('@getProfesional').then(() => {
            cy.get('plex-select[name="modelo.profesionales"] input').type('{enter}');
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

})