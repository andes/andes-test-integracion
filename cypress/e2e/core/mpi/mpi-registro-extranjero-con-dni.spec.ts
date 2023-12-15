context('MPI-Registro Paciente Extranjero Con DNI Argentino', () => {
    let token;

    const pacienteExtranjero = {
        nombre: "PACIENTE",
        apellido: "EXTRANJERO",
        estado: "temporal",
        fechaNacimiento: "1996-08-28T04:00:00.000Z",
        tipoIdentificacion: "dni extranjero",
        numeroIdentificacion: "55555555"
    }

    const pacienteValidado = {
        documento: "10000001",
        nombre: "DOMINGO",
        apellido: "FELIPE",
        estado: "validado",
        fechaNacimiento: "1996-08-28T04:00:00.000Z",
    }

    const pacienteDuplicado = {
        documento: "10000001",
        nombre: "PACIENTE",
        apellido: "DUPLICADO",
        estado: "validado",
        fechaNacimiento: "1996-08-28T04:00:00.000Z",
    }

    before(() => {
        cy.seed();
        cy.cleanDB()
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    const completarPaciente = () => {
        cy.cleanDB()
        cy.task('database:create:paciente', pacienteExtranjero).then(paciente => {
            cy.goto('/apps/mpi/busqueda', token);

            cy.intercept('GET', '**api/core-v2/mpi/pacientes**').as('busqueda');
            cy.intercept('POST', '**api/core-v2/mpi/pacientes**').as('guardar');

            cy.plexText('name="buscador"', paciente.apellido);

            cy.wait('@busqueda').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200);
            });

            cy.get('paciente-listado').find('plex-button[title="Editar paciente"]').first().click({ force: true });
            cy.get('plex-bool[label="Registrar DNI argentino"]').click();

            cy.plexInt('name="documento"', "10000001");
            cy.plexSelectType('name="sexo"').eq(1).type('masculino');
            cy.plexTab('datos de contacto').click();
            cy.plexBool('label="Sin datos de contacto"', true);
            cy.plexBool('name="viveProvActual"', true);
            cy.plexBool('name="viveLocActual"', true);
            cy.plexTab('datos básicos').click();
        });
    }

    const crearDuplicado = () =>
        cy.task('database:create:paciente', pacienteDuplicado)

    it('completar datos sin permitir guardar cuando no esta validado ', () => {
        completarPaciente();

        cy.plexButton('Guardar').should('have.prop', 'disabled', true);
    });

    it('buscar paciente extranjero y validarlo con DNI argentino', () => {
        completarPaciente();

        cy.intercept('GET', '**api/core-v2/mpi/pacientes**').as('nuevaBusqueda');
        cy.intercept('POST', '**api/core-v2/mpi/validacion', pacienteValidado).as('renaper');

        cy.plexButton('Validar Paciente').click();
        cy.wait('@renaper').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.plexButton('Guardar').should('have.prop', 'disabled', false);

        cy.plexButton('Guardar').click();
        cy.wait('@guardar').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.contains('Los datos se actualizaron correctamente');
        cy.contains('Aceptar').click();
        cy.plexText('name="buscador"', pacienteValidado.documento);

        cy.wait('@nuevaBusqueda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(304);
        });

        cy.get('paciente-listado').contains(pacienteValidado.apellido);
        cy.get('paciente-listado').contains(pacienteValidado.nombre);
    });

    it('validacion de paciente extranjero y carga de paciente con DNI duplicado', () => {
        completarPaciente();

        crearDuplicado().then((duplicado) => {
            cy.intercept('GET', '**api/core-v2/mpi/pacientes**', (req) => {
                req.continue(res => {
                    res.body = [{ ...duplicado, contacto: null }]

                    cy.plexButton('Validar Paciente').click();

                    cy.wait('@getPaciente').then(({ response }) => {
                        expect(response.statusCode).to.be.eq(200);
                    });

                    cy.contains('Aceptar').click();
                    cy.plexButton('Guardar').click();
                    cy.contains('Aceptar').click();
                })
            }).as('getPaciente');
        })
    });
});