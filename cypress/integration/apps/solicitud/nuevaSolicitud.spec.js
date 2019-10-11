/// <reference types="Cypress" />

function secuencia(token) {
    cy.goto('/solicitudes', token);
    cy.plexTab('Solicitudes de Salida').click();
    cy.plexButton("Nueva Solicitud").click();
}

function seleccionarPaciente(dni) {
    cy.plexText('name="buscador"', dni);
    cy.get('paciente-listado').find('td').contains(dni).click();
}

context('TOP: Nueva Solicitud de Salida', () => {
    let token
    before(() => {
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal', token);
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/core/tm/tiposPrestaciones?turneable=1**').as('tipoPrestacion');
        cy.route('POST', '**/modules/rup/prestaciones**').as('createSolicitud');
        secuencia(token);
    });

    it('nueva solicitud exitosa', () => {
        let idPrestacion;
        seleccionarPaciente('38906734');
        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"', cy.today());
        cy.get('div a.introjs-button.introjs-skipbutton.introjs-donebutton').click();
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@tipoPrestacion', '59ee2d9bf00c415246fd3d1c');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexSelect('label="Organización destino"', 0).click();
        cy.plexSelect('label="Tipo de Prestación Solicitada"', 0).then((elemento) => {
            idPrestacion = elemento.attr('data-value');
        }).click();
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
        cy.wait('@createSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('38906734');
            expect(xhr.response.body.solicitud.tipoPrestacion.conceptId).to.be.eq(idPrestacion);
        });
    });

    it('campos requeridos', () => {
        seleccionarPaciente('38906734');

        cy.get('div a.introjs-button.introjs-skipbutton.introjs-donebutton').click();
        cy.plexButton('Guardar').click();

        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"').validationMessage()
        cy.swal('confirm');
        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"', cy.today());
        cy.plexButton('Guardar').click();
        cy.swal('confirm');

        cy.plexSelectType('label="Tipos de Prestación Origen"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.plexSelectAsync('label="Tipos de Prestación Origen"', 'Consulta de esterilidad', '@tipoPrestacion', '59ee2d9bf00c415246fd3d1c');

        cy.plexSelectType('label="Profesional solicitante"').validationMessage()
        cy.plexButton('Guardar').click();
        cy.swal('confirm');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');

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
        });
    });

    it('comprobación de reglas', () => {
        seleccionarPaciente('38906734');
        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"', cy.today());
        cy.get('div a.introjs-button.introjs-skipbutton.introjs-donebutton').click();
        cy.plexSelectType('label="Organización destino"').find('.selectize-dropdown-content').children().should('have.length', 0);
        cy.plexSelectType('label="Tipo de Prestación Solicitada"').find('.selectize-dropdown-content').children().should('have.length', 0);
    });

    //caso en que se elimina el elemento seleccionado del select


});