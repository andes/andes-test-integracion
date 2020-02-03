/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context('SOLICITUDES', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.task('database:seed:agenda', { tipoPrestaciones: '59ee2d9bf00c415246fd3d6b', fecha: 2, profesionales: '5c82a5a53c524e4c57f08cf3', estado: 'disponible', tipo: 'profesional' });
        })
    })

    beforeEach(() => {

            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.server();
    })

    it('crear nueva regla solicitud', () => {
        // routes
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglasOrganizacionDestino');
        cy.route('GET', '**/api/core/tm/organizaciones').as('getOrganizaciones');
        cy.route('POST', '**/api/modules/top/reglas').as('guardarRegla');
        let prestacionDestino = 'Consulta de cirugía';
        let orgOrigen = 'HOSPITAL DR. HORACIO HELLER';
        let prestacionOrigen = 'Consulta de medicina general';

        cy.plexButton('Reglas').click();

        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('label="Prestación Destino"', prestacionDestino, '@getPrestaciones', 0)
        cy.wait('@getReglasOrganizacionDestino').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('name="organizacion"', orgOrigen, '@getOrganizaciones', 0);

        cy.plexButtonIcon('plus').click();

        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('name="prestacionOrigen"', prestacionOrigen, '@getPrestaciones', 0);

        cy.get('plex-button[title="Agregar Prestación"]').click();

        cy.plexButton('Guardar').click();

        cy.wait('@guardarRegla').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].destino.organizacion.nombre).to.be.eq('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            expect(xhr.response.body[0].destino.prestacion.nombre).to.be.eq(prestacionDestino);
            expect(xhr.response.body[0].origen.organizacion.nombre).to.be.eq(orgOrigen);
            expect(xhr.response.body[0].origen.prestaciones[0].prestacion.nombre).to.be.eq(prestacionOrigen);
        });
        cy.toast('success', 'Las reglas se guardaron correctamente');
    })

    it('crear solicitud de entrada', () => {
        // routes
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tipoPrestaciones');
        cy.route('GET', '**/api/core/tm/organizaciones').as('getOrganizaciones');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');

        let prestacionSolicitada = 'Consulta de cirugía';
        let orgOrigen = 'HOSPITAL DR. HORACIO HELLER';
        let orgDest = 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON';
        let prestacionOrigen = 'Consulta de medicina general';
        let motivo = 'bla bla';
        cy.plexButton('Nueva Solicitud').click();

        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody').contains('32589654').click();

        cy.get('a[class="introjs-button introjs-skipbutton introjs-donebutton"]').click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', prestacionSolicitada, '@tipoPrestaciones', 0);

        cy.plexSelectAsync('label="Organización origen"', orgOrigen, '@getReglas', 0);

        cy.plexSelectAsync('label="Tipos de Prestación Origen"', prestacionOrigen, '@tipoPrestaciones', 0);
        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);

        cy.plexSelectAsync('label="Profesional destino"', 'a', '@getProfesional', 0);

        cy.plexTextArea('name="motivo"', motivo);
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq(motivo);
            console.log(xhr)
        });
    })

    it('crear solicitud de salida', () => {
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/top/reglas?organizacionOrigen=**').as('getReglasOrganizacionOrigen');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('tipoPrestaciones');



        let prestacionSolicitada = 'Consulta de cirugía';
        let orgOrigen = 'HOSPITAL DR. HORACIO HELLER';
        let orgDest = 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON';
        let prestacionOrigen = 'Consulta de medicina general';
        let motivo = 'bla bla';

        cy.get('plex-tabs .nav-item').contains('Solicitudes de Salida').click();
        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente');
        cy.get('table tbody').contains('32589654').click();

        cy.contains('Finalizar').click();

        //Fecha solicitud
        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));

        //Prestación origen
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', prestacionOrigen, '@tipoPrestaciones', 0);

        //Profesional solicitante
        cy.plexSelectAsync('label="Profesional solicitante"', 'huenchuman natalia', '@getProfesional', 0);

        //Organización destino

        cy.plexSelectAsync('label="Organización destino"', orgDest, '@getReglasOrganizacionOrigen', 0);



        //Prestación solicitada

        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', prestacionSolicitada, '@getReglasOrganizacionOrigen', 0);


        // Motivo de la solicitud
        cy.plexTextArea('name="motivo"', motivo);

        cy.plexButton('Guardar').click();

        cy.wait('@guardarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);//datos que faltan revisar en api post
            expect(xhr.response.body.solicitud.organizacionOrigen.nombre).to.be.eq('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            expect(xhr.response.body.solicitud.tipoPrestacionOrigen.term).to.be.eq(prestacionOrigen);
        });
    })

    it('crear solicitud autocitado', () => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.route('GET', '**/api/core/tm/profesionales?**').as('profesional');
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglasOrganizacionDestino');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        let prestacionOrigen = 'Consulta de cirugía';
        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');

        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody td span').contains('32589654').click();
        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.contains('Finalizar').click();
        cy.plexBool('name="autocitado"', true);

        // Tipo de prestación solicitada
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', 'Consulta de cirugía');


        cy.wait('@getReglasOrganizacionDestino').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        // Profesional Solicitante
        cy.plexSelectAsync('label="Profesional solicitante"', 'Huenchuman Natalia', '@profesional', 0);


        // Motivo de la solicitud
        cy.plexTextArea('name="motivo"', 'Motivo Solicitud');

        cy.plexButton('Guardar').click();

        cy.wait('@guardarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.organizacionOrigen.nombre).to.be.eq('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            expect(xhr.response.body.solicitud.tipoPrestacionOrigen.term).to.be.eq(prestacionOrigen);
        });
        cy.toast('success', 'Solicitud guardada');
    });

    it('dar turno autocitado', () => {
        cy.createSolicitud('solicitudes/solicitudAutocitado', token);
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/turnos/agenda?**').as('agendas');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('consultaPaciente');
        cy.route('GET', '**api/modules/carpetas/carpetasPacientes**', []).as('carpetasPacientes');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('confirmarTurno');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('agenda');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes?**').as('solicitudes');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');

        cy.plexButtonIcon('chevron-down').click();
        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexSelectAsync('label="Prestación destino"', 'Consulta de clínica médica', '@getPrestaciones', 0);

        cy.plexSelectType('label="Estado"', 'pendiente');

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });


        cy.plexButtonIcon('calendar-plus').click();
        cy.wait('@consultaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@carpetasPacientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        if (Cypress.moment().add(2, 'days').format('M') > Cypress.moment().format('M')) {
            cy.plexButtonIcon('chevron-right').click();
        }

        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click({
            force: true
        });
        cy.get('plex-button[label="Confirmar"]').click();

        cy.wait('@confirmarTurno').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it.skip('crear solicitud desde rup', () => { // TODO: carga mal la prestacion
        cy.server();

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();
        cy.selectOption('name="nombrePrestacion"', '"59ee2d9bf00c415246fd3d6a"');

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.get('tr').eq(1).click()
        cy.get('plex-button[label="INICIAR PRESTACIÓN"]').click();

        cy.route('GET', '**/api/modules/rup/elementosRUP').as('elementosRUP');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones').as('tipoPrestaciones');


        cy.wait('@elementosRUP').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        })
        cy.wait('@tipoPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        })
        cy.wait(2000)
        cy.get('div').then(($body) => {
            if ($body.hasClass('introjs-helperLayer')) {
                cy.get('.introjs-tooltipbuttons').children('.introjs-skipbutton').click({
                    force: true
                })
            } else { }
        })
        // cy.get('.introjs-skipbutton').should('be.visible').click({ force: true })
        cy.get('plex-text[name="searchTerm"] input').first().type('Consulta De Pediatría')

        // cy.get('.introjs-skipbutton').contains('Cerrar').click({force:true})
        cy.get('.mdi-plus').first().click();
        cy.get('textarea').first().type('ni', {
            force: true
        });
        cy.get('textarea').eq(1).type('ni', {
            force: true
        });
        cy.get('plex-select[label="Organización destino"] input').type('castro');
        cy.selectOption('label="Organización destino"', '"57e9670e52df311059bc8964"');
        cy.get('plex-select[label="Profesional(es) destino"] input').type('valverde')
        cy.get('plex-select[label="Profesional(es) destino"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="58f74fd4d03019f919ea243e"]').click({
            force: true
        })
        cy.get('plex-button').contains('Guardar Consulta de medicina general').click();
        cy.wait(3000)
        cy.get('plex-button').contains('Validar Consulta de medicina general').first().click();
        cy.get('button').contains('CONFIRMAR').click();
    })

    it('crear solicitud de entrada y verificar filtros', () => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('GET', '**/core/tm/tiposPrestaciones?turneable=1**').as('tipoPrestacion');

        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody').contains('32589654').click();

        cy.get('a[class="introjs-button introjs-skipbutton introjs-donebutton"]').click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de neurología', '@tipoPrestacion', '59ee2d9bf00c415246fd3d6d');

        cy.wait('@getReglas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexSelectAsync('label="Organización origen"', 'HOSPITAL DR. HORACIO HELLER', '@tipoPrestacion', '57fcf038326e73143fb48dac');
        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de clínica médica');
        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);
        cy.plexSelectAsync('name="profesional"', 'natalia huenchuman', '@getProfesional', 0);
        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexText('name="paciente"', 'SOLICITUD TEST');

        cy.plexSelectAsync('name="organizacion"', 'HOSPITAL DR. HORACIO HELLER', '@tipoPrestacion', '57fcf038326e73143fb48dac');
        cy.plexSelectAsync('name="prestacionDestino"', 'consulta de neurología', '@tipoPrestacion', '59ee2d9bf00c415246fd3d6d');
        cy.plexSelectType('name="estado"', 'auditoria');
        cy.get('table tbody tr td').contains('Consulta de neurología');

    })

    it('crear solicitud de entrada y auditarla', () => {
        cy.server();
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes?solicitudDesde=**').as('solicitudes');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('GET', '**/core/tm/tiposPrestaciones?turneable=1**').as('tipoPrestacion');

        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente');
        cy.get('table tbody').contains('32589654').click();

        cy.get('a[class="introjs-button introjs-skipbutton introjs-donebutton"]').click();
        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de neurología', '@tipoPrestacion', '59ee2d9bf00c415246fd3d6d');

        cy.wait('@getReglas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('label="Organización origen"', 'HOSPITAL DR. HORACIO HELLER', '@tipoPrestacion', '57fcf038326e73143fb48dac');

        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de clínica médica');

        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);


        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('name="prestacionDestino"', 'consulta de neurología', '@tipoPrestacion', '59ee2d9bf00c415246fd3d6d');

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody tr td').contains('CORTES, JAZMIN').click();
        cy.plexButtonIcon('lock-alert').first().click();
        cy.plexButton('Responder').click();
        cy.get('textarea').last().type('Una observacion', {
            force: true
        });
        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[1].observaciones).to.be.eq('Una observacion');
        });
    })
});