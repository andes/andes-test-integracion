/// <reference types="Cypress" />

context('Inscripción-Vacunas', () => {
    let token;

    before(() => {
        cy.seed();
    });


    beforeEach(() => {
        cy.server();
        cy.goto('/vacunacion/inscripcion', token);
    })

    it('Inscripción personal de salud', () => {
        cy.plexSelectType('name="grupo"', 'personal de salud');
        cy.plexText('name="documento"', '35593546');
        cy.plexInt('name="nroTramite"', '00564695254');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', '18/01/1991');
        cy.plexText('name="apellido"', 'Palavecino');
        cy.plexText('name="nombre"', 'Mariano Andres');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="alergia"', true);
        cy.plexText('name="establecimiento"', 'luegar prueba');
        cy.plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.plexRadio('name="relacion"', 1);
        cy.plexSelectType('name="profesiones"', 'enfermero');
        cy.plexInt('name="matricula"', '888999');
        cy.plexButton('Inscribirme').click();
        cy.get('plex-modal').find('plex-modal-title').contains('Inscripción a Vacunación contra el covid-19');
        cy.get('plex-modal').find('main').contains(' Ha sido inscripto correctamente en el plan público, gratuito y optativo contra COVID-19. ');
        cy.get('plex-modal').find('main').contains(' Tenemos toda la información necesaria para contactarnos con usted una vez que la dosis esté disponible. ');
        cy.get('plex-modal').find('main').contains(' Recuerde que la inscripción no garantiza la reserva del turno. ');
    });

    it('Inscripción mayores de 60', () => {
        cy.plexSelectType('name="grupo"', 'mayores de 60');
        cy.plexText('name="documento"', '29410428');
        cy.plexInt('name="nroTramite"', '0082490995');
        cy.plexSelectType('name="sexo"', 'femenino');
        cy.plexDatetime('name="fechaNacimiento"', '23/08/1960');
        cy.plexText('name="apellido"', 'Celeste');
        cy.plexText('name="nombre"', 'Carolina');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="alergia"', true);
        cy.plexBool('name="condicion"', true);
        cy.plexBool('name="enfermedad"', true);
        cy.plexBool('name="convaleciente"', true);
        cy.plexBool('name="aislamiento"', true);
        cy.plexBool('name="vacuna"', true);
        cy.plexBool('name="plasma"', true);
        cy.plexButton('Inscribirme').click();
        cy.get('plex-modal').find('plex-modal-title').contains('Inscripción a Vacunación contra el covid-19');
        cy.get('plex-modal').find('main').contains(' Ha sido inscripto correctamente en el plan público, gratuito y optativo contra COVID-19. ');
        cy.get('plex-modal').find('main').contains(' Tenemos toda la información necesaria para contactarnos con usted una vez que la dosis esté disponible. ');
        cy.get('plex-modal').find('main').contains(' Recuerde que la inscripción no garantiza la reserva del turno. ');
    });

    it('Inscripción discapacidad y factores de riesgo', () => {
        cy.plexSelect('name="grupo"', 2).click();
        cy.plexText('name="documento"', '30403872');
        cy.plexInt('name="nroTramite"', '0082492836');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', '29/08/1983');
        cy.plexText('name="apellido"', 'Uribe');
        cy.plexText('name="nombre"', 'Federico');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexText('name="cud"', '8804208016');
        cy.plexSelectType('name="diaseleccionados"', 'martes');
        cy.plexButton('Inscribirme').click();
        cy.get('plex-modal').find('plex-modal-title').contains('Inscripción a Vacunación contra el covid-19');
        cy.get('plex-modal').find('main').contains(' Ha sido inscripto correctamente en el plan público, gratuito y optativo contra COVID-19. ');
        cy.get('plex-modal').find('main').contains(' Tenemos toda la información necesaria para contactarnos con usted una vez que la dosis esté disponible. ');
        cy.get('plex-modal').find('main').contains(' Recuerde que la inscripción no garantiza la reserva del turno. ');
    });

    it('Inscripción personal de salud con fecha incorrecta', () => {
        cy.plexSelectType('name="grupo"', 'personal de salud');
        cy.plexText('name="documento"', '35593546');
        cy.plexInt('name="nroTramite"', '00564695254');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', Cypress.moment().add(1, 'days').format('DD/MM/YYYY'));
        cy.plexDatetime('name="fechaNacimiento"').find('plex-validation-messages').contains('El valor debe ser menor a ' + Cypress.moment().format('DD/MM/YYYY'));
    });

    it('Inscripción mayores de 60 con fecha incorrecta', () => {
        cy.plexSelectType('name="grupo"', 'mayores de 60');
        cy.plexText('name="documento"', '35593546');
        cy.plexInt('name="nroTramite"', '00564695254');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', '18/01/1991');
        cy.plexDatetime('name="fechaNacimiento"').find('plex-validation-messages').contains('El valor debe ser menor a ' + Cypress.moment().format('DD/MM') + '/1961');
    });

    it('Inscripción discapacidad y factores de riesgo con fecha incorrecta', () => {
        cy.plexSelect('name="grupo"', 2).click();
        cy.plexText('name="documento"', '35593546');
        cy.plexInt('name="nroTramite"', '00564695254');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', '18/01/2004');
        cy.plexDatetime('name="fechaNacimiento"').find('plex-validation-messages').contains('El valor debe ser menor a ' + Cypress.moment().format('DD/MM') + '/2003');
    });

    it('Inscripción - Número de trámite inválido', () => {
        cy.plexSelectType('name="grupo"', 'personal de salud');
        cy.plexText('name="documento"', '27381849');
        cy.plexInt('name="nroTramite"', '0099999999');
        cy.plexSelectType('name="sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', '14/11/1979');
        cy.plexText('name="apellido"', 'Fernandez');
        cy.plexText('name="nombre"', 'Hector Hugo');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="alergia"', true);
        cy.plexText('name="establecimiento"', 'luegar prueba');
        cy.plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.plexRadio('name="relacion"', 1);
        cy.plexSelectType('name="profesiones"', 'enfermero');
        cy.plexInt('name="matricula"', '888999');
        cy.plexButton('Inscribirme').click();
        cy.swal('confirm', 'Número de Trámite inválido');
    });

    it('Inscripción - No es posible verificar su identidad', () => {
        cy.plexSelectType('name="grupo"', 'personal de salud');
        cy.plexText('name="documento"', '27381849');
        cy.plexInt('name="nroTramite"', '00999999');
        cy.plexSelectType('name="sexo"', 'femenino');
        cy.plexDatetime('name="fechaNacimiento"', '14/11/1979');
        cy.plexText('name="apellido"', 'Ramirez');
        cy.plexText('name="nombre"', 'Hugo');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="alergia"', true);
        cy.plexText('name="establecimiento"', 'luegar prueba');
        cy.plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.plexRadio('name="relacion"', 1);
        cy.plexSelectType('name="profesiones"', 'enfermero');
        cy.plexInt('name="matricula"', '888999');
        cy.plexButton('Inscribirme').click();
        cy.swal('confirm', 'No es posible verificar su identidad. Por favor verifique sus datos');
    });

    it('Inscripción - Existe una inscripción registrada', () => {
        cy.plexSelectType('name="grupo"', 'personal de salud');
        cy.plexText('name="documento"', '36753219');
        cy.plexInt('name="nroTramite"', '00142454582');
        cy.plexSelectType('name="sexo"', 'femenino');
        cy.plexDatetime('name="fechaNacimiento"', '22/09/1992');
        cy.plexText('name="apellido"', 'Otero');
        cy.plexText('name="nombre"', 'Juliana');
        cy.plexSelectType('label="Localidad de Residencia"', 'neuquen');
        cy.plexPhone('name="telefono"', '2944999999');
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="alergia"', true);
        cy.plexText('name="establecimiento"', 'luegar prueba');
        cy.plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.plexRadio('name="relacion"', 1);
        cy.plexSelectType('name="profesiones"', 'enfermero');
        cy.plexInt('name="matricula"', '888999');
        cy.plexButton('Inscribirme').click();
        cy.swal('confirm', 'Existe una inscripción registrada');
    });
})