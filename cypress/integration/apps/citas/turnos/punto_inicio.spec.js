context('punto de inicio', () => {
    let token;
    const DNI = '20000000';
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal.json', token).then(r => {
                cy.createAgendaPaciente('agenda-turno-paciente.json', 0, 0, 2, r.body._id, token);
                cy.createAgendaPaciente('agenda-turno-paciente.json', 0, 4, 6, r.body._id, token);
            });
        });
    });

    beforeEach(() => {
        cy.viewport(1280, 720);
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
        cy.darTurno('**api/core/mpi/pacientes/57f3b5d579fe79a598e6281f', token);
    });

    it('generar solicitud', () => {
        cy.route('GET', '**api/modules/rup/prestaciones/solicitudes?idPaciente=**').as('generarSolicitudPaciente');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');
        cy.plexText('name=buscador', DNI);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(DNI).click();
        cy.wait('@seleccionPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('open-in-app').click();
        cy.wait('@generarSolicitudPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('lista-solicitud-turno-ventanilla').plexButton('Cargar Solicitud nueva').click();
    });

    it('activar app mobile', () => {
        cy.route('GET', '**api/core/mpi/modules/mobileApp/check/**', {
            "message": "account_doesntExists",
            "account": null
        }).as('clickActivarApp');

        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('puco');
        cy.route('GET', '/api/modules/obraSocial/prepagas/**', []).as('prepagas');
        cy.plexText('name=buscador', DNI);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(DNI).click();
        cy.plexButtonIcon('cellphone-android').click();
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}prueba@prueba.com');
        cy.plexText('placeholder="Celular"', '{selectall}{backspace}2995290357');
        cy.plexButton('Activar App Mobile').click();
        cy.swal('confirm')
    })

    it('editar datos de contacto', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getTurnos');
        cy.route('GET', '**/api/core/log/paciente?**').as('getLog');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('getObraSocial');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/provincias**').as('getProvincias');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('GET', '**/api/core/tm/localidades**').as('provincia');
        cy.route('GET', '**/api/core/tm/barrios**').as('localidad');
        cy.route('PUT', '**/api/core/mpi/pacientes/**').as('guardar');

        cy.plexText('name="buscador"', DNI);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(DNI).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getObraSocial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPaises').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrepagas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getProvincias').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getNeuquen').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexPhone('label="Número"', '2990000000');
        cy.plexText('label="Dirección"', 'Avenida Las Flores 1200');

        cy.plexSelectType('label="Provincia"', 'Neuquén');
        cy.wait('@provincia').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectType('label="Localidad"', 'Neuquén');
        cy.wait('@localidad').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton("Guardar").click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.contains('Los cambios han sido guardados');
    });

    it('dar asistencia y quitarla', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getTurnos');
        cy.route('GET', '**/api/core/log/paciente?**').as('getLog');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('getObraSocial');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/provincias**').as('getProvincias');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', DNI);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(DNI).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getObraSocial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPaises').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrepagas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-tabs').contains('Turnos').click({ force: true });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('li[class="list-group-item"]').find('div[class=" list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Dar Asistencia").click();

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.contains('Se registro la asistencia del paciente');

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('li[class="list-group-item"]').find('div[class=" list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Quitar Asistencia").click({ force: true });

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.contains('Se registro la inasistencia del paciente');

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('liberar turno', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getTurnos');
        cy.route('GET', '**/api/core/log/paciente?**').as('getLog');
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('getObraSocial');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/provincias**').as('getProvincias');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('getTurnosAgenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', DNI);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(DNI).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getObraSocial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPaises').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrepagas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-tabs').contains('Turnos').click({ force: true });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('li[class="list-group-item"]').find('div[class=" list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Liberar Turno").click({ force: true });

            cy.wait('@getTurnosAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

        cy.plexButton("Liberar").click();

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

    });
})