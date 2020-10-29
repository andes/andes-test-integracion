
context('Visualización de turnos', () => {
    let token;
    let prof;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createAgendaMatriculaciones('agenda-matriculaciones', 80, 0, 2, 30, token);
            cy.fixture('matriculaciones/profesional').as('profesional_matriculacion').then((profesional) => {
                prof = profesional;
                cy.request({
                    method: 'POST',
                    url: Cypress.env('API_SERVER') + '/api/modules/matriculaciones/turnoSolicitados/',
                    body: profesional,
                    headers: {
                        Authorization: `JWT ${token}`
                    }
                });
                cy.request({
                    method: 'POST',
                    url: Cypress.env('API_SERVER') + '/api/modules/matriculaciones/turnos/matriculacion/' + profesional._id,
                    body:
                    {
                        "turno": {
                            "fecha": "2020-03-03T13:00:00.000Z",
                            "profesional": profesional._id,
                            "tipo": "matriculacion"
                        }
                    },
                    headers: {
                        Authorization: `JWT ${token}`
                    }
                });
                cy.request({
                    method: 'POST',
                    url: Cypress.env('API_SERVER') + '/api/modules/matriculaciones/turnos/matriculacion/' + profesional._id,
                    body:
                    {
                        "turno": {
                            "fecha": "2020-03-05T13:00:00.000Z",
                            "profesional": profesional._id,
                            "tipo": "matriculacion"
                        }
                    },
                    headers: {
                        Authorization: `JWT ${token}`
                    }
                });
            });
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/api/auth/login**').as('loginMatriculaciones');
        cy.route('POST', '**/api/auth/organizaciones**').as('organizaciones');
        cy.route('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.route('POST', '**api/modules/matriculaciones/agendaMatriculaciones**').as('nuevaAgenda');
        cy.goto('/matriculaciones/');
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Acceso fiscalización').click();
        cy.plexInt('name="usuario"').type('30643636');
        cy.plexText('name="password"').type('asd');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@loginMatriculaciones');
        cy.wait('@getOrganizaciones');
        cy.contains(' HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON ').click();
        cy.wait('@organizaciones');
    });

    it('Verificar turnos y anular uno', () => {
        cy.route('POST', '**/api/modules/matriculaciones/turnos/save/**').as('guarda_turno');
        cy.route('GET', '**/api/modules/matriculaciones/turnos/proximos/**').as('get_turnos');
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Turnos').click();
        cy.plexDatetime('label="Fecha desde"', { text: '03/03/2020', clear: true });
        cy.get('li.list-group-item').should('have.length', 2);
        cy.contains('Estepa, Atahualpa').click();
        cy.get('plex-layout-sidebar').contains('Ausente');
        cy.plexButton('Se presentó').click();
        cy.wait('@guarda_turno').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.sePresento).to.be.eq(true);
        });
        cy.wait('@get_turnos').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
        });
        cy.wait(2000);
        cy.contains('03/03/2020 10:00 hs').click();
        cy.get('plex-layout-sidebar').contains('Presente');
        cy.plexButton('Ausente').click();
        cy.wait('@guarda_turno').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.sePresento).to.be.eq(false);
        });
        cy.plexButton('Anular turno').click();
        cy.swal('confirm');
        cy.wait('@guarda_turno').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.anulado).to.be.eq(true);
        });
        cy.get('li.list-group-item').should('have.length', 1);
    });

    it('Buscar turnos en distintas fechas y verificar resultados y visualización del botón de pdf', () => {
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Turnos').click();
        cy.plexDatetime('label="Fecha desde"', { text: '05/03/2020', clear: true });
        cy.get('li.list-group-item').should('have.length', 1);
        cy.wait(1000);
        cy.get('.mdi.mdi-file-pdf').should('have.length', 1);
        cy.plexDatetime('label="Fecha desde"', { text: '04/03/2020', clear: true });
        cy.get('li.list-group-item').should('have.length', 1);
        cy.wait(1000);
        cy.get('.mdi.mdi-file-pdf').should('have.length', 0);
        cy.plexDatetime('label="Fecha desde"', { text: '06/03/2020', clear: true });
        cy.get('li.list-group-item').should('have.length', 1);
        cy.wait(1000);
        cy.get('.mdi .mdi-file-pdf').should('have.length', 0);
        cy.contains(' No se encontró ningún turno');
    });

});
