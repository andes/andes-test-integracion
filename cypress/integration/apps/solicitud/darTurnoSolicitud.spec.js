
/// <reference types="Cypress" />

context('TOP: nuevo turno', () => {
    let token;
    const pasadoManiana = Cypress.moment().add(3, 'days');
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.createSolicitud('solicitudes/solicitudAutocitado', token);
            cy.createAgenda48hs('solicitudes/agendaProfesional', token);
        })
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/solicitudes', token);

        cy.route('GET', '**/api/modules/turnos/agenda?**').as('agendas');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('agenda');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes?solicitudDesde=**').as('solicitudes');
        cy.route('POST', '**/api/modules/turnos/listaEspera**').as('listaEspera');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');
    });

    it('intentar dar turno autocitado y cancelar', () => {

        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'pendiente');

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].estados[0].tipo).to.be.eq('pendiente');
            expect(xhr.response.body[0].paciente.documento).to.be.eq('32589654');
            expect(xhr.response.body[0].solicitud.profesional.nombre).to.be.eq('MARIA');
            expect(xhr.response.body[0].solicitud.profesional.apellido).to.be.eq('PEREZ');
            expect(xhr.response.body[0].solicitud.tipoPrestacion.id).to.be.eq('59ee2d9bf00c415246fd3d6b');
            expect(xhr.response.body[0].solicitud.tipoPrestacion.term).to.be.eq('Consulta de clínica médica');
        });
        cy.get('tbody td').should('contain', 'AUTOCITADO').and('contain', 'PEREZ, MARIA');
        cy.plexButtonIcon('calendar-plus').click();

        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@agendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
        }
        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('app-calendario .dia').contains(Cypress.moment().add(2, 'days').format('D')).click({ force: true });
        });

        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click({ force: true });

        cy.plexButton(' No se asigna turno ').click();
        cy.wait('@listaEspera').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.profesional.nombre).to.be.eq('MARIA');
            expect(xhr.response.body.profesional.apellido).to.be.eq('PEREZ');
        })
        cy.get('tbody td').should('contain', 'pendiente').and('contain', 'PEREZ, MARIA');
    });


    it('dar turno autocitado exitoso', () => {

        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'pendiente');

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].estados[0].tipo).to.be.eq('pendiente');
            expect(xhr.response.body[0].paciente.documento).to.be.eq('32589654');
            expect(xhr.response.body[0].solicitud.profesional.nombre).to.be.eq('MARIA');
            expect(xhr.response.body[0].solicitud.profesional.apellido).to.be.eq('PEREZ');
            expect(xhr.response.body[0].solicitud.tipoPrestacion.id).to.be.eq('59ee2d9bf00c415246fd3d6b');
            expect(xhr.response.body[0].solicitud.tipoPrestacion.term).to.be.eq('Consulta de clínica médica');
        });
        cy.get('tbody td').should('contain', 'AUTOCITADO').and('contain', 'PEREZ, MARIA');
        cy.plexButtonIcon('calendar-plus').click();

        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });


        if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@agendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
        }

        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('app-calendario .dia').contains(Cypress.moment().add(2, 'days').format('D')).click({ force: true });
        });

        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click({ force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@confirmarTurno').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.profesionales[0].nombre).to.be.eq('MARIA');
            expect(xhr.response.body.profesionales[0].apellido).to.be.eq('PEREZ');
        });
    });

});

