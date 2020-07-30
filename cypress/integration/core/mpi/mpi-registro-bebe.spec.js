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
        cy.goto('/apps/mpi/paciente/bebe/mpi', token);
        cy.server();
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('buscar progenitor por documento y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.documento);
        cy.get('paciente-listado').contains(format(progenitor.documento));
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
        cy.contains('No se encontró ningún paciente..');
    });

    it('buscar progenitor por nombre y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.nombre);
        cy.get('paciente-listado').contains(progenitor.nombre);
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
        cy.contains('No se encontró ningún paciente..');
    });

    it('buscar progenitor por apellido y verificar que existe', () => {
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.plexText('name="buscador"', progenitor.apellido);
        cy.get('paciente-listado').contains(progenitor.apellido);
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
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de contacto de paciente', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de dirección', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos', () => {
        cy.route('POST', '**api/core/mpi/pacientes**').as('registroBebe');
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexPhone('label="Número"', '2990000000');
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
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
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
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexSelect('label="Tipo"', 'fijo');
        cy.plexPhone('label="Número"', '2994752158');
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
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.get('plex-select[label="Tipo"]').last().click().contains('Email').click();
        cy.plexText('label="Dirección"', 'mail@mail.com');
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
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.get('plex-select[label="Tipo"]').last().click().contains('Email').click();
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexTab('Notas').click();
        cy.plexButton('Agregar nota').click();
        cy.plexText('name="titulo"', 'Nueva nota');
        cy.get('plex-text[name="nota"] input').first().type('Esta es una nueva nota', { force: true });
        cy.get('plex-button[name="confirmarNota"]').click();
        cy.get('plex-item').contains('Nueva nota');
        cy.get('plex-item').contains('Esta es una nueva nota');
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

    // it('ingresar scan de progenitor existente y verificar datos básicos ingresados', () => {
    //     cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
    //     cy.plexText('name="buscador"', '00535248130@TUTOR@ANCESTRO@F@66000666@B@11/10/2000@14/02/2018@200').should('have.value', '00535248130@TUTOR@ANCESTRO@F@66000666@B@11/10/2000@14/02/2018@200');
    //     cy.wait('@busquedaProgenitor').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //         cy.plexText('name="documentoRelacion"').should('have.value', '66000666');
    //         cy.plexText('name="nombreRelacion"').should('have.value', 'ANCESTRO');
    //         cy.plexText('name="apellidoRelacion"').should('have.value', 'TUTOR');
    //         // [TODO] En local el parseo de la fecha devuelve un dia menos. En jenkins va bien. 
    //         cy.plexDatetime('name="fechaNacimientoRelacion"').find('input').should('have.value', '11/10/2000');
    //         cy.plexSelectType('name="sexoRelacion"').contains('Femenino');
    //     });
    // });
})

function format(s) {
    return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}