
context('MPI-Busqueda Paciente', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
    });


    it('buscar paciente por documento y verificar que no existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaConDocumento');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', true);
        cy.plexText('name="buscador"', '52081206');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', false);
        cy.wait('@busquedaConDocumento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar paciente por nombre/apellido y verificar que no existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaConNombre');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', true);
        cy.plexText('name="buscador"', 'nopatint');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', false);
        cy.wait('@busquedaConNombre').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar paciente con scan y verificar precarga de datos básicos', () => {
        cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaConScan');
        cy.get('plex-text[name="buscador"] input').first().type('00535248130@TEST@TEST@M@26108063@B@02/10/1977@14/02/2018@200').should('have.value', '00535248130@TEST@TEST@M@26108063@B@02/10/1977@14/02/2018@200');
        cy.wait('@busquedaConScan').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.plexInt('name="documento"').should('have.value', '26108063');
            cy.plexText('label="Nombre"').should('have.value', 'TEST');
            cy.plexText('label="Apellido"').should('have.value', 'TEST');
            cy.plexDatetime('label="Fecha de Nacimiento"').should('have.value', '02/10/1977');
            cy.plexSelectType('label="Sexo"').contains('Masculino');
        });
    });



})