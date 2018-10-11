

/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('crear agenda', () => {
        // cy.get('plex-text input[type=text]').first().type('botta').should('have.value', 'botta');

        // cy.get('div.alert.alert-danger').should('exist');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();

        cy.get('plex-dateTime[name="modelo.fecha"] input').type('11/10/2018').should('have.value', '11/10/2018');

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="59ee2d9bf00c415246fd3d6a"]').click()

            cy.get('plex-int[label="Cantidad de Turnos"] input').type(10)
            cy.get('plex-int[name="accesoDirectoDelDia"] input').type(10);

            

        cy.get('plex-button[label="Guardar"]').click();

        cy.wait(2000)
        cy.get('table tr').contains('Consulta de medicina general').first().click()
        cy.get('.mdi-arrow-up-bold-circle').click();
        cy.get('button').contains('CONFIRMAR').click();


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