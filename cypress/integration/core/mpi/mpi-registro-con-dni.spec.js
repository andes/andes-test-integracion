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
        cy.route('POST', '**api/core/mpi/pacientes**').as('guardar');

        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.plexInt('name="documento"', '12345489');
        cy.plexSelectType('name="sexo"', 'Masculino');

        // Se valida con FA RENAPER
        cy.plexButton('Validar Paciente').click();
        cy.wait('@renaper').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se verifican que los datos se muestren correctamente
        cy.plexText('name="apellido"').should('have.value', 'TEST');

        cy.contains('TEST, JOSE');
        cy.contains('Paciente Validado').click();
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.direccion.length).eq(2)
        });
        cy.contains('Los datos se actualizaron correctamente');
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
            expect(xhr.response.body.nombre).to.be.eq("CON DNI");
            expect(xhr.response.body.apellido).to.be.eq("TEST");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar lista de pacientes validados similares con porcentaje 83%', () => {
        cy.route('POST', '**api/core/mpi/pacientes/validar').as('validacion');
        cy.route('POST', '**api/core/mpi/pacientes**').as('guardar');
        cy.fixture('mpi/paciente-validado2').as('paciente_validado2');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado2').as('renaper2');
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '33650509');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexButton('Validar Paciente').click();
        cy.contains('Paciente Validado');
        cy.toast('success').click();
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq("MARTIN");
            expect(xhr.response.body.apellido).to.be.eq("BUCAREY");
        });
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
        cy.contains('Similitud: 83 % ');
    });

    it('verificar lista de pacientes validados similares con porcentaje mayor al 95%', () => {
        cy.route('POST', '**api/core/mpi/pacientes/validar').as('validacion');
        cy.route('POST', '**api/core/mpi/pacientes**').as('guardar');
        cy.fixture('mpi/paciente-validado3').as('paciente_validado3');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado3').as('renaper3');
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '32247537');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'femenino').click();
        cy.plexButton('Validar Paciente').click();
        cy.contains('Paciente Validado');
        cy.toast('success').click();
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq("MARIA CELESTE");
            expect(xhr.response.body.apellido).to.be.eq("RAMOS");
        });
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
        cy.contains('Similitud: 95 % ');
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
            expect(xhr.response.body.nombre).to.be.eq("MARIA JULIETA");
            expect(xhr.response.body.apellido).to.be.eq("NUEZ");
        });
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
            expect(xhr.response.body.nombre).to.be.eq("MARTA LUZ");
            expect(xhr.response.body.apellido).to.be.eq("ALMENDRA");
        });
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

    it('editar direccion de un paciente existente y agregarle una relación', () => {
        let direccion = 'Avenida las flores 1200'
        cy.route('GET', '**api/core/mpi/pacientes**').as('getPaciente');
        cy.route('GET', '**api/core/mpi/pacientes/**').as('findPacienteByID');
        cy.route('PUT', '**api/core/mpi/pacientes/**').as('putPaciente');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('patchPaciente');

        cy.plexText('name="buscador"', '20000000');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq("PACIENTE TEMPORAL");
            expect(xhr.response.body[0].apellido).to.be.eq("ANDES");
        });
        cy.get('paciente-listado').find('td').contains('20000000').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexText('name=direccion', direccion);

        cy.plexTab('Relaciones').click();

        cy.plexText('name="buscador"', '10000000');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq("PACIENTE VALIDADO");
            expect(xhr.response.body[0].apellido).to.be.eq("ANDES");
        });
        cy.get('paciente-listado').find('td').contains('10000000').parent().parent().click();

        cy.plexSelect('placeholder="Seleccione..."').click();
        cy.plexSelect('placeholder="Seleccione..."', 1).click({ force: true });

        cy.plexButton('Guardar').click();
        cy.wait('@putPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('20000000');
            expect(xhr.response.body.nombre).to.be.eq('PACIENTE TEMPORAL');
            expect(xhr.response.body.apellido).to.be.eq('ANDES');
            expect(xhr.response.body.direccion[0].valor).to.be.eq(direccion)
        });
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('10000000');
            expect(xhr.response.body.nombre).to.be.eq('PACIENTE VALIDADO');
            expect(xhr.response.body.apellido).to.be.eq('ANDES');
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

});