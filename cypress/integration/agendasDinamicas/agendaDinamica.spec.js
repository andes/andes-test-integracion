/// <reference types="Cypress" />

context('Agenda dinamicas', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.fixture('paciente-dinamico').then((paciente) => {
                cy.request({ 
                    method: 'POST', 
                    url: Cypress.env('API_SERVER') + '/api/core/mpi/pacientes', 
                    body: paciente,
                    headers: {
                        Authorization: `JWT ${token}`
                    }
                });
            })
        });
    })

    beforeEach(() => {
        
    })

    it('crear agenda dinamica', () => {
        cy.visit(Cypress.env('BASE_URL') + '/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });

        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('publicar');
        cy.route('POST', '**/api/modules/turnos/agenda**').as('crear');
        
        cy.get('plex-button[label="Crear una nueva agenda"]').click();
        cy.swal('cancel');

        const hoy = Cypress.moment().format('DD/MM/YYYY')
        cy.get('plex-dateTime[name="modelo.fecha"] input').type(hoy).should('have.value', hoy);

        cy.get('plex-dateTime[name="modelo.horaInicio"] input').type('0800').should('have.value', '0800');

        cy.get('plex-dateTime[name="modelo.horaFin"] input').type('1900').should('have.value', '1900');

        cy.get('plex-select[label="Tipos de prestación"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('plex-bool[name="dinamica"] input[type="checkbox"]').check({ force: true }).should('be.checked')

        cy.get('plex-text[name="descripcion"] input').eq(0).type('soy una descripcion', { force: true }).should('have.value', 'soy una descripcion');


        cy.get('plex-bool[name="cupo"] input[type="checkbox"]').check({ force: true }).should('be.checked')

        cy.get('plex-int[name="cupoMaximo"] input').type('8').should('have.value', '8');

        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@crear').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        
        cy.get('table tr').contains('Exámen médico del adulto').first().click()
        cy.get('plex-button[title="Publicar"]').click(); 
        cy.swal('confirm');

        // Espero a la respuesta de publicar y confirmo que sea StatusCode 200
        cy.wait('@publicar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
    });

    it('dar turno agenda dinamica', () => {
    
        cy.server();
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        
        cy.visit(Cypress.env('BASE_URL') + '/citas/puntoInicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });

        cy.get('plex-text input[type=text]').first().type('38906735').should('have.value', '38906735');
        cy.get('tr').first().click();
        cy.get('plex-button[title="Dar Turno"]').click();
        cy.wait('@prestaciones');

        cy.get('plex-select[name="tipoPrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="5951051aa784f4e1a8e2afe1"]').click();

        cy.get('.outline-success ').first().click();
        cy.get('plex-button[label="Dar Turno"]').click();
        cy.get('plex-button[label="Confirmar"]').click();

        // Confirmo que se dio el turno desde la API
        cy.wait('@darTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        

    });

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


