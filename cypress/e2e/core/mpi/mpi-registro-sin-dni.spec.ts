context('MPI-Registro Paciente Sin DNI', () => {
    let token;
    let paciente;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente', 'validado').then(pacientes => {
            paciente = pacientes[0];
        });
        cy.login('38906735', 'asd').then(t => {
            token = t;
            // cy.createPaciente('mpi/relacion', token);
        });

    })

    beforeEach(() => {
        cy.intercept('POST', '**api/core-v2/mpi/pacientes**', req => {
            delete req.headers['if-none-match']
        }).as('registroSinDni');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**', req => {
            delete req.headers['if-none-match']
        }).as('busquedaRelacion');
        cy.goto('/apps/mpi/paciente/sin-dni/mpi', token);
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('ingresar apellido y nombre y verificar campos obligatorios de datos básicos de paciente', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y sin contacto', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("TEST");
            expect(response.body.nombre).to.be.eq("SIN DNI");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos contactos', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexButtonIcon('plus').click();
        cy.get('plex-select[label="Tipo"]').last().click().contains('Teléfono Fijo').click();
        cy.plexPhone('label="Número"').last().type('2994785215');
        cy.plexButtonIcon('plus').click();
        cy.get('plex-select[label="Tipo"]').last().click().contains('Email').click({ force: true });
        cy.plexText('label="Dirección"').type('mail@mail.com');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("TEST");
            expect(response.body.nombre).to.be.eq("SIN DNI");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('buscar en la pestaña relaciones un paciente por dni que no exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.plexText('name="buscador"', '000000001');
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar en la pestaña relaciones un paciente por dni que exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.plexText('name="buscador"', paciente.documento);
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('documento', paciente.documento)
        });
    });

    it('buscar en la pestaña relaciones un paciente por nombre/apellido que exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.plexText('name="buscador"', paciente.nombre);
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('apellido', paciente.apellido)
        });
        cy.plexText('name="buscador"', ' ' + paciente.apellido);
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('nombre', paciente.nombre)
        });
    });

    it('buscar en la pestaña relaciones scan de progenitor y verificar datos básicos ingresados', () => {
        cy.plexTab('Relaciones').click();
        cy.plexText('name="buscador"', '00535248130@ANDES@PACIENTE VALIDADO@M@10000000@B@26/12/1956@14/02/2018@200');
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            cy.get('paciente-listado').contains(format(paciente.documento));
            cy.get('paciente-listado').contains(paciente.nombre);
            cy.get('paciente-listado').contains(paciente.apellido);
        });
    });

    it('buscar en la pestaña relaciones un paciente por nombre/apellido que no exista y verificar mensaje', () => {
        cy.plexTab('Relaciones').click();
        cy.plexText('name="buscador"', 'INEXISTENTE');
        cy.wait('@busquedaRelacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('verificar la carga de paciente con datos obligatorios requeridos y una nota', () => {
        cy.plexText('label="Apellido"', 'TEST');
        cy.plexText('label="Nombre"', 'SIN DNI');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de Nacimiento"', '02/10/2019');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexTab('Notas').click();
        cy.plexButton('Agregar nota').click();
        cy.plexText('name="titulo"', 'Nueva nota');
        cy.get('plex-text[name="nota"] input').first().type('Esta es una nueva nota', { force: true });
        cy.plexButtonIcon('check').click();
        cy.get('plex-item').contains('Nueva nota');
        cy.get('plex-item').contains('Esta es una nueva nota');
        cy.plexButton('Guardar').click();
        cy.wait('@registroSinDni').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.notas).to.have.length(1);
        });
        cy.contains('Los datos se actualizaron correctamente');
    });
});

function format(s) {
    return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}
