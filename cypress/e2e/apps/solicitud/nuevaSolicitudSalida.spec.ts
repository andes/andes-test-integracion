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
        cy.intercept('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('conceptosTurneables');
        cy.intercept('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('searchPaciente');
        cy.intercept('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        secuencia(token);
    });

    it('nueva solicitud exitosa', () => {
        let idPrestacion;
        seleccionarPaciente(dni);
        cy.plexDatetime('label="Fecha de solicitud"', cy.today());
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@conceptosTurneables', 0);
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', 0);
        cy.plexSelect('label="Organización destino"', 0).click();
        cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.paciente.documento).to.be.eq(dni);
            expect(response.body.solicitud.tipoPrestacion.conceptId).to.be.eq(idPrestacion);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.toast('success', 'Solicitud guardada');
        cy.get('table tbody tr').contains('CORTES, JAZMIN').click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
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
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@conceptosTurneables', 0);

        cy.plexSelectType('label="Profesional solicitante"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.intercept('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.plexSelectAsync('label="Profesional solicitante"', 'HUENCHUMAN NATALIA', '@profesionalSolicitante', 0);

        cy.plexSelectType('label="Organización destino"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelect('label="Organización destino"', 0).click();

        cy.plexSelect('label="Tipo de Prestación Solicitada"', 1).click();
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.get('table tbody tr').contains('Huenchuman, Natalia').click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
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