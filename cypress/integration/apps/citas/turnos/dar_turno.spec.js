context('punto de inicio', () => {
    let token;
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal.json', token);
        });
    });
    beforeEach(() => {
        cy.server();
        cy.goto('/citas/punto-inicio', token);
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/log/paciente?idPaciente=**').as('seleccionPaciente');

        cy.plexText('name="buscador"', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado table').find('td').contains('38906734').click();
        cy.wait('@seleccionPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('calendar-plus').click({force: true});
        cy.wait('@darTurnoPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    })
    it('Buscar paciente inexistente', () => {
        cy.plexText('name="buscador"', '12362920');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.alert.alert-danger').should('contain', 'No se encontró ningún paciente..');
    })
    
});