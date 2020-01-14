context('MPI-Registro Paciente Con Dni', () => {
    let token
    before(() => {
        cy.seed();
        cy.cleanDB()
        cy.task('database:seed:paciente');
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });

    })

    beforeEach(() => {
        cy.log(token)
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
    });


    it('ingresar documento, sexo del paciente y validar con Renaper', () => {

        // Intercepta la llamada a la ruta validar y devuelve paciente_validado
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

    });

    it('verificar la carga de paciente con datos obligatorios requeridos', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroConDni');

        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();

        cy.plexInt('label="Número de DNI ARGENTINO"', '11222333');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'CON DNI');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroConDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar lista de pacientes validados similares con porcentaje 81%', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroConDni');
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '33650509');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexButton('Validar Paciente').click();
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.wait(6000);
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '33650590');
        cy.plexText('label="Apellido"', 'Bucares');
        cy.plexText('label="Nombre"', 'Matias');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '09/04/1989');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('Existen pacientes similares, verifique las sugerencias')
        cy.get('button').contains('Aceptar').click();
        cy.contains('Similitud: 81 % ');
    });

    it('verificar lista de pacientes validados similares con porcentaje mayor al 96%', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroConDni');
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '32247537');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexButton('Validar Paciente').click();
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.wait(6000);
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '32247537');
        cy.plexText('label="Apellido"', 'Ramos');
        cy.plexText('label="Nombre"', 'María');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '28/08/1986');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('El paciente ya existe, verifique las sugerencias');
        cy.get('button').contains('Aceptar').click();
        cy.contains('Similitud: 96 % ');
    });

    it('crear paciente con similitud del 81% con uno existente temporal', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroConDni');
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27799117');
        cy.plexText('label="Apellido"', 'Nuez');
        cy.plexText('label="Nombre"', 'Maria Julieta');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/10/2000');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroConDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27799171');
        cy.plexText('label="Apellido"', 'Nuñez');
        cy.plexText('label="Nombre"', 'Maria');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/10/2000');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
    });

    it('crear paciente con similitud del 98% con uno existente temporal', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroConDni');
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27700887');
        cy.plexText('label="Apellido"', 'Almendra');
        cy.plexText('label="Nombre"', 'Marta Luz');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/09/2000');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroConDni').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
        });
        cy.wait(2000);
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27700887');
        cy.plexText('label="Apellido"', 'Almendra');
        cy.plexText('label="Nombre"', 'Marta');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/09/2000');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
    });

    it('editar un paciente existente y agregarle una relación', () => {
        cy.route('GET', '**api/core/mpi/pacientes**').as('getPaciente');
        cy.route('GET', '**api/core/mpi/pacientes/**').as('findPacienteByID');

        cy.plexText('name="buscador"', '20000000');
        cy.wait('@getPaciente');
        cy.get('paciente-listado').find('td').contains('20000000').click();

        cy.wait('@findPacienteByID');

        cy.plexTab('Relaciones').click();

        cy.plexText('name="buscador"', '10000000');
        cy.wait('@getPaciente');
        cy.get('paciente-listado').find('td').contains('10000000').parent().parent().click();

        cy.plexSelect('placeholder="Seleccione..."').click();
        cy.plexSelect('placeholder="Seleccione..."', 1).click();

        cy.plexButton('Guardar').click();
        cy.contains('Los datos se actualizaron correctamente');
    });

});