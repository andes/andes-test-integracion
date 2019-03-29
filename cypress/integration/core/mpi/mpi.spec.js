

/// <reference types="Cypress" />

context('MPI', () => {
    let token
    before(() => {
        cy.login('35593546', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
    })

    it('registro de argentino con dni', () => {
        cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

        cy.get('div.alert.alert-danger').should('exist');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        cy.get('plex-int[name="documento"] input').type('12325489');

        cy.get('plex-text[name="apellido"] input').first().type('Roca');

        cy.get('plex-text[name="nombre"] input').first().type('Carlos');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1998').should('have.value', '19/05/1998');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02991489753').should('have.value', '02991489753');

        // Guardamos cambios
        cy.get('plex-button[label="Guardar"]').click();

        // Verifica que aparezca el cartel de que se creo correctamente
        cy.contains('Los datos se actualizaron correctamente');

    });

    it('Registro de argentino sin dni', () => {

        cy.get('plex-text input[type="text"]').first().type('1232548').should('have.value', '1232548');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('SIN DNI ARGENTINO').click();

        // Completo datos basicos
        cy.get('plex-bool[name = "noPoseDNI"]').click();

        cy.contains('Recuerde que al guardar un paciente sin el número de documento será imposible realizar validaciones contra fuentes auténticas.');
        cy.swal('confirm');

        cy.get('plex-text[name="apellido"] input').first().type('manual').should('have.value', 'manual');

        cy.get('plex-text[name="nombre"] input').first().type('paciente').should('have.value', 'paciente');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        // Completo datos de contacto
        cy.get('plex-select[ng-reflect-name="tipo-0"]').children().children('.selectize-control').click().find('div[data-value="fijo"]').click();

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994331614').should('have.value', '02994331614');

        // Agrego nuevo contacto
        cy.get('plex-button[name="agregarContacto"]').click();

        cy.get('plex-select[ng-reflect-name="tipo-1"]').children().children('.selectize-control').click()
            .find('div[data-value="email"]').click();

        cy.get('plex-text[ng-reflect-name="valor-1"] input').first().type('mail@ejemplo.com').should('have.value', 'mail@ejemplo.com');

        //Completo datos de domicilio
        cy.get('plex-bool[name="viveProvActual"]').click();

        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-select[name="barrio"] input[type="text"]').type('alta barda{enter}');

        cy.get('plex-text[name="direccion"] input[type="text"]').first().type('Avenida las Flores 1200').should('have.value', 'Avenida las Flores 1200');

        cy.get('plex-button[label="Actualizar"]').click();

        // Guardamos cambios
        cy.get('plex-button[label="Guardar"]').click();

        // Verifica que aparezca el cartel de que se creo correctamente
        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');

    });

    it('Registro Bebé', () => {

        cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('BEBÉ').click();

        cy.get('plex-text[name="apellido"] input').first().type('apellidoBebe').should('have.value', 'apellidoBebe');

        cy.get('plex-text[name="nombre"] input').first().type('nombreBebe').should('have.value', 'nombreBebe');

        cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');

        cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        cy.get('paciente-buscar[label="Buscar Mamá"] input').first().type('27644166');

        cy.get('paciente-listado').find('td').contains('27644166').click();

        cy.get('plex-button[label="Actualizar"]').click();

        cy.wait(1000);
        cy.get('plex-button[label="Guardar"]').click();

        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');
    });

    it('Registro Bebé sin completar algún campo requerido', () => {

        cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('BEBÉ').click();

        cy.get('plex-text[name="apellido"] input').first().type('apellidoBebe').should('have.value', 'apellidoBebe');

        cy.get('plex-text[name="nombre"] input').first().type('nombreBebe').should('have.value', 'nombreBebe');

        cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

        cy.get('paciente-buscar[label="Buscar Mamá"] input').first().type('27644166');

        cy.get('paciente-listado').find('td').contains('27644166').click();

        cy.get('plex-button[label="Actualizar"]').click();

        cy.get('plex-button[label="Guardar"]').click();

        cy.contains('Debe completar los datos obligatorios');
        cy.swal('confirm');

    });

    it('Registro extranjero', () => {

        cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('EXTRANJERO').click();

        cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni').should('have.value', 'apellidoSinDni');

        cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni').should('have.value', 'nombreSinDni');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

        cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

        cy.get('plex-text[name="numeroIdentificacion"] input').first().type('35466578').should('have.value', '35466578');

        cy.get('plex-bool[name="noPoseeContacto"]').click();

        cy.get('plex-bool[name="viveProvActual"]').click();

        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

        cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

        cy.get('plex-button[label="Actualizar"]').click();

        cy.get('plex-button[label="Guardar"]').click();

        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');
    });

    it('Registro extranjero sin completar algún campo requerido', () => {

        cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('EXTRANJERO').click();

        cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni').should('have.value', 'apellidoSinDni');

        cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni').should('have.value', 'nombreSinDni');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

        cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

        cy.get('plex-text[name="numeroIdentificacion"] input').first().type('112233').should('have.value', '112233');

        cy.get('plex-bool[name="noPoseeContacto"]').click();

        cy.get('plex-bool[name="viveProvActual"]').click();

        cy.get('plex-bool[name="viveLocActual"]').click();

        cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

        cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

        cy.get('plex-button[label="Actualizar"]').click();

        cy.get('plex-button[label="Guardar"]').click();

        cy.contains('Debe completar los datos obligatorios');
        cy.swal('confirm');
    });

    it('Validar por renaper un paciente que ya existe', () => {

        cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Completo datos basicos
        cy.get('plex-int[name="documento"] input').first().type('2u7yr6w4s4s1sx6vb6').should('have.value', '27644166');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('femenino{enter}');

        // Completo datos de contacto
        cy.get('plex-select[ng-reflect-name="tipo-0"]').children().children('.selectize-control').click()
            .find('div[data-value="fijo"]').click();

        // Se valida con FA RENAPER
        cy.get('plex-button[label="Validar Paciente"]').click();

        // Verifica que aparezca el cartel diga que ya existe el paciente 
        cy.contains('El paciente que está cargando ya existe en el sistema');
        cy.swal('confirm');
    });

    it('Guardar un paciente que ya existe y seleccionar similitud', () => {

        cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        // SE INGRESAN VALORES EN CADA CAMPO REQUERIDO

        cy.get('plex-int[name="documento"] input').first().type('41436751').should('have.value', '41436751');

        cy.get('plex-text[name="apellido"] input').first().type('Hugo').should('have.value', 'Hugo');

        cy.get('plex-text[name="nombre"] input').first().type('Agustin').should('have.value', 'Agustin');

        cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('01/02/1999').should('have.value', '01/02/1999');

        cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994331614').should('have.value', '02994331614');

        // Guardamos cambios
        cy.get('plex-button[label="Guardar"]').click();

        // Verifica que aparezca el cartel diga que ya existe el paciente y que seleccione una sugerencia
        cy.contains('El paciente ya existe, verifique las sugerencias');
        cy.swal('confirm');

        cy.get('plex-button[label="Seleccionar"]').click();

        // Guardamos cambios
        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');
    });

    it('Buscar paciente con scan', () => {

        cy.get('plex-text[name="buscador"] input').first().type('00511808749@CHAVEZ SANDOVAL@TOBIAS AGUSTIN@M@52081206@B@10/01/2012@29/08/2017@208').should('have.value', '00511808749@CHAVEZ SANDOVAL@TOBIAS AGUSTIN@M@52081206@B@10/01/2012@29/08/2017@208');
        cy.wait(1000);

        cy.url().should('include', '/apps/mpi/paciente');

        // Verifica que todos los datos del paciente esten correctos.

        cy.get('plex-int[name="documento"] input').should('have.value', '52081206');

        cy.get('plex-text[name="apellido"] input').should('have.value', 'CHAVEZ SANDOVAL');

        cy.get('plex-text[name="nombre"] input').should('have.value', 'TOBIAS AGUSTIN');

        cy.get('plex-datetime[name="fechaNacimiento"] input').should('have.value', '10/01/2012');

        cy.get('plex-select[name="sexo"]').children().children().children().should('have.value', 'masculino');

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().should('have.value', '2994331614');

        cy.get('plex-text[ng-reflect-name="valor-1"] input').first().should('have.value', 'mail@ejemplo.com');

        cy.get('plex-text[name="direccion"] input').first().should('have.value', 'Avenida las Flores 1200');

    });

    it('Buscar paciente sin scan', () => {

        cy.get('plex-text[name="buscador"] input').first().type('52081206').should('have.value', '52081206');
        cy.wait(1000);

        cy.get('div').contains('52081206').click();

        // Verifica que todos los datos del paciente esten correctos.

        cy.get('plex-int[name="documento"] input').should('have.value', '52081206');

        cy.get('plex-text[name="apellido"] input').should('have.value', 'CHAVEZ SANDOVAL');

        cy.get('plex-text[name="nombre"] input').should('have.value', 'TOBIAS AGUSTIN');

        cy.get('plex-datetime[name="fechaNacimiento"] input').should('have.value', '10/01/2012');

        cy.get('plex-select[name="sexo"]').children().children().children().should('have.value', 'masculino');

        cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().should('have.value', '2994331614');

        cy.get('plex-text[ng-reflect-name="valor-1"] input').first().should('have.value', 'mail@ejemplo.com');

        cy.get('plex-text[name="direccion"] input').first().should('have.value', 'Avenida las Flores 1200');

    });

})
