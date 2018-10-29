

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

    it('crear nueva regla solicitud', () => {

        cy.get('plex-button[label="Reglas"]').click();

        cy.get('plex-select[label="Prestación Destino"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="59ee2d9bf00c415246fd3d94"]').click({ force: true })
        cy.get('plex-select[name="organizacion"] input').type('castro')
        cy.get('plex-select[name="organizacion"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="57e9670e52df311059bc8964"]').click({ force: true })
        cy.wait(2000);
        cy.get('.mdi-plus').first().click();
        cy.get('plex-select[name="prestacionOrigen"] input').type('adolescencia')
        cy.get('plex-select[name="prestacionOrigen"]').children().children().children('.selectize-input').click({ force: true }).get('.option[data-value="59ee2d9bf00c415246fd3d94"]').eq(1).click({ force: true })
        cy.get('.mdi-plus').last().click();
        cy.get('plex-button[label="Guardar"]').click();

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