/// <reference types="Cypress" />

function secuencia(token) {
    cy.goto('/solicitudes', token);
    cy.wait('@getSolicitudes')
    cy.plexButton("Nueva Solicitud de Entrada").click();
}

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente')
    const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
    cy.get('paciente-listado plex-item').contains(documento).click();
}

describe('TOP: Nueva Solicitud de Entrada', () => {
    let token, dni;
    before(() => {
        cy.seed();

        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('apps/solicitud/paciente-nueva-solicitud', token);
            dni = "2006890";
        });
    })

    beforeEach(() => {
        cy.intercept('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('conceptosTurneables');
        cy.intercept('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.intercept('PATCH', '**/modules/rup/prestaciones/**').as('patchSolicitud');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('searchPaciente');
        cy.intercept('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.intercept('GET', '**/modules/rup/prestaciones/solicitudes**').as('getSolicitudes');
        secuencia(token);
    });

    it('nueva solicitud exitosa', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de esterilidad', '@conceptosTurneables', 0);
        cy.plexSelect('label="Organización origen"', 0).click();
        cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.paciente.documento).to.be.eq(dni);
            expect(response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success', 'Solicitud guardada');
    });

    it('nueva solicitud autocitada exitosa', () => {
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexBool('label="Autocitado"').check({
            force: true
        });
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de nutrición', '@conceptosTurneables', 0);
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.paciente.documento).to.be.eq(dni);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success', 'Solicitud guardada');
    });

    it('campos requeridos', () => {
        seleccionarPaciente(dni);

        cy.plexButton('Guardar').click();

        cy.plexDatetime('label="Fecha de solicitud"').validationMessage()
        cy.swal('confirm');
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexSelectType('label="Tipo de Prestación Solicitada"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de cirugía infantil', '@conceptosTurneables', 0);

        cy.plexSelectType('label="Organización origen"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelect('label="Organización origen"', 0).click();

        cy.plexSelect('label="Tipos de Prestación Origen"', 0).click();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', 0);

        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
    });

    it('comprobación de reglas', () => {
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectType('label="Organización origen"').find('.selectize-dropdown-content').children().should('have.length', 0);
        cy.plexSelectType('label="Tipos de Prestación Origen"').find('.selectize-dropdown-content').children().should('have.length', 0);
    });

    it('nueva solicitud, asignación a profesional y control de historial', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de clinica médica', '@conceptosTurneables', 0);
        cy.plexSelect('label="Organización origen"', 0).click();
        cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexSelectType('label="Profesional solicitante"', 'CORTES');
        cy.wait('@profesionalSolicitante');
        cy.plexSelectType('label="Profesional solicitante"', '{enter}');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.paciente.documento).to.be.eq(dni);
            expect(response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success');

        cy.get('table tbody td').contains(dni).click();
        cy.get('plex-layout-sidebar .plex-box-content').scrollTo('bottom').wait(500);
        cy.get('plex-layout-sidebar').plexButtonIcon('lock-alert').click()
        cy.plexButton('Asignar').click();
        cy.plexTextArea('label="Observaciones"', 'un motivo lalala');
        cy.plexSelectAsync('label="Profesional"', 'Natalia Huenchuman', '@profesionalSolicitante', 0);
        cy.plexButtonIcon('check').click();
        cy.wait('@getSolicitudes')
        cy.wait('@patchSolicitud');
        cy.get('.badge').contains('asignada');
        cy.goto('/rup', token);
        cy.get('[tooltip="Mis solicitudes"]').then((items) => {
            items[0].click()
        });
        cy.wait('@getSolicitudes').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            cy.get('.badge').contains('asignada');
        });
        cy.get('table tbody tr').should('length', 1);
    });
});