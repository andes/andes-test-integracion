context('punto de inicio', () => {
    let token;
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal.json', token);
        });
    });
    beforeEach(() => {
        cy.server();
        cy.goto('/citas/punto-inicio', token);
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/log/paciente?idPaciente=**').as('seleccionPaciente');
    })
    it('Buscar paciente inexistente', () => {
        cy.plexText('name="buscador"', '12362920');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.alert.alert-danger').should('contain', 'No se encontró ningún paciente..');
    });
    it('dar turno', () => {
        cy.route('GET', '**api/core/mpi/pacientes/**').as('darTurnoPaciente');
        cy.plexText('name="buscador"', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado table').find('td').contains('38906734').click();
        cy.wait('@seleccionPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('calendar-plus').click({force: true});
        cy.wait('@darTurnoPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });
    it('generar solicitud', () => {
        cy.route('GET', '**api/modules/rup/prestaciones/solicitudes?idPaciente=**').as('generarSolicitudPaciente');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');
        cy.plexText('name=buscador', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906734').click();
        cy.wait('@seleccionPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('open-in-app').click({force:true});
        cy.wait('@generarSolicitudPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('lista-solicitud-turno-ventanilla').plexButton('Cargar Solicitud nueva').click();
        // cy.plexButton('Cargar Solicitud nueva').click();
    });
    it('activar app mobile', () => {
        cy.route('GET', '**api/core/mpi/modules/mobileApp/check/**', {"message":"account_doesntExists","account":null}).as('clickActivarApp');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('puco');
        cy.route('GET', '/api/modules/obraSocial/prepagas/**', []).as('prepagas');
        cy.plexText('name=buscador', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906734').click(); 
        cy.plexButtonIcon('cellphone-android').click({force: true});
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}prueba@prueba.com');
        cy.plexText('placeholder="Celular"', '{selectall}{backspace}2995290357');
        cy.plexButton('Activar App Mobile').click();
        cy.swal('confirm')
    })
})
// Código viejo que hay que refactorizar y acomodar durante el sprint. 
// // context('Agenda dinamicas', () => {
// //     let token
// //     before(() => {
// //         cy.login('30643636', 'asd').then(t => {
// //             token = t;
// //             cy.createAgenda('apps/citas/turnos/agendaDinamicaDarTurno', 0, 0, 1, token);
// //             cy.createAgenda('apps/citas/turnos/agendaDarTurnoProgramado', 8, null, null, token);
// //         });
// //     });
// //     it('dar turno agenda dinámica', () => {
// //         cy.server();
// //         cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
// //         cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
// //         cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
// //         cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
// //         cy.goto('/citas/punto-inicio', token);
// //         cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
// //         cy.wait('@busquedaPaciente').then((xhr) => {
// //             expect(xhr.status).to.be.eq(200);
// //         });
// //         cy.get('paciente-listado').find('td').contains('38906735').click();
// //         cy.get('plex-button[title="Dar Turno"]').click();
// //         cy.wait('@prestaciones');
// //         cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
// //         cy.wait('@cargaAgendas');
// //         cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
// //         cy.get('plex-button[label="Dar Turno"]').click();
// //         cy.get('plex-button[label="Confirmar"]').click();
//         // Confirmo que se dio el turno desde la API
//         cy.wait('@darTurno').then((xhr) => {
//             expect(xhr.status).to.be.eq(200)
//         });
//     });
//     it('dar turno programado', () => {
//         cy.server();
//         cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
//         cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
//         cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
//         cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
//         cy.goto('/citas/punto-inicio', token);
//         cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
//         cy.wait('@busquedaPaciente').then((xhr) => {
//             expect(xhr.status).to.be.eq(200);
//         });
//         cy.get('paciente-listado').find('td').contains('38906735').click();
//         cy.get('plex-button[title="Dar Turno"]').click();
//         cy.wait('@prestaciones');
//         cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
//         if (Cypress.moment().add(8, 'days').month() > Cypress.moment().month()) {
//             cy.get('plex-button[icon="chevron-right"]').click();
//         }
//         cy.wait('@cargaAgendas');
//         cy.wait(1000);
//         cy.get('div[class="dia"]').contains(Cypress.moment().add(8, 'days').format('D')).click();
//         cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click({
//             force: true
//         });
//         cy.get('plex-button[label="Confirmar"]').click();
//         // Confirmo que se dio el turno desde la API
//         cy.wait('@darTurno').then((xhr) => {
//             expect(xhr.status).to.be.eq(200)
//         });
//     });
// });