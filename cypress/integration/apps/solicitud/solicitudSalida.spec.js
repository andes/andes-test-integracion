

/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)

        cy.visit(Cypress.env('BASE_URL') + '/solicitudes', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it.skip('crear solicitud de entrada', () => { // TODO: molesta el wizard
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes').as('consulta');
        cy.get('span').contains('Solicitudes de Salida').click();

        cy.get('plex-button[label="Nueva Solicitud"]').click();

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.get('tr').eq(1).click()

        cy.get('plex-dateTime[name="fechaSolicitud"] input').type('25/10/2018').should('have.value', '25/10/2018');

        cy.get('plex-select[label="Tipos de Prestación Origen"]').children().children('.selectize-control').click({ force: true })
            .find('.option[data-value="59ee2d9bf00c415246fd3d6a"]').click({ force: true })
        cy.get('plex-select[label="Profesional solicitante"] input').type('valverde')
        cy.get('plex-select[label="Profesional solicitante"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="58f74fd4d03019f919ea243e"]').click({ force: true })
        cy.get('plex-select[label="Organización destino"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="57e9670e52df311059bc8964"]').click({ force: true })
        cy.get('plex-select[label="Tipo de Prestación Solicitada"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="391000013108"]').click({ force: true })
        // cy.get('plex-select[label="Profesional solicitante"] input').type('valverde')
        // cy.get('plex-select[label="Profesional solicitante"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="58f74fd4d03019f919ea243e"]').click({ force: true })
        cy.get('plex-select[label="Profesional destino"] input').type('santarelli',{ force: true })
        cy.get('plex-select[label="Profesional destino"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="5b4df3aebd7c1f8e59138be6"]').click({ force: true })
        cy.get('textarea').last().type('ni', { force: true });
        cy.get('plex-button[label="Guardar"]').click();




        // cy.get('plex-text input[type=text]').first().type('botta').should('have.value', 'botta');

        // cy.get('div.alert.alert-danger').should('exist');


    })

    // it('Mock api', () => {
    //     cy.server();
    //     cy.route('**/api/core/mpi/pacientes**', [
    //         { "documento":"34934522", "estado":"temporal","nombre":"MARIANO","apellido":"BOTTA", "sexo":"masculino", "genero":"masculino", "fechaNacimiento":"2018-05-01T10:41:52.686Z",   "claveBlocking":["VTMRN","VT","MRN","133696","133"],   "edadReal":{"unidad":"Días","valor":8},"edad":0,"nombreCompleto":"MARIANO BOTTA","id":"5aec38faca43621f0823c85e"},
    //         { "documento":"30000000", "estado":"validado","nombre":"MARIANO ANDES","apellido":"BOTTA", "sexo":"masculino", "genero":"masculino", "fechaNacimiento":"2018-05-01T10:41:52.686Z",   "claveBlocking":["VTMRN","VT","MRN","133696","133"],   "edadReal":{"unidad":"Días","valor":8},"edad":0,"nombreCompleto":"MARIANO BOTTA","id":"5aec38faca43621f0823c85e"}
    //     ]).as('elastic');
    //     cy.get('plex-text input[type=text]').first().type('botta').should('have.value', 'botta');
    //     cy.wait('@elastic');

    //     cy.get('table').find('tbody').find('tr').should('have.length', 2);

    // });



})