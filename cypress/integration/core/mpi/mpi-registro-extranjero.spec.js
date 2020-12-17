context('MPI-Registro Paciente Extranjero', () => {
    let token

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });

    })

    beforeEach(() => {
        cy.goto('/apps/mpi/paciente/extranjero/mpi', token);
        cy.server();
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('ingresar apellido y nombre y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRANJERO');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y sin contacto', () => {
        cy.route('POST', '**api/core-v2/mpi/pacientes**').as('registroExtranjero');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRANJERO');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroExtranjero').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("TEST");
            expect(xhr.response.body.nombre).to.be.eq("EXTRANJERO");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y telefono móvil', () => {
        cy.route('POST', '**api/core-v2/mpi/pacientes**').as('registroExtranjero');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'EXTRANJERO');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroExtranjero').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("TEST");
            expect(xhr.response.body.nombre).to.be.eq("EXTRANJERO");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
    });
});