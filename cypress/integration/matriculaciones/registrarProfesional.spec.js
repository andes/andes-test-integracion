/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)
        cy.visit(Cypress.env('BASE_URL') + '/listarProfesionales', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('cargar profesional no existentes en matriculaciones', () => {
        cy.server();
        //DATOS GENERALES 

        cy.get('plex-button[label="Nuevo Profesional"]').click();
        cy.get('plex-text[label="apellido"] input').first().type('Palavecino');
        cy.get('plex-text[label="Nombre"] input').first().type('Mariano');
        cy.get('plex-select[label="Sexo"] input').first().type('masculino{enter}');
        cy.get('plex-select[label="Nacionalidad"] input').first().type('argentina{enter}');
        cy.get('plex-datetime[label="Fecha de Nacimiento"] input').first().type('18/01/1991');
        cy.get('plex-text[label="Lugar de Nacimiento"] input').first().type('San Carlos de Bariloche');
        cy.get('plex-int[label="C.U.I.T. / C.U.I.L."] input').first().type('2a3b3f5d5e9r3y5d4f6w9').should('have.value', '23355935469');
        cy.get('plex-select[label="Tipo de Documento"] input').first().type('dni{enter}');
        cy.get('plex-int[label="Nº de Documento"] input').first().type('3a5c5d9w3r5e4q6').should('have.value', '35593546');

        //DATOS CONTACTO
        cy.get('plex-phone[label="Numero:"] input').first().type('2944785630');

        //DATOS DOMICILIO

        //Domicilio Real
        cy.get('plex-select[name="provinciaReal"] input').first().type('Neuquen{enter}');
        cy.get('plex-select[name="localidadReal"] input').first().type('Neuquen{enter}');
        cy.get('plex-text[name="direccionReal"] input').first().type('Dewey 521');
        cy.get('plex-int[name="codigoPostalReal"] input').should('have.value', '8300');

        //Al hacer click en el boton "completar domicilios" se llenan los campos del Domicilio Legal y Profesional 
        cy.get('plex-button[label="completar domicilios"]').click();


        //DATOS PROFESION

        cy.get('plex-select[name="formacionPosgrado"] input').first().type('Kinesiólogo{enter}');
        cy.get('plex-text[name="titulo"] input').first().type('Licenciatura de Kinesiologia');
        cy.get('plex-datetime[name="fechaEgreso"] input').first().type('05/11/2007');

        // Por defecto esta tildada la opcion de "Otra entidad Formadora", de esta manera le sacamos el check para ver si se comporta correctamente
        cy.get('plex-bool[label="Otra Entidad Formadora"] input[type="checkbox"]').uncheck({
            force: true
        }).should('not.be.checked');

        cy.get('plex-select[name="entidadFormadora"] input').first().type('Escuela superior de salud publica{enter}');

        //ACEPTAR LOS DATOS CARGADOS

        cy.get('plex-button[label="Confirmar Datos"]').click();
        cy.wait(1000);
        cy.get('div[class="simple-notification toast success"]').contains('Se registro con exito');
        cy.wait(4000);
        //VALIDAMOS LOS DATOS CARGADOS ANTERIORMENTE 
        cy.get('div').should('contain', 'Palavecino, Mariano');
        cy.should('contain', '27 años');
        cy.get('div').should('contain', '35593546');

        cy.get('div').should('contain', 'Dewey 521');
        cy.get('div').should('contain', '8300');
        cy.get('div').should('contain', 'Neuquén');
        cy.get('div').should('contain', 'Argentina');
        cy.get('div').should('contain', '2944785630');

        cy.get('plex-button[label="volver"]').click();

        //BUSCA EN LA LISTA PARA CORROBORAR QUE SE CARGO EXITOSAMENTE
        cy.get('plex-text[label="Documento"] input').first().type('35593546');
        cy.wait(4000);
        cy.get('tbody td span[class="badge badge-success"]').contains('MA');
        cy.get('tbody span').contains('35593546');
        cy.get('tbody td').contains('Palavecino, Mariano');
        cy.get('tbody span').contains('18/01/1991');
        cy.get('tbody span').contains('27 años');

    });

    it('cargar profesional ya existente en matriculaciones', () => {
        cy.server();

        //DATOS GENERALES 

        cy.get('plex-button[label="Nuevo Profesional"]').click();
        cy.get('plex-text[label="apellido"] input').first().type('Palavecino');
        cy.get('plex-text[label="Nombre"] input').first().type('Mariano');
        cy.get('plex-select[label="Sexo"] input').first().type('masculino{enter}');
        cy.get('plex-select[label="Nacionalidad"] input').first().type('argentina{enter}');
        cy.get('plex-datetime[label="Fecha de Nacimiento"] input').first().type('18/01/1991');
        cy.get('plex-text[label="Lugar de Nacimiento"] input').first().type('San Carlos de Bariloche');
        cy.get('plex-int[label="C.U.I.T. / C.U.I.L."] input').first().type('2a3b3f5d5e9r3y5d4f6w9').should('have.value', '23355935469');
        cy.get('plex-select[label="Tipo de Documento"] input').first().type('dni{enter}');
        cy.get('plex-int[label="Nº de Documento"] input').first().type('3a5c5d9w3r5e4q6').should('have.value', '35593546');

        //DATOS CONTACTO
        cy.get('plex-phone[label="Numero:"] input').first().type('2944785630');

        //DATOS DOMICILIO

        //Domicilio Real
        cy.get('plex-select[name="provinciaReal"] input').first().type('Neuquen{enter}');
        cy.get('plex-select[name="localidadReal"] input').first().type('Neuquen{enter}');
        cy.get('plex-text[name="direccionReal"] input').first().type('Dewey 521');
        cy.get('plex-int[name="codigoPostalReal"] input').should('have.value', '8300');

        //Al hacer click en el boton "completar domicilios" se llenan los campos del Domicilio Legal y Profesional 
        cy.get('plex-button[label="completar domicilios"]').click();


        //DATOS PROFESION 

        cy.get('plex-select[name="formacionPosgrado"] input').first().type('Kinesiólogo{enter}');
        cy.get('plex-text[name="titulo"] input').first().type('Licenciatura de Kinesiologia');
        cy.get('plex-datetime[name="fechaEgreso"] input').first().type('05/11/2007');

        // Por defecto esta tildada la opcion de "Otra entidad Formadora", de esta manera le sacamos el check para ver si se comporta correctamente
        cy.get('plex-bool[label="Otra Entidad Formadora"] input[type="checkbox"]').uncheck({
            force: true
        }).should('not.be.checked');

        cy.get('plex-select[name="entidadFormadora"] input').first().type('Escuela superior de salud publica{enter}');

        //ACEPTAR LOS DATOS CARGADOS

        cy.get('plex-button[label="Confirmar Datos"]').click();
        cy.wait(2000);
        cy.get('button[class="swal2-confirm btn btn-warning"]').click();
    });
})