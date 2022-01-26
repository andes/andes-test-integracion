context('punto de inicio', () => {
    let token;
    // const = '36425896';
    let pacientes = [];
    let paciente;
    let turno;
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente', { template: 'validado' }).then(p => {
                paciente = p;
                // Se crea una agenda del día con el paciente creado
                cy.task('database:seed:agenda', { pacientes: p._id, profesionales: '5c82a5a53c524e4c57f08cf3' });
                // Se crea agenda para un día anterior con el paciente creado para verificar el historial
                cy.task('database:seed:agenda', { pacientes: p._id, profesionales: '5c82a5a53c524e4c57f08cf3', fecha: -1 }).then(agenda => {
                    turno = agenda.bloques[0].turnos[0].horaInicio; // Se queda con la horaInicio del primer turno para luego verificar historial
                });
            });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'andes', apellido: 'paciente', documento: 123456789 }).then(p => { pacientes.push(p) });
            cy.task('database:create:paciente', { template: 'temporal', nombre: 'andes', apellido: 'temporal', documento: 987654321 }).then(p => { pacientes.push(p) });
            cy.task('database:seed:agenda', { tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', profesionales: '5d49fa8bb6834a1d95e277b8', inicio: '20', fin: '22' });
        });

    });

    beforeEach(() => {

        cy.server();
        cy.goto('/citas/punto-inicio', token);
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');
    })

    it('Buscar paciente inexistente', () => {
        cy.plexText('name="buscador"', '12362920');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.alert.alert-danger').should('contain', 'No se encontró ningún paciente..');
    });

    it('Generar solicitud', () => {
        cy.route('GET', '**api/modules/rup/prestaciones/solicitudes?idPaciente=**').as('generarSolicitudPaciente');
        cy.plexText('name=buscador', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();
        cy.plexButtonIcon('open-in-app').click();
        cy.wait('@generarSolicitudPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('lista-solicitud-turno-ventanilla').plexButton('Cargar Solicitud nueva').click();
        });
    });

    it('activar app mobile', () => {
        cy.route('PATCH', '**api/core-v2/mpi/pacientes/**').as('patchPaciente');
        cy.route('POST', '**api/modules/mobileApp/create/**').as('clickActivarApp');
        cy.route('GET', '**api/modules/mobileApp/email/**').as('verificarEmail');

        cy.route('GET', '**api/modules/mobileApp/check/**', {
            "message": "account_doesntExists",
            "account": null
        }).as('activarApp');

        cy.route('GET', '/api/modules/obraSocial/prepagas/**', []).as('prepagas');
        cy.plexText('name=buscador', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();
        cy.plexButtonIcon('cellphone-android').click();
        cy.wait('@activarApp');
        cy.plexPhone('name="celular"', '{selectall}{backspace}2995290357');
        cy.plexText('name="email"', '{selectall}{backspace}prueba@prueba.com');
        cy.wait('@verificarEmail').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.plexBadge('Su dirección ha sido validada, puede iniciar el proceso de activación');
        cy.plexButton('Activar app').click();
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            if (typeof xhr.responseBody === 'object') {
                expect(xhr.responseBody.message).to.be.eq("OK");
            }
        });
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexBadge('Cuenta pendiente de activación por el usuario');
    })

    it('editar datos de contacto', () => {
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getHistorial');


        cy.route('GET', '**/api/core/tm/barrios?**').as('getBarrios');
        cy.route('PATCH', '**/api/core-v2/mpi/pacientes/**').as('guardar');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexPhone('label="Número"', '{selectall}{backspace}2990000000');
        cy.plexText('label="Dirección actual"', 'Avenida Las Flores 1200');

        cy.plexSelectType('label="Provincia"', 'Neuquén');

        cy.plexSelect('label="Localidad"').find('.remove-button').click();

        cy.plexSelectType('label="Localidad"', 'Neuquén');
        cy.wait('@getBarrios').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton("Guardar").click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success');
    });

    it('dar asistencia y quitarla', () => {
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-tabs').contains('Turnos').click({ force: true });

        cy.get('li[class="list-group-item"]').find('div[class="list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Dar Asistencia").click();

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Se registro la asistencia del paciente');


        cy.get('li[class="list-group-item"]').find('div[class="list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Quitar Asistencia").click({ force: true });

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('alert', 'Se registro la inasistencia del paciente');

    });

    it('liberar turno', () => {
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('getTurnosAgenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });



        cy.get('plex-tabs').contains('Turnos').click({ force: true });


        cy.get('li[class="list-group-item"]').find('div[class="list-group-item-text"]').find('div[class="row"]')
            .find('div[class="col-md-12"]').eq(1).plexButton("Liberar Turno").click({ force: true });

        cy.wait('@getTurnosAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton("Liberar").click();

        cy.toast('success', 'El turno seleccionado fue liberado');

        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });



    });

    it('Historial', () => {
        cy.route('GET', '**/api/core-v2/mpi/pacientes/*').as('getPaciente');

        cy.plexText('name="buscador"', paciente.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });


        cy.get('plex-tabs').contains('Historial').click({ force: true });

        cy.get('li[class="list-group-item"]').plexBadge('ASIGNADO');

        cy.get('li[class="list-group-item"]').contains(Cypress.moment(turno).format('DD/MM/YYYY'));

        cy.get('li[class="list-group-item"]').contains('consulta con médico general');

        cy.get('li[class="list-group-item"]').contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
    });

    it('Carpetas', () => {
        cy.route('GET', '**api/modules/carpetas/carpetasPacientes?*').as('getCarpetas');
        cy.route('GET', '**/api/core-v2/mpi/pacientes/*').as('getPaciente');
        cy.route('PATCH', '**/api/core-v2/mpi/pacientes/*').as('carpetaNueva');
        cy.route('POST', '**/api/modules/carpetas/incrementarCuenta').as('incrementaCarpeta');

        cy.plexText('name="buscador"', paciente.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-tabs').contains('Carpetas').click({ force: true });

        cy.wait('@getCarpetas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton("registrar nueva carpeta").click();

        cy.plexText('label="Nuevo número de Carpeta"', '123');

        cy.plexButtonIcon('check').click();

        cy.wait('@carpetaNueva').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@incrementaCarpeta').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Nuevo número de carpeta establecido');

    });

    it('Editar direccion del paciente', () => {
        cy.route('GET', '**/api/core-v2/mpi/pacientes/*').as('getPaciente');
        cy.route('PATCH', '**/api/core-v2/mpi/pacientes/**').as('guardar');


        cy.plexText('name="buscador"', paciente.documento);

        cy.get('paciente-listado plex-item').contains(formatDocumento(paciente.documento)).click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq(paciente.apellido);
            expect(xhr.response.body.nombre).to.be.eq(paciente.nombre);
        });

        //Esta mal el formato que viene por defecto por eso se modifica el numero de telefono
        cy.plexPhone('label="Número"', '{selectall}{backspace}2996333222');
        cy.plexText('name="divValor"', '{selectall}{backspace}Avenida Las Flores 1200');
        cy.plexButton("Guardar").click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.direccion[0].valor).to.be.eq("Avenida Las Flores 1200");
        });
    });

    ['validado', 'temporal'].forEach((type, i) => {


        it('Verificar obra social de un paciente ' + type, () => {
            cy.route('GET', '**/api/core-v2/mpi/pacientes/*').as('getPaciente');

            cy.plexText('name="buscador"', pacientes[i].documento);

            cy.get('paciente-listado plex-item').contains(formatDocumento(pacientes[i].documento)).click();
            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-label').contains('MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES');

        });

        it('Sacar turno y seleccionar prepaga ' + type, () => {
            cy.route('GET', '**/api/core-v2/mpi/pacientes/*').as('getPaciente');
            cy.route('GET', '**/api/modules/turnos/historial?*').as('getHistorial');
            cy.route('GET', '**/api/modules/carpetas/carpetasPacientes?**').as('getCarpetas');
            cy.route('GET', '**/api/modules/turnos/agenda?**').as('getAgendas');
            cy.route('GET', '**/api/modules/turnos/agenda/**').as('getAgenda');
            cy.route('GET', '**/api/modules/obraSocial/prepagas/**').as('prepagas');
            cy.route('GET', '**/api/core/tm/conceptos-turneables**').as('conceptoTurneables');

            cy.plexText('name="buscador"', pacientes[i].documento);

            cy.get('paciente-listado plex-item').contains(formatDocumento(pacientes[i].documento)).click();

            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-label').contains('MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES');

            cy.plexButtonIcon('calendar-plus').click();
            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.wait('@getCarpetas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.plexSelectAsync('name="tipoPrestacion"', 'servicio de neumonología', '@conceptoTurneables', 0);

            cy.wait('@getAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('div[class="dia"]').contains(Cypress.moment().format('D')).click();
            cy.wait('@getAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-card').eq(i).click();
            cy.plexButton('Confirmar').click();
            cy.wait('@getAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.wait('@confirmarTurno').then(xhr => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.profesionales[0].nombre).to.be.eq('ALICIA BEATRIZ');
                expect(xhr.response.body.profesionales[0].apellido).to.be.eq('ESPOSITO');
            });
            cy.wait(1000);
            cy.get('plex-radio').contains('Prepaga').click({ force: true });
            cy.plexSelectType('label="Seleccione una Prepaga"', 'swiss medical').click({ force: true });

        });
    });

    function formatDocumento(documentoPac) {
        // armamos un documento con puntos como se muestra en la lista de pacientes
        if (documentoPac) {
            return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
        }
        return documentoPac;
    }
});