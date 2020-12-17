/// <reference types="Cypress" />

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente');
    const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
    cy.get('paciente-listado plex-item').contains(documento).click();
}

describe('TOP: Liberar turno', () => {
    let token, dni;
    const pasadoManiana = Cypress.moment().add(2, 'days');

    before(() => {
        cy.seed();
        cy.task('database:seed:agenda', {
            inicio: '1',
            fin: '3',
            fecha: 2,
            profesionales: '5d02602588c4d1772a8a17f8',
            tipoPrestaciones: '598ca8375adc68e2a0c121b8',
            tipo: 'gestion'
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('apps/solicitud/paciente-nueva-solicitud', token);
            dni = "2006890";
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('GET', '**/api/core-v2/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('tipoPrestacion');
        cy.route('GET', '**/api/modules/top/reglas?**').as('reglas');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgenda');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes?**').as('getSolicitudes');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchSolicitud');
        cy.route('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.route('POST', '**/api/auth/file-token').as('file-token');

        cy.goto('/solicitudes', token);
        cy.plexButton("Nueva Solicitud").click();
    });

    it('controlar estado de turno de solicitud liberado', () => {

        let idPrestacion;

        // <! -- CREAR SOLICITUD
        seleccionarPaciente(dni);

        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de medicina general', '@tipoPrestacion', 0);
        cy.wait('@reglas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexSelect('label="Organización origen"', 0).click();
        cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click({ force: true });
        cy.plexSelectAsync('label="Profesional solicitante"', 'NATALIA HUENCHUMAN', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click({ force: true });
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
            expect(xhr.response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
            expect(xhr.response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success');
        cy.wait('@getSolicitudes');

        cy.plexButtonIcon('lock-alert').click({ force: true });
        cy.wait('@file-token').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.plexButton("Aceptar").click({ force: true });
        cy.plexTextArea('name="observaciones"', 'prueba de observacion')
        cy.plexButton("Confirmar").click({ force: true });
        cy.wait('@patchSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[0].tipo).to.be.eq('auditoria');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('pendiente');
            expect(xhr.response.body.solicitud.historial[0].accion).to.be.eq('creacion');
            expect(xhr.response.body.solicitud.historial[1].accion).to.be.eq('pendiente');
            expect(xhr.response.body.solicitud.historial[1].observaciones).to.be.eq('prueba de observacion');
        });
        // CREAR SOLICITUD -->

        // <!-- ASIGNAR TURNO
        cy.plexButtonIcon('calendar-plus').click();
        // cy.get('i.adi-calendar-plus').click({ force: true });

        cy.wait('@getAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.wait('@getAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        if (pasadoManiana > Cypress.moment().endOf('month') || cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@getAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200)
            });
        }
        cy.get('div[class="dia"]').contains(pasadoManiana.format('D')).click({ force: true });
        cy.get('dar-turnos div[class="text-center hover p-2 mb-3 outline-dashed-default"]').first().click({ force: true });
        cy.plexButton("Confirmar").click({ force: true });
        cy.wait('@patchSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[0].tipo).to.be.eq('auditoria');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('pendiente');
            expect(xhr.response.body.solicitud.historial[2].accion).to.be.eq('asignarTurno');
        });

        // ASIGNAR TURNO -->

        // <! -- LIBERAR TURNO
        cy.goto('/citas/gestor_agendas', token);
        cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + pasadoManiana.format('DD/MM/YYYY'));
        cy.get('table tbody td').first().click({ force: true });
        cy.wait('@getAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].profesionales[0].apellido).to.be.eq('Huenchuman');
            expect(xhr.response.body[0].profesionales[0].nombre).to.be.eq('Natalia');
        });
        cy.wait(2000);
        cy.get('table tbody td').contains('DNI 2006890').click({ force: true });
        cy.plexButtonIcon('account-off').click({ force: true });
        cy.plexButton('Liberar').click();
        cy.goto('/solicitudes', token);

        cy.get('span.badge-info').contains('pendiente');
        cy.get('plex-item').contains('Huenchuman, Natalia').click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('historial-solicitud .item-list').should('length', 4);
        cy.get('historial-solicitud').contains('Turno liberado por Natalia Huenchuman');
        // <! -- LIBERAR TURNO
    });
});