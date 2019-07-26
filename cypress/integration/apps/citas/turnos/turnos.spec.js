/// <reference types="Cypress" />
// Realiza las pruebas del camino básico: crear paciente, agendas, dar turno del dia, profesional, programado (crea solicitudes)
context('Aliasing', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        })
    })
    beforeEach(() => {
        cy.viewport(1280, 720)
    })

    it('Registrar bebé desde punto de Inicio de Turnos', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
        // Rutas para control
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
        cy.route('POST', '**api/core/mpi/pacientes').as('bebeAgregado');

        cy.get('paciente-buscar input').first().type('4659874562');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('BEBÉ').click();

        // Se completa datos básicos
        cy.get('plex-text[name="apellido"] input').first().type('apellidoBebe12').should('have.value', 'apellidoBebe12');

        cy.get('plex-text[name="nombre"] input').first().type('nombreBebe12').should('have.value', 'nombreBebe12');

        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');

        cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        // Se completa datos
        cy.get('paciente-buscar[label="Buscar"] input').first().type('38906735');

        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se selecciona el progenitor 
        cy.get('paciente-listado').find('td').contains('38906735').click();

        cy.get('plex-bool[name="noPoseeContacto"]').click();

        // Se actualizan los datos del domicilio
        cy.get('plex-bool[name="viveProvActual"]').click();
        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-button[label="Guardar"]').click();

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

    it('Registrar paciente sin dni argentino desde punto de Inicio de Turnos', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes').as('sinDniGuardar');
        cy.route('GET', '**api/modules/georeferencia/georeferenciar**').as('geoReferencia');

        // Buscador
        cy.get('plex-text input[type="text"]').first().type('1232548').should('have.value', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('SIN DNI ARGENTINO').click();

        //Se completa datos básicos
        cy.get('plex-text[name="apellido"] input').first().type('sinDni').should('have.value', 'sinDni');

        cy.get('plex-text[name="nombre"] input').first().type('paciente').should('have.value', 'paciente');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('11/06/1992').should('have.value', '11/06/1992');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        // Se completa datos de contacto
        cy.get('plex-select[ng-reflect-name="tipo-0"]').children().children('.selectize-control').click().find('div[data-value="fijo"]').click();

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994351614').should('have.value', '02994351614');

        // Se agrega nuevo contacto
        cy.get('plex-button[name="agregarContacto"]').click();

        cy.get('plex-select[ng-reflect-name="tipo-1"]').children().children('.selectize-control').click()
            .find('div[data-value="email"]').click();

        cy.get('plex-text[ng-reflect-name="valor-1"] input').first().type('mail@ejemplo.com').should('have.value', 'mail@ejemplo.com');

        // Se completa los datos de domicilio
        cy.get('plex-bool[name="viveProvActual"]').click();

        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-select[name="barrio"] input[type="text"]').type('alta barda{enter}');

        cy.get('plex-text[name="direccion"] input[type="text"]').first().type('Avenida las Flores 1200').should('have.value', 'Avenida las Flores 1200');

        cy.get('plex-button[label="Actualizar"]').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan los cambios
        cy.get('plex-button[label="Guardar"]').click();
        // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
        cy.wait('@sinDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('SINDNI');
        });
    });

    it('Registrar paciente con dni argentino desde punto de Inicio de Turnos', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes').as('conDniGuardar');
        cy.route('GET', '**api/modules/georeferencia/georeferenciar**').as('geoReferencia');

        // Buscador
        cy.get('plex-text input[type="text"]').first().type('79546213').should('have.value', '79546213');

        cy.get('div.alert.alert-danger').should('exist');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.get('plex-int[name="documento"] input').type('79546213');

        cy.get('plex-text[name="apellido"] input').first().type('Chiessa');

        cy.get('plex-text[name="nombre"] input').first().type('Mario');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('23/02/1998').should('have.value', '23/02/1998');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        // Se completa datos de contacto
        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02991489753').should('have.value', '02991489753');

        // Se completa los datos de domicilio
        cy.get('plex-bool[name="viveProvActual"]').click();

        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-select[name="barrio"] input[type="text"]').type('alta barda{enter}');

        cy.get('plex-text[name="direccion"] input[type="text"]').first().type('Avenida las Flores 1200').should('have.value', 'Avenida las Flores 1200');

        cy.get('plex-button[label="Actualizar"]').click();

        cy.wait('@geoReferencia').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        // Se guardan cambios
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@conDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq("79546213");
            expect(xhr.response.body.apellido).to.be.eq("CHIESSA");
        });

        // Se verifica que aparezca el cartel de que se creó correctamente
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('dar turno de día', () => { // TODO: no encuentra agenda para los filtros ingresados por mas que se cree en el caso de prueba anterior
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();

        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.get('paciente-buscar input').first().type('79546213');
        cy.wait('@consultaPaciente').then(() => {
            cy.get('table tbody').contains('79546213').click();
        });
        cy.get('plex-button[title="Dar Turno"]').click();
        // cy.get('plex-select[placeholder="Tipos de Prestación"]').children().children('.selectize-control').click()
        //     .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click();
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesional');
        cy.get('plex-select[placeholder="Equipo de Salud"] input').type('huenchuman natalia');
        cy.route('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('agendas');
        cy.wait('@getProfesional').then(() => {
            cy.get('plex-select[placeholder="Equipo de Salud"] input').type('{enter}');
        });
        cy.wait('@agendas').then(() => {
            cy.get('div[class="dia"]').contains(Cypress.moment().format('D')).click({
                force: true
            });
            cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();
            cy.get('plex-button[label="Confirmar"]').click();

            // Confirmo que se le dio el turno
            cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');
        });
    });

    it.skip('Crear solicitud diferente profesional y prestación, misma organización', () => { // TODO: Hay que sacar el wizard
        cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('paciente-buscar plex-text[placeholder="Escanee un documento digital, o escriba un documento / apellido / nombre"] input').first().type('12325484');
        cy.get('table tbody td span').contains('12325484').click();
        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        // Prestación Destino (solicitada)
        cy.route('GET', '**//api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('consulta de medicina general (procedimiento)', {
            force: true
        });
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[label="Tipo de Prestación Solicitada"] input').first().type('{enter}');
        });
        // Organización Origen
        cy.get('plex-select[name="organizacionOrigen"] input').type('Castro Rendon');
        cy.get('plex-select[name="organizacionOrigen"] input').type('{enter}');

        // Prestación Origen
        cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('consulta de medicina general');
        cy.wait('@prestacion').then(() => {
            cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('{enter}');

        });
        // Profesional Origen
        cy.route('GET', '**/api/core/tm/profesionales*').as('profesional')
        cy.get('plex-select[name="profesionalOrigen"] input').first().type('Perez Maria');
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="profesionalOrigen"] input').first().type('{enter}');
        });
        // Profesional Destino
        cy.get('plex-select[name="profesional"] input').type('huenchuman natalia');
        cy.wait('@profesional').then(() => {
            cy.get('plex-select[name="profesional"] input').type('{enter}');
        });

        cy.get('plex-text[name="motivo"] input').type('Motivo de la solicitud');

        cy.get('plex-button[label="Guardar"]').click();
        cy.get('div[class="simple-notification toast success"]').contains('Solicitud guardada');

    });

    // it('FUNCIONA MAL : dar turno para profesional', () => { // TODO
    //     cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
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