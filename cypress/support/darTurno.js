Cypress.Commands.add('darTurno', (path, token) => {
    cy.request({
        method: 'GET',
        url: Cypress.env('API_SERVER') + path,
        headers: {
            Authorization: `JWT ${token}`
        },
        failOnStatusCode: false
    });
    cy.route('GET', '**api/core/mpi/pacientes/**').as('darTurnoPaciente');
    cy.plexText('name="buscador"', '36425896');
    cy.wait('@busquedaPaciente').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
    });
    cy.get('paciente-listado table').find('td').contains('36425896').click();
    cy.wait('@seleccionPaciente').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
    });
    cy.plexButtonIcon('calendar-plus').click({ force: true });
    cy.wait('@darTurnoPaciente').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
    });
});

