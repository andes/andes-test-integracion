context('MPI-Registro Paciente Bebé', () => {
    let token;
    let progenitor;
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente').then(p => {
                progenitor = p;
            })
        });

    })

    beforeEach(() => {
        cy.goto('/apps/mpi/bebe/mpi', token);
        cy.server();
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('buscar progenitor por documento y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.documento);
        cy.get('paciente-listado').find('td').contains(progenitor.documento);
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('documento', progenitor.documento)
        });

    });

    it('buscar progenitor por documento y verificar que no existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', '00000000');
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains('¡No se encontró ningún paciente!');

    });

    it('buscar progenitor por nombre y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.nombre);
        cy.get('paciente-listado').find('td').contains(progenitor.nombre);
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('nombre', progenitor.nombre)
        });

    });

    it('buscar progenitor por nombre/apellido y verificar que no existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', 'INEXISTENTE');
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains('¡No se encontró ningún paciente!');

    });

    it('buscar progenitor por apellido y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.apellido);
        cy.get('paciente-listado').find('td').contains(progenitor.apellido);
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0]).to.have.property('apellido', progenitor.apellido)
        });

    });



    it('ingresar apellido y nombre y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de contacto de paciente', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de dirección', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexButton('Guardar').click();
        cy.wait(2000);
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("MARTINEZ");
            expect(xhr.response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y telefono móvil', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("MARTINEZ");
            expect(xhr.response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y telefono fijo', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'fijo');
        cy.plexPhone('label="Número"', '4752158');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("MARTINEZ");
            expect(xhr.response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos e email', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'email');
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.apellido).to.be.eq("MARTINEZ");
            expect(xhr.response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y una nota', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelect('label="Sexo"').click();
        cy.plexSelect('label="Sexo"', 'masculino').click();
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexSelect('label="Tipo"', 'email');
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('label="No posee ningún tipo de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexTab('Notas').click();
        cy.plexText('name="nuevaNota"', 'Test Note');
        cy.plexButton('Agregar Nota').click();
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq("temporal");
            expect(xhr.response.body.notas).to.have.length(1);
            expect(xhr.response.body.apellido).to.be.eq("MARTINEZ");
            expect(xhr.response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });


    it('verificar la carga de una nota y verificar que aparezca en el listado de notas', () => {
        cy.plexTab('Notas').click();
        cy.plexText('name="nuevaNota"', 'Test Note');
        cy.plexButton('Agregar Nota').click();
        cy.contains('Test Note');
    });

    it('ingresar scan de progenitor existente y verificar datos básicos ingresados', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', '00535248130@TUTOR@ANCESTRO@F@66000666@B@11/10/2000@14/02/2018@200').should('have.value', '00535248130@TUTOR@ANCESTRO@F@66000666@B@11/10/2000@14/02/2018@200');
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.plexText('name="documentoRelacion"').should('have.value', '66000666');
            cy.plexText('name="nombreRelacion"').should('have.value', 'ANCESTRO');
            cy.plexText('name="apellidoRelacion"').should('have.value', 'TUTOR');
            // [TODO] En local el parseo de la fecha devuelve un dia menos. En jenkins va bien. 
            cy.plexDatetime('name="fechaNacimientoRelacion"').find('input').should('have.value', '11/10/2000');
            cy.plexSelectType('name="sexoRelacion"').contains('Femenino');
        });
    });
})