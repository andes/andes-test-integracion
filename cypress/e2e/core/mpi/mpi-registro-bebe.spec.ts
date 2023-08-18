context('MPI-Registro Paciente Bebé', () => {
    let token;
    let progenitor, progenitorScan;
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente').then(p => {
                progenitor = p;
            });
            cy.task('database:create:paciente', {
                template: 'validado',
                nombre: 'ANDES',
                apellido: 'PACIENTE',
                documento: 123456789,
                sexo: "masculino",
                genero: "masculino",
                scan: "00535248130@PACIENTE@ANDES@M@123456789@B@26/12/1956@14/02/2018@200",
            }).then(p => {
                progenitorScan = p
            });
        });

    })

    beforeEach(() => {
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**', req => {
            delete req.headers['if-none-match']
        }).as('busquedaProgenitor');
        cy.intercept('POST', '**api/core-v2/mpi/pacientes**', req => {
            delete req.headers['if-none-match']
        }).as('registroBebe');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**', req => {
            delete req.headers['if-none-match']
        }).as('busquedaPaciente');
        cy.goto('/apps/mpi/paciente/bebe/mpi', token);
    });

    it('verificar campos obligatorios de datos basicos de paciente', () => {
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('buscar progenitor por documento y verificar que existe', () => {
        cy.plexText('name="buscador"', progenitor.documento);
        cy.get('paciente-listado').contains(format(progenitor.documento));
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('documento', progenitor.documento)
        });
    });

    it('buscar progenitor por documento y verificar que no existe', () => {
        cy.plexText('name="buscador"', '00000000');
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(0);
        });
        cy.contains('No se encontró ningún paciente..');
    });

    it('buscar progenitor por nombre y verificar que existe', () => {
        cy.plexText('name="buscador"', progenitor.nombre);
        cy.get('paciente-listado').contains(progenitor.nombre);
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('nombre', progenitor.nombre)
        });

    });

    it('buscar progenitor por nombre/apellido y verificar que no existe', () => {
        cy.plexText('name="buscador"', 'INEXISTENTE');
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(0);
        });
        cy.contains('No se encontró ningún paciente..');
    });

    it('buscar progenitor por apellido y verificar que existe', () => {
        cy.plexText('name="buscador"', progenitor.apellido);
        cy.get('paciente-listado').contains(progenitor.apellido);
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0]).to.have.property('apellido', progenitor.apellido)
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
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de dirección', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexButton('Guardar').click();
        cy.contains('Debe completar los datos obligatorios');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("MARTINEZ");
            expect(response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y telefono móvil', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.plexSelect('label="Tipo"', 'celular');
        cy.plexPhone('label="Número"', '2990000000');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("MARTINEZ");
            expect(response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y telefono fijo', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.plexSelect('label="Tipo"', 'fijo');
        cy.plexPhone('label="Número"', '2994752158');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("MARTINEZ");
            expect(response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos e email', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.get('plex-select[label="Tipo"]').last().click().contains('Email').click({ force: true });
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq("MARTINEZ");
            expect(response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('verificar la carga de bebé con datos obligatorios requeridos y una nota', () => {
        cy.plexText('label="Apellido"', 'Martinez');
        cy.plexText('label="Nombre"', 'Mario');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', '02/10/2019');
        cy.plexTab('datos de contacto').click();
        cy.get('plex-select[label="Tipo"]').last().click().contains('Email').click({ force: true });
        cy.plexText('label="Dirección"', 'mail@mail.com');
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexTab('Notas').click();
        cy.plexButton('Agregar nota').click();
        cy.plexText('name="titulo"', 'Nueva nota');
        cy.get('plex-text[name="nota"] input').first().type('Esta es una nueva nota', { force: true });
        cy.plexButtonIcon('plus').click();
        cy.get('plex-item').contains('Nueva nota');
        cy.get('plex-item').contains('Esta es una nueva nota');
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.notas).to.have.length(1);
            expect(response.body.apellido).to.be.eq("MARTINEZ");
            expect(response.body.nombre).to.be.eq("MARIO");
        });
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('ingresar scan de progenitor existente y verificar datos básicos ingresados', () => {
        cy.plexText('name="buscador"', progenitorScan.scan);
        cy.log(progenitorScan);
        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.plexText('name="documentoRelacion"').should('have.value', progenitorScan.documento);
        cy.plexText('name="nombreRelacion"').should('have.value', progenitorScan.nombre);
        cy.plexText('name="apellidoRelacion"').should('have.value', progenitorScan.apellido);
        cy.plexDatetime('name="fechaNacimientoRelacion"').find('input').should('have.value', Cypress.moment(progenitorScan.fechaNacimiento).format("DD/MM/YYYY"));
        cy.plexSelect('name="sexoRelacion"').contains('Masculino');
    });

    it('cargar un bebe con un progenitor y verificar documento progenitor al buscar bebe en listado', () => {
        let nombreBebe = 'VIOLETA';
        let apellidoBebe = 'COLOR';
        // se cargan datos basicos del bebe
        cy.plexText('label="Apellido"', apellidoBebe);
        cy.plexText('label="Nombre"', nombreBebe);
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', Cypress.moment().format("DD/MM/YYYY"));        // se agrega progenitor/a
        cy.plexText('name="buscador"', progenitorScan.nombre);
        cy.get('paciente-listado plex-item').contains(progenitorScan.nombre).click();
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.length).to.be.gte(1);
            expect(response.body[0]).to.have.property('nombre', progenitorScan.nombre)
        });
        cy.plexText('name="documentoRelacion"').should('have.value', progenitorScan.documento);        //se cargan datos de contacto
        cy.plexTab('datos de contacto').click();
        cy.plexBool('name="noPoseeContacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq(apellidoBebe);
            expect(response.body.nombre).to.be.eq(nombreBebe);
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', nombreBebe);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('paciente-listado plex-item').contains(nombreBebe);
        cy.plexBadge(' Sin DNI ');
        // verificamos que se vea el documento del progenitor en paciente listado
        cy.get('paciente-listado plex-item').contains(format(progenitorScan.documento));
    });

    it('cargar un bebe con un progenitor y verificar que se vea documento progenitor en el detalle del bebe', () => {
        let nombreBebe = 'ROSA';
        let apellidoBebe = 'COLOR';
        //se cargan datos basicos del bebe
        cy.plexText('label="Apellido"', apellidoBebe);
        cy.plexText('label="Nombre"', nombreBebe);
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('label="Fecha y hora de Nacimiento"', Cypress.moment().format("DD/MM/YYYY"));
        //se agrega progenitor/a
        cy.plexText('name="buscador"', progenitorScan.nombre);
        cy.get('paciente-listado plex-item').contains(progenitorScan.nombre).click();
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.length).to.be.gte(1);
            expect(response.body[0]).to.have.property('nombre', progenitorScan.nombre)
        });
        cy.plexText('name="documentoRelacion"').should('have.value', progenitorScan.documento);
        cy.plexTab('datos de contacto').click();
        cy.plexBool('name="noPoseeContacto"', true).check({ force: true });
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();
        cy.wait('@registroBebe').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq("temporal");
            expect(response.body.apellido).to.be.eq(apellidoBebe);
            expect(response.body.nombre).to.be.eq(nombreBebe);
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
        cy.plexText('name="buscador"', nombreBebe);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('paciente-listado plex-item').contains(nombreBebe).click();

        cy.wait('@busquedaProgenitor').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('paciente-detalle').plexIcon('help');
        cy.get('paciente-detalle').plexBadge(' Sin DNI ');
        // verificamos que se vea el documento del progenitor en paciente detalle
        cy.get('paciente-detalle').contains(format(progenitorScan.documento));
        // verificamos que este el documento del progenitor en las relaciones del paciente (sidebar)
        cy.get('plex-layout-sidebar').get('paciente-listado plex-item').contains(format(progenitorScan.documento));
    });
})

function format(s) {
    return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}