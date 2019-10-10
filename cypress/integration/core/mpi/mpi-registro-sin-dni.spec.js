context('MPI-Registro Paciente Sin DNI', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('mpi/relacion', token);
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/paciente/sin-dni/mpi', token);
        cy.server();
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('ingresar apellido y nombre y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y sin contacto', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroSinDni');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y telefono móvil', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroSinDni');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y telefono fijo', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroSinDni');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'fijo');
        cy.plexPhone('label="Número"', '4785215');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos e email', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroSinDni');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'email');
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de una nota y verificar que aparezca en el listado de notas', () => {
        cy.plexTab('Notas').click();
        cy.plexText('name="nuevaNota"', 'Test Note');
        cy.plexButton('Agregar Nota').click();
        cy.contains('Test Note');
    });

    it('buscar en la pestaña relaciones un paciente por dni que no exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaRelacion');
        cy.plexText('name="buscador"', '000000001');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar en la pestaña relaciones un paciente por dni que exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaRelacion');
        cy.plexText('name="buscador"', '33222111');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('documento', '33222111')
        });
    });

    it.only('buscar en la pestaña relaciones un paciente por nombre/apellido que exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaRelacion');
        cy.plexText('name="buscador"', 'PACIENTE SIN DNI');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('apellido', 'PACIENTE SIN DNI')
        });
        cy.plexText('name="buscador"', ' RELACION');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('nombre', 'RELACION')
        });
    });

    it('buscar en la pestaña relaciones scan de progenitor y verificar datos básicos ingresados', () => {
        cy.plexTab('Relaciones').click();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaRelacion');
        cy.plexText('name="buscador"', '00535248130@RELACION@PACIENTE@F@66000666@B@01/10/1992@14/02/2018@200').should('have.value', '00535248130@RELACION@PACIENTE@F@66000666@B@01/10/1992@14/02/2018@200');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.get('paciente-listado').find('td').contains('66000666');
            cy.get('paciente-listado').find('td').contains('PACIENTE');
            cy.get('paciente-listado').find('td').contains('RELACION');
            cy.get('paciente-listado').find('td').contains('01/10/1992');
            cy.get('paciente-listado').find('td').contains('Femenino');
        });
    });

    it('buscar en la pestaña relaciones un paciente por nombre/apellido que no exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaRelacion');
        cy.plexText('name="buscador"', 'INEXISTENTE');
        cy.wait('@busquedaRelacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y una nota', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroSinDni');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelect('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexTab('Notas').click();
        cy.plexText('name="nuevaNota"', 'Test Note');
        cy.plexButton('Agregar Nota').click();
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.notas).to.have.length(1);
        });
        cy.contains('Los datos se actualizaron correctamente');
    });
});
