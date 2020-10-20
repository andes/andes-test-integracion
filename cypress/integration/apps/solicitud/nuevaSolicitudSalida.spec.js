/// <reference types="Cypress" />

function secuencia(token) {
    cy.goto('/solicitudes', token);
    cy.plexTab('Salida').click();
    cy.plexButton("Nueva Solicitud de Salida").click();
}

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.wait('@searchPaciente')
    const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
    cy.get('paciente-listado plex-item').contains(documento).click();
}

describe('TOP: Nueva Solicitud de Salida', () => {
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
        cy.route('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('conceptosTurneables');
        cy.route('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        secuencia(token);
    });

    it('nueva solicitud exitosa', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@conceptosTurneables', '59ee2d9bf00c415246fd3d1c');
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexSelect('label="Organización destino"', 0).click();
        cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
            expect(xhr.response.body.solicitud.tipoPrestacion.conceptId).to.be.eq(idPrestacion);
            expect(xhr.response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success', 'Solicitud guardada');
        cy.get('plex-item').contains('CORTES, JAZMIN').click();
        cy.get('historial-solicitud').contains('Creada por Natalia Huenchuman');
    });

    it('campos requeridos', () => {
        seleccionarPaciente(dni);

        cy.plexButton('Guardar').click();

        cy.plexDatetime('label="Fecha de solicitud"').validationMessage()
        cy.swal('confirm');
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexSelectType('label="Tipos de Prestación Origen"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@conceptosTurneables', '59ee2d9bf00c415246fd3d1c');

        cy.plexSelectType('label="Profesional solicitante"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.plexSelectAsync('label="Profesional solicitante"', 'HUENCHUMAN NATALIA', '@profesionalSolicitante', 0);

        cy.plexSelectType('label="Organización destino"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelect('label="Organización destino"', 0).click();

        cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).click();
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.get('plex-item').contains('Huenchuman, Natalia').click();
        cy.get('historial-solicitud').contains('Creada por Natalia Huenchuman');
    });

    it('comprobación de reglas', () => {
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectType('label="Organización destino"').find('.selectize-dropdown-content').children().should('have.length', 0);
        cy.plexSelectType('label="Tipo de Prestación Solicitada"').find('.selectize-dropdown-content').children().should('have.length', 0);
    });

    //caso en que se elimina el elemento seleccionado del select


});