/// <reference types="Cypress" />
// Realiza las pruebas del camino básico: crear paciente, agendas, dar turno del dia, profesional, programado (crea solicitudes)
context('turnos', () => {
    let token;
    let validado1;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente', {
                template: 'validado'
            }).then(p => {
                validado1 = p;
            });
            cy.task('database:seed:agenda', {
                profesionales: '58f74fd3d03019f919e9fff2',
                estado: 'publicada',
                fecha: 0
            });
        })
    })

    beforeEach(() => {
        cy.goto('/citas/punto-inicio', token);
    });

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

        cy.plexText('label="Apellido"', 'apellidoBebe12');

        cy.plexText('label="Nombre"', 'nombreBebe12');

        cy.plexSelectType('label="Seleccione sexo"', 'masculino');

        cy.plexDatetime('label="Fecha de Nacimiento"', cy.today());

        // Se completa datos
        cy.plexText('name="buscador"', validado1.documento);

        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se selecciona el progenitor 
        cy.get('paciente-listado').contains(validado1.nombre).click();

        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        // Se actualizan los datos del domicilio
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

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

        cy.plexSelectType('label="Seleccione sexo"', 'masculino');

        // Se completa datos de contacto
        cy.contains('datos de contacto').click()
        cy.plexSelect('label="Tipo"', 'fijo');
        cy.plexPhone('label="Número"', '2994351614');

        // Se agrega nuevo contacto
        cy.plexButtonIcon('plus').click();

        cy.get('plex-select[label="Tipo"]').eq(1).children().children('.selectize-control').click()
            .find('div[data-value="email"]').click();

        cy.plexText('label="Dirección"', 'mail@ejemplo.com');

        // Se completa los datos de domicilio

        cy.plexBool('name="viveProvActual"', true);

        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'Alta barda');

        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        cy.get('plex-button[icon="map-marker"]').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan los cambios
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
        cy.wait('@sinDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.have.length(0);
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

        cy.plexSelectType('label="Seleccione sexo"', 'masculino');

        // Se completa datos de contacto
        cy.contains('datos de contacto').click()
        cy.plexPhone('label="Número"', '2991489753');

        // Se completa los datos de domicilio
        cy.plexBool('name="viveProvActual"', true);

        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'Alta barda');

        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        cy.get('plex-button[icon="map-marker"]').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan cambios
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.wait('@conDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('79546213');
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

        cy.wait('@consultaPaciente').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.length).to.be.gte(1);
        });
        cy.get('paciente-listado plex-item').contains(formatDocumento(validado1.documento)).click();
        cy.plexButtonIcon('calendar-plus').click();

        cy.wait('@getCarpetas');
        cy.wait('@getPrestaciones');

        cy.plexSelectAsync('placeholder="Tipos de Prestación"', 'consulta con médico general', '@getPrestaciones', 0);

        cy.wait('@getAgendas');

        cy.plexSelectAsync('placeholder="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesional', 0);

        cy.wait('@getAgendas').then(() => {
            cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
        });

        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();

        cy.plexButton('Confirmar').click();

        cy.wait('@confirmarTurno').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('info', 'El turno se asignó correctamente');
    });


    function formatDocumento(documentoPac) {
        // armamos un documento con puntos como se muestra en la lista de pacientes
        if (documentoPac) {
            return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
        }
        return documentoPac;
    }


    function format(s) {
        return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
    }
})