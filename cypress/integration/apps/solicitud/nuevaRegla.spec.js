/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('30643636', 'asd').then(t => {
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
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglasOrganizacionDestino');
        cy.route('GET', '**/api/core/tm/organizaciones').as('getOrganizaciones');
        cy.route('POST', '**/api/modules/top/reglas').as('guardarRegla');

        cy.get('plex-button[label="Reglas"]').click();

        cy.get('plex-select[label="Prestación Destino"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="5a26e113291f463c1b982d98"]').click({
            force: true
        })
        cy.wait('@getReglasOrganizacionDestino');

        cy.get('plex-select[name="organizacion"] input').type('hospital dr. horacio heller');
        cy.wait('@getOrganizaciones');
        cy.get('plex-select[name="organizacion"] input').type('{enter}');

        cy.get('plex-button[title="Agregar Organización"]').click();
        cy.get('plex-select[name="prestacionOrigen"] input').type('medicina general');
        cy.wait('@getPrestaciones');
        cy.get('plex-select[name="prestacionOrigen"] input').type('{enter}');

        cy.get('plex-button[title="Agregar Prestación"]').click();
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@guardarRegla').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
    })

    it('crear solicitud de entrada', () => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');

        cy.get('plex-button[label="Nueva Solicitud"]').click();
        cy.get('paciente-buscar plex-text[name="buscador"] input').first().type('38906735');
        cy.wait('@consultaPaciente');
        cy.get('table tbody').contains('38906735').click();

        cy.get('a[class="introjs-button introjs-skipbutton introjs-donebutton"]').click();

        cy.get('plex-datetime[name="fechaSolicitud"] input').type(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('plex-select[label="Tipo de Prestación Solicitada"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="5a26e113291f463c1b982d98"]').click({
            force: true
        });
        cy.wait('@getReglas');
        cy.get('plex-select[name="organizacionOrigen"] input').type('hospital dr. horacio heller{enter}');
        cy.get('plex-select[label="Tipos de Prestación Origen"] input').type('consulta de medicina general{enter}');
        cy.get('plex-select[name="profesionalOrigen"] input').type('perez maria');
        cy.wait('@getProfesional');
        cy.get('plex-select[name="profesionalOrigen"] input').type('{enter}');

        cy.get('plex-select[name="profesional"] input').type('natalia huenchuman');
        cy.wait('@getProfesional');
        cy.get('plex-select[name="profesional"] input').type('{enter}');
        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });

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