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
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaProgenitor');
        cy.intercept('GET', '**api/modules/georeferencia/georeferenciar**', (req) => {
            req.headers['cache-control'] = 'no-cache'; // Forzamos la limpieza de la caché en las solicitudes.
        }).as('geoReferencia');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('consultaPaciente');
        cy.intercept('GET', '**/api/modules/carpetas/carpetasPacientes?**').as('getCarpetas');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.intercept('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables**').as('conceptoTurneables');
        cy.intercept('PATCH', '**api/core-v2/mpi/pacientes/**').as('relacionProgenitor');
        cy.intercept('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');
        cy.intercept('POST', '**api/core-v2/mpi/pacientes').as('bebeAgregado');
        cy.intercept('POST', '**api/core-v2/mpi/pacientes').as('sinDniGuardar');
        cy.intercept('POST', '**api/core-v2/mpi/pacientes**').as('conDniGuardar');
        cy.goto('/citas/punto-inicio', token);
    });

    it('registrar bebé desde punto de Inicio de Turnos', () => {
        cy.get('paciente-buscar input').first().type('4659874562');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('BEBÉ').click();

        // Se completa datos básicos
        cy.plexText('label="Apellido"', 'apellidoBebe12');
        cy.plexText('label="Nombre"', 'nombreBebe');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', cy.today());

        // Se completa datos
        cy.plexText('name="buscador"', validado1.documento);

        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
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
        cy.wait('@relacionProgenitor').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.relaciones).to.have.length(1)
        });

        // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
        cy.wait('@bebeAgregado').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.apellido).to.contains("BEBE");
            expect(response.body.nombre).to.contains("BEBE");
        });
    });

    it('registrar paciente sin dni argentino desde punto de Inicio de Turnos', () => {
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
        cy.get('plex-select[label="Tipo"]').eq(1).children().children('.selectize-control').click().find('div[data-value="email"]').click();
        cy.plexText('label="Dirección"', 'mail@ejemplo.com');

        // Se completa los datos de domicilio

        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexSelectType('name="barrio"', 'Alta barda');
        cy.plexText('name="direccion"', 'Avenida las Flores 1200');
        cy.plexButtonIcon("map-marker").click();
        cy.wait('@geoReferencia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        // Se guardan los cambios
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
        cy.wait('@sinDniGuardar').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.documento).to.have.length(0);
        });
    });

    it('registrar paciente con dni argentino desde punto de Inicio de Turnos', () => {
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
        cy.plexButtonIcon("map-marker").click();

        cy.wait('@geoReferencia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        // Se guardan cambios
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.wait('@conDniGuardar').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.documento).to.be.eq('79546213');
        });
    });

    it('dar turno de día', () => {
        cy.plexText('name="buscador"', validado1.documento);
        cy.wait('@consultaPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.length).to.be.gte(1);
        });
        cy.get('paciente-listado plex-item').contains(formatDocumento(validado1.documento)).click();
        cy.plexButtonIcon('calendar-plus').click();
        cy.wait('@getCarpetas');
        cy.plexSelectAsync('label="Tipos de Prestación"', 'consulta con médico general', '@conceptoTurneables', 0);
        cy.wait('@getAgendas');
        cy.plexSelectAsync('label="Equipo de Salud"', 'CORTES JAZMIN', '@getProfesional', 0);
        cy.wait('@getAgendas').then(() => {
            cy.wait(500);
            cy.get('app-calendario .dia').contains(Cypress.moment().date()).click({ force: true });
        });
        cy.get('plex-card').eq(0).click();
        cy.plexButton('Confirmar').click();
        cy.wait('@confirmarTurno').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.toast('success', 'El turno se asignó correctamente');
    });


    function formatDocumento(documentoPac) {
        // armamos un documento con puntos como se muestra en la lista de pacientes
        if (documentoPac) {
            return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
        }
        return documentoPac;
    }
})