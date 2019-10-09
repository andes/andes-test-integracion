/// <reference types="Cypress" />

function secuencia(token) {
    cy.goto('/solicitudes', token);
    cy.plexTab('Solicitudes de Salida').click();
    cy.plexButton("Nueva Solicitud").click();
}


context('TOP: Nueva Solicitud de Salida', () => {
    let token
    before(() => {
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('30643636', 'asd').then(t => {
            token = t;
            secuencia(token);
        });
    })

    beforeEach(() => {

    })

    it('nueva solicitud exitosa', () => {
        cy.server();
        cy.createPaciente('paciente-normal', token);
        cy.wait(1000);
        cy.plexText('name="buscador"', '38906734');
        cy.get('paciente-listado').find('td').contains('38906734').click();
        cy.plexDatetime('label="Fecha en que el profesional solicitó la prestación"', '03-10-2019');
        cy.get('div a.introjs-button.introjs-skipbutton.introjs-donebutton').click();
        cy.route('GET', '**/core/tm/tiposPrestaciones?turneable=1**').as('tipoPrestacion');
        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de esterilidad');
        cy.wait('@tipoPrestacion');
        cy.plexSelect('label="Tipos de Prestación Origen"', '59ee2d9bf00c415246fd3d1c');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.plexSelectType('label="Profesional solicitante"', 'CORTES JAZMIN');
        cy.wait('@profesionalSolicitante');
        cy.plexSelect('label="Profesional solicitante"', '58f74fd3d03019f919e9fff2');
        cy.plexSelectType('label="Organización destino"', null).click();
        cy.plexSelectType('label="Organización destino"', null).parent().find('.selectize-dropdown-content').children().first().click();
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', null).click()
        cy.plexSelectType('label="Tipo de Prestación Solicitada"', null).parent().find('.selectize-dropdown-content').children().first().click();
        cy.plexTextArea('label="Notas / Diagnóstico / Motivo"', 'un motivo lalala');
        cy.plexButton('Guardar').click();
    });

})