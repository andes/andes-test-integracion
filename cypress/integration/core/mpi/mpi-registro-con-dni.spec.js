context('MPI-Registro Paciente Con Dni', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
    });


    it.only('ingresar documento, sexo del paciente y validar con Renaper', () => {

        cy.fixture('mpi/paciente-validado').as('paciente_validado');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado').as('renaper');

        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.plexInt('name="documento"', '12345489');
        cy.plexSelectType('name="sexo"', 'Masculino');

        // Se valida con FA RENAPER
        cy.plexButton('Validar Paciente').click();

        // Se verifican que los datos se muestren correctamente
        cy.plexText('name="apellido"').should('have.value', 'TEST');

        cy.contains('TEST, JOSE');
        cy.contains('Paciente Validado');

        cy.swal('confirm');

    });
});