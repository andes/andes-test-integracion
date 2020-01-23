/// <reference types="Cypress" />
// Realiza las pruebas del camino básico: crear paciente, agendas, dar turno del dia, profesional, programado (crea solicitudes)
context('turnos', () => {
    let token;
    let validado1;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente', { template: 'validado' }).then(p => {
                validado1 = p;
            });
            cy.task('database:seed:agenda', { profesionales: '58f74fd3d03019f919e9fff2', estado: 'publicada', fecha: 0 });
        })
    })
    beforeEach(() => {
        // cy.viewport(1280, 720)

        cy.visit('/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('registrar bebé desde punto de Inicio de Turnos', () => {

        cy.server();
        // Rutas para control
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
        cy.route('POST', '**api/core/mpi/pacientes').as('bebeAgregado');

        cy.get('paciente-buscar input').first().type('4659874562');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('BEBÉ').click();

        // Se completa datos básicos

        cy.plexText('name="apellido"', 'apellidoBebe12');

        cy.plexText('name="nombre"', 'nombreBebe12');

        cy.plexSelectType('label="Sexo"', 'masculino');

        cy.plexDatetime('name="fechaNacimiento"', cy.today());

        // Se completa datos
        cy.plexText('name="buscador"', validado1.documento);

        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se selecciona el progenitor 
        cy.get('paciente-listado').find('td').contains(validado1.nombre).click();

        // cy.get('plex-bool[name="noPoseeContacto"]').click();
        cy.plexBool('name="noPoseeContacto"', true);
        // Se actualizan los datos del domicilio
        cy.plexBool('name = "viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();

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

    it('registrar paciente sin dni argentino desde punto de Inicio de Turnos', () => {
        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes').as('sinDniGuardar');
        cy.route('GET', '**api/modules/georeferencia/georeferenciar**').as('geoReferencia');

        // Buscador
        cy.get('plex-text input[type="text"]').first().type('1232548').should('have.value', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('SIN DNI ARGENTINO').click();

        //Se completa datos básicos
        cy.plexText('name="apellido"', 'sinDni');

        cy.plexText('name="nombre"', 'paciente');

        cy.plexDatetime('name="fechaNacimiento"', '11/06/1992');

        cy.plexSelectType('name="sexo"', 'masculino');

        // Se completa datos de contacto
        cy.plexSelect('label="Tipo"').find('.remove-button').click();
        cy.plexSelectType('label="Tipo"', 'Teléfono fijo');

        cy.plexPhone('label="Número"', '02994351614');

        // Se agrega nuevo contacto
        cy.plexButtonIcon('phone-plus').click();

        cy.get('plex-select[label="Tipo"]').eq(1).children().children('.selectize-control').click()
            .find('div[data-value="email"]').click();

        cy.plexText('label="Dirección"', 'mail@ejemplo.com');

        // Se completa los datos de domicilio

        cy.plexBool('name="viveProvActual"', true);

        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'Alta barda');

        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        cy.plexButton('Geolocalizar').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan los cambios
        cy.plexButton('Guardar').click();

        // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
        cy.wait('@sinDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            // expect(xhr.response.body.apellido).to.be.eq('SINDNI');
        });
    });

    it('registrar paciente con dni argentino desde punto de Inicio de Turnos', () => {
        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes**').as('conDniGuardar');
        cy.route('GET', '**api/modules/georeferencia/georeferenciar**').as('geoReferencia');

        // Buscador
        cy.plexText('name="buscador"', '79546213');

        cy.get('div.alert.alert-danger').should('exist');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.plexInt('name="documento"').type('79546213');

        cy.plexText('name="apellido"', 'Chiessa');

        cy.plexText('name="nombre"', 'Mario');

        cy.plexDatetime('name="fechaNacimiento"', '23/02/1998');

        cy.plexSelectType('name="sexo"', 'masculino');

        // Se completa datos de contacto
        cy.plexPhone('label="Número"', '02991489753');

        // Se completa los datos de domicilio
        cy.plexBool('name="viveProvActual"', true);

        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'Alta barda');

        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        cy.plexButton('Geolocalizar').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan cambios
        cy.plexButton('Guardar').click();

        cy.wait('@conDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('dar turno de día', () => {
        cy.server();
        //Rutas de control
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/modules/carpetas/carpetasPacientes?**').as('getCarpetas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');

        // cy.get('paciente-buscar input').first().type('36425896');
        cy.plexText('name="buscador"', validado1.documento);

        cy.wait('@consultaPaciente').then(() => {
            cy.get('table tbody').contains(validado1.documento).click();
        });

        cy.plexButtonIcon('calendar-plus').click();
        //Carga la prestación de la agenda
        cy.wait('@getPrestaciones');

        cy.wait('@getCarpetas');

        cy.plexSelectType('placeholder="Tipos de Prestación"', 'consulta con médico general');

        cy.plexSelectAsync('placeholder="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesional', 0);

        cy.wait('@getAgendas');

        cy.get('app-calendario .dia').contains(Cypress.moment().date()).click({ force: true });

        cy.wait('@getAgendas');

        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();

        cy.plexButton('Confirmar').click();

        cy.wait('@confirmarTurno').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('info', 'El turno se asignó correctamente');
    });

    // it.skip('Crear solicitud diferente profesional y prestación, misma organización', () => { // TODO: Hay que sacar el wizard
    //     cy.visit('/solicitudes', {
    //         onBeforeLoad: (win) => {
    //             win.sessionStorage.setItem('jwt', token);
    //         }
    //     });
    //     cy.server();

    //     cy.get('plex-button[label="Nueva Solicitud"]').click();
    //     cy.get('paciente-buscar plex-text[placeholder="Escanee un documento digital, o escriba un documento / apellido / nombre"] input').first().type('12325484');
    //     cy.get('table tbody td span').contains('12325484').click();
    //     cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));

    //     // Prestación Destino (solicitada)
    //     cy.route('GET', '**//api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
    //     cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('consulta de medicina general (procedimiento)', {
    //         force: true
    //     });
    //     cy.wait('@prestacion').then(() => {
    //         cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('{enter}');
    //     });
    //     // Organización Origen
    //     cy.get('plex-select[name="organizacionOrigen"] input').type('Castro Rendon');
    //     cy.get('plex-select[name="organizacionOrigen"] input').type('{enter}');

    //     // Prestación Origen
    //     cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('consulta de medicina general');
    //     cy.wait('@prestacion').then(() => {
    //         cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('{enter}');

    //     });
    //     // Profesional Origen
    //     cy.route('GET', '**/api/core/tm/profesionales*').as('profesional')
    //     cy.get('plex-select[name="profesionalOrigen"] input').first().type('Perez Maria');
    //     cy.wait('@profesional').then(() => {
    //         cy.get('plex-select[name="profesionalOrigen"] input').first().type('{enter}');
    //     });
    //     // Profesional Destino
    //     cy.get('plex-select[name="profesional"] input').type('huenchuman natalia');
    //     cy.wait('@profesional').then(() => {
    //         cy.get('plex-select[name="profesional"] input').type('{enter}');
    //     });

    //     cy.get('plex-text[name="motivo"] input').type('Motivo de la solicitud');

    //     cy.get('plex-button[label="Guardar"]').click();
    //     cy.get('div[class="simple-notification toast success"]').contains('Solicitud guardada');

    // });

    // it('FUNCIONA MAL : dar turno para profesional', () => { // TODO
    //     cy.visit('/solicitudes', {
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
})