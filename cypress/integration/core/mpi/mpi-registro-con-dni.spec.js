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
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
        cy.route('POST', '**api/core/mpi/pacientes**').as('guardar');
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
        cy.wait('@renaper').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // Se verifican que los datos se muestren correctamente
        cy.plexText('name="apellido"').should('have.value', 'TEST');
        cy.contains('TEST, JOSE');
        cy.contains('Paciente Validado').click();
        cy.plexTab('datos de contacto').click();
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.direccion.length).eq(2)
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('validar con renaper nuevo paciente con ALTO % de matching contra un temporal ya existente', () => {
        let dtoTemp = {
            template: 'temporal',
            documento: '12325489',
            sexo: 'masculino',
            apellido: 'TEST',
            nombre: 'JOSE',
            fechaNacimiento: '2019-06-26T11:46:48.465Z' // difiere del paciente validado en un dia
        };

        cy.fixture('mpi/paciente-validado').as('paciente_validado');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado').as('renaper');

        cy.task('database:create:paciente', dtoTemp).then(pacienteTemp => {
            cy.plexText('name="buscador"', 'nuevo');
            cy.get('div').contains('NUEVO PACIENTE').click();
            cy.get('div').contains('CON DNI ARGENTINO').click();

            // Se completa datos básicos
            cy.plexInt('name="documento"', pacienteTemp.documento)
            cy.plexSelectType('name="sexo"', pacienteTemp.sexo);

            // Se valida con FA RENAPER
            cy.plexButton('Validar Paciente').click();
            cy.wait('@renaper').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            // vuelta rta de renaper
            cy.toast('success')
            cy.plexTab('datos de contacto').click();
            cy.plexBool('label="Sin datos de contacto"', true);
            cy.plexBool('name="viveProvActual"', true);
            cy.plexBool('name="viveLocActual"', true);
            cy.plexButton('Guardar').click();
            cy.wait('@guardar')
            cy.contains('Los datos se actualizaron correctamente');
            cy.contains('Aceptar').click();
            // buscador mpi
            cy.plexText('name="buscador"', pacienteTemp.documento);
            cy.get('paciente-listado').should('length', 1); // un solo paciente, ya que el temporal se vinculó al nuevo validado
        });
    });

    it('validar con renaper nuevo paciente con BAJO % de matching contra un temporal ya existente', () => {
        // Varía el documento en un dígito, la fecha de nacimiento y también el nombre de manera que el matching sea bajo
        let dtoTemp = {
            template: 'temporal',
            documento: '99325488',
            sexo: 'masculino',
            apellido: 'TESTEO',
            nombre: 'JOSETEMP',
            fechaNacimiento: '2019-06-26T11:46:48.465Z'
        }
        cy.fixture('mpi/paciente-validado').as('paciente_validado');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado').as('renaper');

        cy.task('database:create:paciente', dtoTemp).then(pacienteTemp => {
            cy.plexText('name="buscador"', 'nuevo');
            cy.get('div').contains('NUEVO PACIENTE').click();
            cy.get('div').contains('CON DNI ARGENTINO').click();
            // Se completa datos básicos
            cy.plexInt('name="documento"', pacienteTemp.documento)
            cy.plexSelectType('name="sexo"', pacienteTemp.sexo);
            // Se valida con FA RENAPER
            cy.plexButton('Validar Paciente').click();
            cy.wait('@renaper').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            // vuelta rta de renaper
            cy.toast('success')
            cy.plexTab('datos de contacto').click();
            cy.plexBool('label="Sin datos de contacto"', true);
            cy.plexBool('name="viveProvActual"', true);
            cy.plexBool('name="viveLocActual"', true);
            cy.plexButton('Guardar').click();
            cy.wait('@guardar')
            cy.contains('Los datos se actualizaron correctamente');
            cy.contains('Aceptar').click();
            // buscador mpi
            cy.plexText('name="buscador"', pacienteTemp.documento);
            cy.get('paciente-listado').should('length', 2); // dos pacientes ya que no hubo vinculacion
        });
    });

    it('verificar la carga de paciente con datos obligatorios requeridos', () => {
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '11222333');
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'CON DNI');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.nombre).to.be.eq("CON DNI");
            expect(xhr.response.body.apellido).to.be.eq("TEST");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar lista de pacientes validados similares con porcentaje 83% y verificamos  respuesta match', () => {
        cy.route('POST', '**api/core/mpi/pacientes/validar').as('validacion');
        cy.fixture('mpi/paciente-validado2').as('paciente_validado2');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado2').as('renaper2');
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '33650509');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexButton('Validar Paciente').click();
        cy.toast('success');
        cy.plexTab('datos de contacto').click();
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq("MARTIN");
            expect(xhr.response.body.apellido).to.be.eq("BUCAREY");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '33650590');
        cy.plexText('label="Apellido"', 'Bucares');
        cy.plexText('label="Nombre"', 'Matias');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '09/04/1989');
        cy.plexTab('datos de contacto').click();
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('Existen pacientes similares, verifique las sugerencias');
        cy.contains('Aceptar').click();
        cy.contains('Similitud: 83 %');
        cy.plexButton(' Ignorar y Guardar ').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            //verificamos el resultado del match
            expect(xhr.response.body.resultadoMatching[0].match).to.be.eq(0.83);
            expect(xhr.response.body.resultadoMatching[0].paciente.estado).to.be.eq("validado");
            expect(xhr.response.body.resultadoMatching[0].paciente.documento).to.be.eq("33650509");
            expect(xhr.response.body.resultadoMatching[0].paciente.nombre).to.be.eq("MARTIN");
            expect(xhr.response.body.resultadoMatching[0].paciente.apellido).to.be.eq("BUCAREY");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();

    });

    it('verificar lista de pacientes validados similares con porcentaje mayor al 95%', () => {
        cy.route('POST', '**api/core/mpi/pacientes/validar').as('validacion');
        cy.fixture('mpi/paciente-validado3').as('paciente_validado3');
        cy.route('POST', '**api/core/mpi/pacientes/validar', '@paciente_validado3').as('renaper3');
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '10101010');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexButton('Validar Paciente').click();
        cy.toast('success');
        cy.plexTab('datos de contacto').click();
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq("MARIA CELESTE");
            expect(xhr.response.body.apellido).to.be.eq("RAMOS");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '10101010');
        cy.plexText('label="Apellido"', 'Ramos');
        cy.plexText('label="Nombre"', 'María');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '28/08/1986');
        cy.plexTab('datos de contacto').click();
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('El paciente ya existe, verifique las sugerencias');
        cy.contains('Aceptar').click();
        cy.contains('Similitud: 95 %');
    });

    it('crear paciente con similitud del 81% con uno existente temporal', () => {
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27799117');
        cy.plexText('label="Apellido"', 'Nuez');
        cy.plexText('label="Nombre"', 'Maria Julieta');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/10/2000');
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.nombre).to.be.eq("MARIA JULIETA");
            expect(xhr.response.body.apellido).to.be.eq("NUEZ");
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', '27799177');
        cy.plexText('label="Apellido"', 'Nuñez');
        cy.plexText('label="Nombre"', 'Maria');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '03/10/2000');
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.contains('Existen pacientes similares, verifique las sugerencias');
    });

    it('crear paciente con similitud del 98% con uno existente temporal y seleccionarlo para guardar', () => {
        cy.route('PUT', '**api/core/mpi/pacientes/**').as('putPaciente');

        // definimos ambos pacientes
        cy.plexText('name="buscador"', '1232548');
        const pacienteTemp1 = {
            dni: '27700887',
            nombre: 'Marta Luz',
            apellido: "Almendra",
            estado: 'temporal',
            sexo: 'femenino',
            fechaNacimiento: '03/09/2000'
        }
        const pacienteTemp2 = {
            dni: pacienteTemp1.dni,
            nombre: 'Marta',
            apellido: pacienteTemp1.apellido,
            estado: "temporal",
            sexo: pacienteTemp1.sexo,
            fechaNacimiento: pacienteTemp1.fechaNacimiento
        }
        // Buscador
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', pacienteTemp1.dni);
        cy.plexText('label="Apellido"', pacienteTemp1.apellido);
        cy.plexText('label="Nombre"', pacienteTemp1.nombre);
        cy.plexSelectType('label="Seleccione sexo"', pacienteTemp1.sexo);
        cy.plexDatetime('label="Fecha de Nacimiento"', pacienteTemp1.fechaNacimiento);
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq(pacienteTemp1.estado);
            expect(xhr.response.body.nombre).to.be.eq(pacienteTemp1.nombre.toUpperCase());
            expect(xhr.response.body.apellido).to.be.eq(pacienteTemp1.apellido.toUpperCase());
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();

        // se crea 2do paciente temporal
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
        cy.plexInt('label="Número de DNI ARGENTINO"', pacienteTemp2.dni);
        cy.plexText('label="Apellido"', pacienteTemp2.apellido);
        cy.plexText('label="Nombre"', pacienteTemp2.nombre);
        cy.plexSelectType('label="Seleccione sexo"', pacienteTemp2.sexo);
        cy.plexDatetime('label="Fecha de Nacimiento"', pacienteTemp2.fechaNacimiento);
        //datos de contacto temporal 2
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('El paciente ya existe, verifique las sugerencias').get('button').contains('Aceptar').click();
        cy.get('plex-layout-sidebar plex-item plex-label').contains('Similitud: 98 %');
        cy.plexButton('Seleccionar').click();

        cy.plexButton('Guardar').click();
        // se guarda paciente con datos del paciente seleccionado (pacienteTemp1)
        cy.wait('@putPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq(pacienteTemp1.nombre.toUpperCase());
            expect(xhr.response.body.apellido).to.be.eq(pacienteTemp1.apellido.toUpperCase());
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();
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
        cy.get('paciente-listado').contains('20.000.000');
        cy.get('plex-button[title="Editar paciente"]').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTab('datos de contacto').click();
        cy.plexText('name=direccion', direccion);
        cy.plexTab('Relaciones').click();

        cy.plexText('name="buscador"', '10000000');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].nombre).to.be.eq("PACIENTE VALIDADO");
            expect(xhr.response.body[0].apellido).to.be.eq("ANDES");
        });
        cy.get('paciente-listado').contains('10.000.000').parent().parent().click();

        cy.plexSelectType('name="nuevaRelacion"', 'otro');
        cy.get('plex-button[icon="plus"]').click();
        cy.contains('ANDES, PACIENTE VALIDADO');

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
