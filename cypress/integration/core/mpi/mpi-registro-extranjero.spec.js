context('MPI-Registro Paciente Extranjero', () => {
    let token

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('mpi/relacion', token);
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/extranjero/mpi', token);
        cy.server();
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('ingresar apellido y nombre y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRANJERO');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y sin contacto', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroExtranjero');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRAJERO');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroExtranjero').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y telefono móvil', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroExtranjero');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRANJERO');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroExtranjero').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });
});