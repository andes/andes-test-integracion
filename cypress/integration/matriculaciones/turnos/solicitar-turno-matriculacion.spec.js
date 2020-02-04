
context('Solicitar turnos matriculaciones', () => {
    let token;

    before(() => {
        cy.seed();
        cy.server();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createAgendaMatriculaciones('agenda-matriculaciones', 80, 0, 2, 30, token);
        });
    })

    beforeEach(() => {
        cy.goto('/matriculaciones');
        cy.server();
    });

    it('Solicitar turno matrícula universitaria', () => {
        cy.plexButton('Requisitos generales').click();
        cy.plexDropdown('label="Matricularme por primera vez"').click();
        cy.get('div').contains(' MATRÍCULA UNIVERSITARIA').click();
        cy.contains('Requisitos para Matriculación de Profesionales Universitarios');
        cy.plexBool('label="He leído y acepto los requisitos"', true);
        cy.plexButton('Solicitar Turno').click();
        cy.get('.next').first().click();
        cy.get('.datepicker-days .day').not('td.old.day').not('td.disabled.disabled-date.day').contains('3').click();
        cy.plexButton('Continuar').should('have.prop', 'disabled', true);
        cy.get('.btn-horario').first().click();
        cy.plexButton('Continuar').click();

        //datos profesional
        cy.plexText('label="Apellido"', 'Estepa');
        cy.plexText('label="Nombre"', 'Atahualpa');
        cy.plexSelectType('label="Sexo"', 'femenino');
        cy.plexSelectType('label="Nacionalidad"', 'Argentina');
        cy.plexDatetime('label="Fecha de nacimiento"', '25/12/1920');
        cy.plexText('label="Lugar de Nacimiento"', 'Neuquén');
        cy.plexInt('label="C.U.I.T. / C.U.I.L."').type('20100010203');
        cy.plexSelectType('label="Tipo de documento"', 'DNI');
        cy.plexInt('label="Nº de documento"').type('10001020');
        cy.plexPhone('label="Número:"', '2986666666');
        cy.plexText('label="Dirección"', 'Chacabuco 700');
        cy.plexSelectType('name="provinciaReal"', 'Neuquén');
        cy.plexSelectType('name="localidadReal"', 'Andacollo');
        // cy.plexInt('label="Código Postal"').type('8353');
        cy.plexButton('completar domicilios').click();
        cy.plexSelectType('label="Profesión"', 'Médico');
        cy.plexText('label="Título"', 'Médico');
        cy.plexDatetime('label="Fecha de egreso"', '25/01/2015');
        cy.plexBool('label="Otra Entidad Formadora"', true);
        cy.plexText('label="Otra Entidad Formadora"', 'Universidad de Economía');
        cy.plexButton('Confirmar Turno').click();
        cy.toast('success', 'Se registro con exito!');
    });

    it('Solicitar turno matrícula universitaria y tratar de sacar otro para el mismo profesional', () => {
        cy.plexButton('Requisitos generales').click();
        cy.plexDropdown('label="Matricularme por primera vez"').click();
        cy.get('div').contains(' MATRÍCULA UNIVERSITARIA').click();
        cy.plexBool('label="He leído y acepto los requisitos"', true);
        cy.plexButton('Solicitar Turno').click();
        cy.get('.next').first().click();
        cy.get('.datepicker-days .day').not('td.old.day').not('td.disabled.disabled-date.day').contains('4').click();
        cy.plexButton('Continuar').should('have.prop', 'disabled', true);
        cy.get('.btn-horario').first().click();
        cy.plexButton('Continuar').click();

        //datos profesional
        cy.plexText('label="Apellido"', 'Molinon');
        cy.plexText('label="Nombre"', 'Lautaro');
        cy.plexSelectType('label="Sexo"', 'masculino');
        cy.plexSelectType('label="Nacionalidad"', 'Argentina');
        cy.plexDatetime('label="Fecha de nacimiento"', '01/01/1992');
        cy.plexText('label="Lugar de Nacimiento"', 'Neuquén');
        cy.plexInt('label="C.U.I.T. / C.U.I.L."').type('20365552223');
        cy.plexSelectType('label="Tipo de documento"', 'DNI');
        cy.plexInt('label="Nº de documento"').type('36555222');
        cy.plexPhone('label="Número:"', '2986666667');
        cy.plexText('label="Dirección"', 'Av. Argentina 800');
        cy.plexSelectType('name="provinciaReal"', 'Neuquén');
        cy.plexSelectType('name="localidadReal"', 'Neuquén');
        cy.plexInt('name="codigoPostalReal"').type('8300');
        cy.plexButton('completar domicilios').click();
        cy.plexSelectType('label="Profesión"', 'Médico');
        cy.plexText('label="Título"', 'Médico');
        cy.plexDatetime('label="Fecha de egreso"', '25/01/2015');
        cy.plexBool('label="Otra Entidad Formadora"', true);
        cy.plexText('label="Otra Entidad Formadora"', 'Universidad de Economía');
        cy.plexButton('Confirmar Turno').click();
        cy.toast('success', 'Se registro con exito!');

        //volver a sacar turno
        cy.plexDropdown('label="Matricularme por primera vez"').click();
        cy.get('div').contains(' MATRÍCULA UNIVERSITARIA').click();
        cy.plexBool('label="He leído y acepto los requisitos"', true);
        cy.plexButton('Solicitar Turno').click();
        cy.get('.next').first().click();
        cy.get('.datepicker-days .day').not('td.old.day').not('td.disabled.disabled-date.day').contains('5').click();
        cy.plexButton('Continuar').should('have.prop', 'disabled', true);
        cy.get('.btn-horario').last().click();
        cy.plexButton('Continuar').click();

        //datos profesional
        cy.plexText('label="Apellido"', 'Molinon');
        cy.plexText('label="Nombre"', 'Lautaro');
        cy.plexSelectType('label="Sexo"', 'masculino');
        cy.plexSelectType('label="Nacionalidad"', 'Argentina');
        cy.plexDatetime('label="Fecha de nacimiento"', '01/01/1992');
        cy.plexText('label="Lugar de Nacimiento"', 'Neuquén');
        cy.plexInt('label="C.U.I.T. / C.U.I.L."').type('20365552223');
        cy.plexSelectType('label="Tipo de documento"', 'DNI');
        cy.plexInt('label="Nº de documento"').type('36555222');
        cy.plexPhone('label="Número:"', '2986666667');
        cy.plexText('label="Dirección"', 'Av. Argentina 800');
        cy.plexSelectType('name="provinciaReal"', 'Neuquén');
        cy.plexSelectType('name="localidadReal"', 'Neuquén');
        cy.plexInt('name="codigoPostalReal"').type('8300');
        cy.plexButton('completar domicilios').click();
        cy.plexSelectType('label="Profesión"', 'Médico');
        cy.plexText('label="Título"', 'Médico');
        cy.plexDatetime('label="Fecha de egreso"', '25/01/2015');
        cy.plexBool('label="Otra Entidad Formadora"', true);
        cy.plexText('label="Otra Entidad Formadora"', 'Universidad de Economía');
        cy.plexButton('Confirmar Turno').click();
        cy.contains("usted ya tiene un turno para el dia ");
    });

    it('Solicitar turno matrícula técnica', () => {

        cy.plexButton('Requisitos generales').click();
        cy.plexDropdown('label="Matricularme por primera vez"').click();
        cy.get('div').contains(' MATRÍCULA TÉCNICA O AUXILIAR').click();
        cy.contains('Requisitos para Matriculación de Profesionales Técnicos y Auxiliares');
        cy.plexBool('label="He leído y acepto los requisitos"', true);
        cy.plexButton('Solicitar Turno').click();
        cy.get('.datepicker-days .day').not('td.old.day').not('td.disabled.disabled-date.day').contains('7').click();
        cy.plexButton('Continuar').should('have.prop', 'disabled', true);
        cy.get('.btn-horario').first().click();
        cy.plexButton('Continuar').click();

        //datos profesional
        cy.plexText('label="Apellido"', 'Estepa');
        cy.plexText('label="Nombre"', 'Pachamama');
        cy.plexSelectType('label="Sexo"', 'masculino');
        cy.plexSelectType('label="Nacionalidad"', 'Argentina');
        cy.plexDatetime('label="Fecha de nacimiento"', '25/11/1925');
        cy.plexText('label="Lugar de Nacimiento"', 'Neuquén');
        cy.plexInt('label="C.U.I.T. / C.U.I.L."').type('20100080203');
        cy.plexSelectType('label="Tipo de documento"', 'DNI');
        cy.plexInt('label="Nº de documento"').type('10008020');
        cy.plexPhone('label="Número:"', '2987666666');
        cy.plexText('label="Dirección"', 'Jujuy 300');
        cy.plexSelectType('name="provinciaReal"', 'Neuquén');
        cy.plexSelectType('name="localidadReal"', 'Andacollo');
        cy.plexButton('completar domicilios').click();
        cy.plexSelectType('label="Profesión"', 'Médico');
        cy.plexText('label="Título"', 'Médico');
        cy.plexDatetime('label="Fecha de egreso"', '23/02/2015');
        cy.plexBool('label="Otra Entidad Formadora"', true);
        cy.plexText('label="Otra Entidad Formadora"', 'Universidad de Economía');
        cy.plexButton('Confirmar Turno').click();
        cy.toast('success', 'Se registro con exito!');

    });

    it('Solicitar turno renovación', () => {
        cy.route('POST', '**api/modules/matriculaciones/turnos/**').as('nuevoTurno');
        cy.plexButton('Requisitos generales').click();
        cy.plexButton('Solicitar turno para renovación').click();
        cy.get('.next').first().click();
        cy.get('.datepicker-days .day').not('td.old.day').not('td.disabled.disabled-date.day').contains('6').click();
        cy.plexButton('Continuar').should('have.prop', 'disabled', true);
        cy.get('.btn-horario').first().click();
        cy.plexButton('Continuar').click();
        cy.plexText('name="nombre"', 'JAZMIN');
        cy.plexText('name="apellido"', 'CORTES');
        cy.plexInt('name="documento"', '4402222');
        cy.plexButton('Buscar').click();
        cy.contains(" CORTES, JAZMIN - 4402222");
        cy.plexButton('Confirmar turno').click();
        cy.wait('@nuevoTurno').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.tipo).to.be.eq("renovacion");
        });
        cy.toast('success', 'Se registro con exito!');
    });


})