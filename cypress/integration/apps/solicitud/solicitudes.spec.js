/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente');
    cy.get('paciente-listado').find('td').contains(dni).click();
}

const rupBuscador = [
    {
        "conceptId": "511000013109",
        "term": "consulta de pediatría",
        "fsn": "consulta de pediatría",
        "semanticTag": "procedimiento"
    }
]

context('TOP', () => {
    let token;
    let paciente;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.task('database:seed:agenda', { tipoPrestaciones: '59ee2d9bf00c415246fd3d6b', fecha: 2, profesionales: '5c82a5a53c524e4c57f08cf3', estado: 'disponible', tipo: 'profesional' });
            cy.task('database:create:paciente', {
                template: 'validado'
            }).then(p => {
                paciente = p;
            });
        })
    })

    beforeEach(() => {
        cy.goto('/solicitudes', token);
    })

    it('crear nueva regla solicitud', () => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglasOrganizacionDestino');
        cy.route('GET', '**/api/core/tm/organizaciones').as('getOrganizaciones');
        cy.route('POST', '**/api/modules/top/reglas').as('guardarRegla');

        cy.get('plex-button[label="Reglas"]').click();

        cy.wait('@getPrestaciones');

        cy.plexSelectType('label="Prestación Destino"', 'colonoscopia');

        cy.wait('@getReglasOrganizacionDestino').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('name="organizacion"', 'hospital dr. horacio heller', '@getOrganizaciones', 0);

        cy.plexButtonIcon('plus').click();

        cy.plexSelectAsync('name="prestacionOrigen"', 'consulta de medicina general', '@getPrestaciones', 0);

        cy.get('div[class="row"]').find('div[class="col-6 h-100"]').eq(1).plexButtonIcon('plus').click();

        cy.plexButton('Guardar').click();

        cy.wait('@guardarRegla').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Las reglas se guardaron correctamente');
    })

    it('crear solicitud de entrada', () => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('paciente-buscar plex-text[name="buscador"] input').first().type('32589654');
        cy.wait('@consultaPaciente');
        cy.get('table tbody').contains('32589654').click();

        cy.get('a[class="introjs-button introjs-skipbutton introjs-donebutton"]').click();

        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('plex-select[label="Tipo de Prestación Solicitada"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="5a26e113291f463c1b982d98"]').click({
            force: true
        });

        cy.wait('@getReglas');
        cy.get('plex-select[name="organizacionOrigen"] input').type('hospital dr. horacio heller{enter}');
        cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('consulta de medicina general{enter}');
        cy.get('plex-select[name="profesionalOrigen"] input').type('cortes jazmin');
        cy.wait('@getProfesional');
        cy.get('plex-select[name="profesionalOrigen"] input').type('{enter}');

        cy.get('plex-select[name="profesional"] input').type('natalia huenchuman');
        cy.wait('@getProfesional');
        cy.get('plex-select[name="profesional"] input').type('{enter}');
        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });
    })

    it('crear solicitud de salida', () => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/top/reglas?organizacionOrigen=**').as('getReglasOrganizacionOrigen');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');

        cy.plexTab('Solicitudes de Salida').click();
        cy.plexButton('Nueva Solicitud').click();

        seleccionarPaciente(paciente.documento);

        //Fecha solicitud
        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"', cy.today());

        //Prestación origen
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'consulta de medicina general', '@getPrestaciones', '598ca8375adc68e2a0c121b8');

        cy.wait('@getReglasOrganizacionOrigen');

        //Profesional solicitante

        cy.plexSelectAsync('label="Profesional solicitante"', 'huenchuman natalia', '@profesionalSolicitante', '5d02602588c4d1772a8a17f8');

        //Organización destino
        cy.plexSelect('label="Organización destino"', 0).click();

        cy.wait('@getReglasOrganizacionOrigen');

        //Prestación solicitada
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', 'consulta de neurocirugía');

        // Motivo de la solicitud
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'Motivo de la solicitud de salida');

        cy.plexButton('Guardar').click();

        cy.wait('@guardarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    })

    it('crear solicitud autocitado', () => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('prestacion');
        cy.route('GET', '**/api/core/tm/profesionales?**').as('profesional');
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglasOrganizacionDestino');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('paciente-buscar plex-text[placeholder="Escanee un documento digital, o escriba un documento / apellido / nombre"] input').first().type('32589654');

        cy.wait('@busquedaPaciente');

        cy.get('table tbody td span').contains('32589654').click();
        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('plex-bool[name="autocitado"] input').check({
            force: true
        });

        // Tipo de prestación solicitada
        cy.get('plex-select[label="Tipo de Prestación Solicitada"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="598ca8375adc68e2a0c121b7"]').click({
            force: true
        })

        cy.wait('@getReglasOrganizacionDestino');

        // Profesional Solicitante
        cy.get('plex-select[label="Profesional solicitante"] input').type('huenchuman natalia', {
            force: true
        });

        cy.wait('@profesional');

        cy.get('plex-select[label="Profesional solicitante"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="5d02602588c4d1772a8a17f8"]').click({
            force: true
        })

        // Motivo de la solicitud
        cy.get('textarea').last().type('Motivo Solcitud', {
            force: true
        });

        cy.get('plex-button[label="Guardar"]').click({
            force: true
        });

        cy.wait('@guardarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
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

        cy.get('app-calendario .dia').contains(Cypress.moment().add(2, 'days').format('D')).click({ force: true });

        cy.wait('@agenda').then(() => {
            cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click();
        });

        cy.plexButton('Confirmar').click();

        cy.wait('@confirmarTurno').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('info', 'El turno se asignó correctamente');
    });

    it('crear solicitud desde rup', () => {
        cy.server();

        //Stub
        cy.route(/api\/core\/term\/snomed\?search=Consulta de pediatría/, rupBuscador).as('search');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '/api/core/term/snomed/**', []).as('search');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.goto('/rup', token);

        cy.plexButton('PACIENTE FUERA DE AGENDA').click();

        cy.plexSelectType('name="nombrePrestacion"', 'consulta de clínica médica');
        seleccionarPaciente(paciente.documento);
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            if (paciente.documento) {
                expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
            }
            expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.plexButtonIcon('chevron-up').first().click();
        cy.get('rup-buscador button').contains('BUSCADOR BÁSICO ').click();
        cy.plexText('name="searchTerm"', 'Consulta de pediatría');
        cy.wait('@search').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.plexTextArea('label="Motivo"', 'motivo de la solicitud');
        cy.plexTextArea('label="Indicaciones"', 'indicaciones de la solicitud');
        cy.plexSelect('label="Organización destino"', 0).click();
        cy.plexSelectAsync('label="Profesional(es) destino"', 'huenchuman natalia', '@profesionalSolicitante', '5d02602588c4d1772a8a17f8')
        cy.plexButton('Guardar Consulta de clínica médica').click();
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            if (paciente.documento) {
                expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
            }
            expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.toast('success');
        cy.plexButton('Validar Consulta de clínica médica').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            if (paciente.documento) {
                expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
            }
            expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
        });
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