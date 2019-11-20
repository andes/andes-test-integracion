/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    it('Ver accesos a la huds', () => {
        let dni = '31173233';
        cy.server()
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create')
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch')
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente')
        cy.route('POST', '**/api/modules/huds/huds-accesos**').as('hudsToken')

        cy.goto('/rup', token)

        // Punto inicio RUP
        cy.plexButton('PACIENTE FUERA DE AGENDA').click()
        cy.swal('confirm');

        cy.plexSelect('label="Seleccione el tipo de prestación"').click()
        cy.contains('Consulta de enfermería').click()
        cy.plexButton('SELECCIONAR PACIENTE').click()

        cy.plexText('name="buscador"', dni);
        cy.get('paciente-listado').find('td').contains(dni).click();
        cy.plexButton('INICIAR PRESTACIÓN').click()

        // Prestacion ejecucion
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');

            cy.plexButton('Guardar Consulta de enfermería').click()
            cy.wait('@patch').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.solicitud.turno).to.be.undefined;
                expect(xhr.response.body.paciente.documento).to.be.eq(dni);
                expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
                expect(xhr.response.body.estados[1]).to.be.eq(undefined);

                cy.get('div').contains('Prestación guardada correctamente').click() //toast

                cy.get('.plex-box-content').first().scrollTo('bottom');
                cy.get('plex-radio[label="¿Procedimiento/Diagnóstico principal?"').find('mat-radio-button').contains('Si').click()
                cy.plexButton('Validar Consulta de enfermería').click()
                cy.swal('confirm')
                cy.get('plex-button').contains('Punto de Inicio').click()

                // Punto inicio RUP
                cy.wait(3000)

                cy.get('td').contains('Fuera de agenda').click()
                cy.get('plex-button').contains('VER HUDS').first().click({ force: true })
                cy.get('plex-button').contains('ACEPTAR').click({ force: true })

                // vista de huds
                cy.get('plex-tab').contains('Accesos a la HUDS').click()
            });
        });
    });
});
