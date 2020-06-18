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
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/log/paciente?idPaciente=**').as('seleccionPaciente');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
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
        cy.route('GET', '/api/modules/obraSocial/obraSocial/**', []).as('version');
        cy.plexText('name=buscador', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(paciente.documento).click();
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

        cy.route('GET', '/api/modules/obraSocial/obraSocial/**', []).as('puco');
        cy.route('GET', '/api/modules/obraSocial/prepagas/**', []).as('prepagas');
        cy.plexText('name=buscador', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(paciente.documento).click();
        cy.plexButtonIcon('cellphone-android').click();
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}prueba@prueba.com');
        cy.plexPhone('name="celular"', '{selectall}{backspace}2995290357');
        cy.plexButton('Activar App Mobile').click();
        cy.swal('confirm')
    })

    it('editar datos de contacto', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getHistorial');
        cy.route('GET', '**/api/core/log/paciente?**').as('getLog');
        cy.route('GET', '**/api/modules/obraSocial/obraSocial/**').as('getObraSocial');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/localidades?**').as('getLocalidades');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getProvincias');


        cy.route('GET', '**/api/core/tm/barrios?**').as('getBarrios');
        cy.route('PUT', '**/api/core/mpi/pacientes/**').as('guardar');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(paciente.documento).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getHistorial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLog').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getObraSocial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrepagas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getLocalidades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });


        cy.wait('@getPaises').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getProvincias').then((xhr) => {
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

        cy.toast('success', 'Los cambios han sido guardados');
    });

    it('dar asistencia y quitarla', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?**').as('getTurnos');
        cy.route('GET', '**/api/core/log/paciente?**').as('getLog');
        cy.route('GET', '**/api/modules/obraSocial/obraSocial/**').as('getObraSocial');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/provincias**').as('getProvincias');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(paciente.documento).click();

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

        cy.toast('success', 'Se registro la asistencia del paciente');

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

        cy.toast('alert', 'Se registro la inasistencia del paciente');

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
        cy.route('GET', '**/api/modules/obraSocial/obraSocial/**').as('getObraSocial');
        cy.route('GET', '**/api/core/tm/paises?**').as('getPaises');
        cy.route('GET', '**/api/modules/obraSocial/prepagas**').as('getPrepagas');
        cy.route('GET', '**/api/core/tm/provincias**').as('getProvincias');
        cy.route('GET', '**/api/core/tm/provincias?**').as('getNeuquen');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('getTurnosAgenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(paciente.documento).click();

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

        cy.toast('success', 'El turno seleccionado fue liberado');

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

    it('Historial', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/*').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?*').as('getTurnos');

        cy.plexText('name="buscador"', paciente.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado').find('td').contains(paciente.documento).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
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
        cy.route('GET', '**/api/core/mpi/pacientes/*').as('getPaciente');
        cy.route('GET', '**/api/modules/turnos/historial?*').as('getTurnos');
        cy.route('PATCH', '**/api/core/mpi/pacientes/*').as('carpetaNueva');
        cy.route('POST', '**/api/modules/carpetas/incrementarCuenta').as('incrementaCarpeta');

        cy.plexText('name="buscador"', paciente.documento);

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(paciente.documento).click();

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTurnos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-tabs').contains('Carpetas').click({ force: true });

        cy.wait('@getCarpetas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton("Nueva Carpeta").click();

        cy.plexText('label="Número de Carpeta"', '123');

        cy.plexButton("Guardar").click();

        cy.wait('@carpetaNueva').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@incrementaCarpeta').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Nuevo número de carpeta establecido');

    });

    it('Editar direccion del paciente', () => {
        cy.route('GET', '**/api/core/mpi/pacientes/*').as('getPaciente');
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('PUT', '**/api/core/mpi/pacientes/**').as('guardar');


        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(paciente.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(paciente.nombre);
        });

        cy.get('paciente-listado').find('td').contains(paciente.documento).click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq(paciente.apellido);
            expect(xhr.response.body.nombre).to.be.eq(paciente.nombre);
        });

        //Esta mal el formato que viene por defecto por eso se modifica el numero de telefono
        cy.plexPhone('label="Número"', '{selectall}{backspace}2222222222');
        cy.plexText('name="divValor"', '{selectall}{backspace}Avenida Las Flores 1200');
        cy.plexButton("Guardar").click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.direccion[0].valor).to.be.eq("Avenida Las Flores 1200");
        });
    });

    ['validado', 'temporal'].forEach((type, i) => {

        it('Verificar obra social de un paciente ' + type, () => {

            cy.route('GET', '**/api/core/mpi/pacientes/*').as('getPaciente');

            cy.plexText('name="buscador"', pacientes[i].documento);

            cy.wait('@busquedaPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('paciente-listado').find('td').contains(pacientes[i].documento).click();

            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-label').contains('MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES');

        });

        it('Sacar turno y seleccionar prepaga ' + type, () => {
            cy.route('GET', '**/api/core/mpi/pacientes/*').as('getPaciente');
            cy.route('GET', '**/api/modules/turnos/historial?*').as('getHistorial');
            cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
            cy.route('GET', '**/api/modules/carpetas/carpetasPacientes?**').as('getCarpetas');
            cy.route('GET', '**/api/modules/turnos/agenda?**').as('getAgendas');
            cy.route('GET', '**/api/modules/turnos/agenda/**').as('getAgenda');

            cy.plexText('name="buscador"', pacientes[i].documento);

            cy.wait('@busquedaPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('paciente-listado').find('td').contains(pacientes[i].documento).click();

            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-label').contains('MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES');

            cy.plexButtonIcon('calendar-plus').click();
            cy.wait('@getPaciente').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.wait('@getPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.wait('@getCarpetas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.plexSelectAsync('name="tipoPrestacion"', 'servicio de neumonología', '@prestaciones', 0);

            cy.wait('@getAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('div[class="dia"]').contains(Cypress.moment().format('D')).click();
            cy.wait('@getAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();
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
            cy.get('mat-radio-button').contains('Prepaga').click({ force: true });
            cy.plexSelectType('label="Seleccione una Prepaga"', 'swiss medical').click({ force: true });

        });
    });
})