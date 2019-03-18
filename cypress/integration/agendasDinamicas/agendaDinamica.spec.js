

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

    it('crear agenda dinamica', () => {
        // cy.get('plex-text input[type=text]').first().type('botta').should('have.value', 'botta');

        // cy.get('div.alert.alert-danger').should('exist');

        cy.get('plex-button[label="Crear una nueva agenda"]').click();

        cy.get('div').then(($body) => {
            if ($body.hasClass('swal2-container')) {
                 cy.get('.swal2-cancel').click({ force: true })
            } else {
            }
        })
        const hoy = Cypress.moment().format('DD/MM/YYYY')
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click()

        cy.get('plex-bool[name="dinamica"] input[type="checkbox"]').check({ force: true }).should('be.checked')

        cy.get('plex-text[name="descripcion"] input').eq(0).type('soy una descripcion', { force: true }).should('have.value', 'soy una descripcion');


        cy.get('plex-bool[name="cupo"] input[type="checkbox"]').check({ force: true }).should('be.checked')

        cy.get('plex-int[name="cupoMaximo"] input').type('8').should('have.value', '8');

        cy.get('plex-button[label="Guardar"]').click();

        cy.wait(2000)
        cy.get('table tr').contains('Exámen médico del adulto').first().click()
        cy.get('plex-button[title="Cambiar a disponible"]').click();
        // cy.get('button').contains('CONFIRMAR').click();


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