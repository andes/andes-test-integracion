/// <reference types="Cypress" />

function secuencia(token) {
    cy.goto('/solicitudes', token);
    cy.plexButton("Nueva Solicitud").click();
}

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente')
    cy.get('paciente-listado').find('td').contains(dni).click();
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
        cy.server();
        cy.route('GET', '**/core/tm/tiposPrestaciones?turneable=1**').as('tipoPrestacion');
        cy.route('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.route('PATCH', '**/modules/rup/prestaciones/**').as('patchSolicitud');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('GET', '**/modules/rup/prestaciones/solicitudes**').as('getSolicitudes');
        secuencia(token);
    });

    it('nueva solicitud exitosa', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.introjsTooltip();
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de esterilidad', '@tipoPrestacion', '59ee2d9bf00c415246fd3d1c');
        cy.plexSelect('label="Organización origen"', 0).click();
        cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
            expect(xhr.response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
        });
        cy.toast('success', 'Solicitud guardada');
    });

    it('nueva solicitud autocitada exitosa', () => {
        seleccionarPaciente(dni);
        cy.introjsTooltip();
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexBool('label="Autocitado"').check({
            force: true
        });
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de esterilidad', '@tipoPrestacion', '59ee2d9bf00c415246fd3d1c');
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
        });
        cy.toast('success', 'Solicitud guardada');
    });

    it('campos requeridos', () => {
        seleccionarPaciente(dni);

        cy.introjsTooltip();
        cy.plexButton('Guardar').click();

        cy.plexDatetime('label="Fecha de solicitud"').validationMessage()
        cy.swal('confirm');
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexSelectType('label="Tipo de Prestación Solicitada"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de esterilidad', '@tipoPrestacion', '59ee2d9bf00c415246fd3d1c');

        cy.plexSelectType('label="Organización origen"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelect('label="Organización origen"', 0).click();

        cy.plexSelect('label="Tipos de Prestación Origen"', 0).click();

        cy.plexSelectType('label="Profesional solicitante"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');

        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('comprobación de reglas', () => {
        seleccionarPaciente(dni);
        cy.introjsTooltip();
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectType('label="Organización origen"').find('.selectize-dropdown-content').children().should('have.length', 0);
        cy.plexSelectType('label="Tipos de Prestación Origen"').find('.selectize-dropdown-content').children().should('have.length', 0);
    });

    it('nueva solicitud, asignación a profesional y control de historial', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.introjsTooltip();
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', 'Consulta de clinica médica');
        cy.plexSelectAsync('label="Organización origen"', 'HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON', '@tipoPrestacion', 0);
        cy.plexSelect('label="Tipos de Prestación Origen"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexSelectType('label="Profesional solicitante"', 'CORTES');
        cy.wait('@profesionalSolicitante');
        cy.plexSelectType('label="Profesional solicitante"', '{enter}');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
            expect(xhr.response.body.solicitud.tipoPrestacionOrigen.conceptId).to.be.eq(idPrestacion);
        });
        cy.toast('success');
        cy.plexButtonIcon('lock-alert').last().click();
        cy.plexButton('Asignar').click();
        cy.plexTextArea('label="Observaciones"', 'un motivo lalala');
        cy.plexSelectType('label="Profesional"', 'natalia huenchuman');
        cy.wait('@profesionalSolicitante');
        cy.plexSelectType('label="Profesional"', '{enter}');
        cy.plexButton('Confirmar').click();
        cy.wait('@getSolicitudes')
        cy.wait('@patchSolicitud');
        cy.get('.badge').contains('asignada');
        cy.goto('/rup', token);
        cy.wait('@tipoPrestacion');
        cy.plexButton('Mis solicitudes').click();
        cy.wait('@getSolicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('.badge').contains('asignada');
        });
        cy.get("@getSolicitudes.all").then((array) => {
            expect(array[6].response.body[0].solicitud.historial[0].accion).to.be.eq('asignacionProfesional');
        });
        cy.get('tbody tr').should('have.length.above', 0);
    });
});