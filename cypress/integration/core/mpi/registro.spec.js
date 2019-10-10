context('MPI-Registro Paciente', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/bebe/mpi', token);
        cy.server();
    });

    it.skip('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it.skip('ingresar apellido y nombr y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de contacto de contacto de paciente', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });
})