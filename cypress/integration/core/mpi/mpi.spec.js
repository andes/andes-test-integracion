// /// <reference types="Cypress" />

context('MPI', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        cy.viewport(1280, 720);
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
    })

    it('should registrar paciente con dni argentino', () => {
        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes').as('conDniGuardar');

        // Buscador
        cy.plexText('name="buscador"', '12325483');

        cy.get('div.alert.alert-danger').should('exist');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.plexInt('name="documento"', '12325484');

        cy.plexText('name="apellido"', 'Oros');
        cy.plexText('name="nombre"', 'Camilo');

        cy.plexDatetime('name="fechaNacimiento"', '19/05/1998');

        cy.plexSelectType('name="sexo"', 'masculino');

        // Se completa datos de contacto
        cy.plexPhone('label="Número"', '02991489753');

        // Se completa los datos de domicilio
        cy.plexBool('name="viveProvActual"', true);

        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'alta barda');

        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        // Se guardan cambios
        cy.plexButton('Guardar').click();

        cy.wait('@conDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq("12325484");
            expect(xhr.response.body.apellido).to.be.eq("OROS");
        });

        // Se verifica que aparezca el cartel de que se creó correctamente
        cy.contains('Los datos se actualizaron correctamente');
    });

    it('should registrar paciente sin dni argentino', () => {

        cy.server();
        //Rutas para control
        cy.route('POST', '**api/core/mpi/pacientes').as('sinDniGuardar');
        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('SIN DNI ARGENTINO').click();

        //Se completa datos básicos


        cy.plexText('name="apellido"', 'manual');
        cy.plexText('name="nombre"', 'paciente');
        cy.plexDatetime('name="fechaNacimiento"', '19/05/1993');
        cy.plexSelectType('name="sexo"', 'masculino');


        // Se completa datos de contacto
        cy.plexSelectType('label="Tipo"', { text: 'telefono fijo', clear: true });
        cy.plexPhone('label="Número"', '02994331614');



        // Se agrega nuevo contacto
        cy.plexButtonIcon('phone-plus').click();

        cy.get('fieldset').contains('Datos de contacto').siblings().first().children().eq(2).plexSelectType('label="Tipo"', { text: 'Email', clear: true });

        cy.get('fieldset').contains('Datos de contacto').siblings().first().children().eq(2).plexText('label="Dirección"', 'mail@ejemplo.com');

        // cy.plexText('label="Dirección"', 'mail@ejemplo.com');

        // Se completa los datos de domicilio
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexSelectType('name="barrio"', 'alta barda');
        cy.plexText('name="direccion"', 'Avenida las Flores 1200');

        cy.plexButton('Actualizar').click();


        // Se guardan los cambios
        cy.plexButton('Guardar').click();

        // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
        cy.wait('@sinDniGuardar').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            // expect(xhr.response.body.apellido).to.be.eq('MANUAL');
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');

    });

    it('should registrar bebé', () => {

        cy.server();
        // Rutas para control
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
        cy.route('POST', '**api/core/mpi/pacientes').as('bebeAgregado');
        // cy.route('GET', '**api/modules/georeferencia/georeferenciar?**').as('geoReferencia');


        // Buscador
        cy.plexText('name="buscador"', '1232548');

        cy.get('div').contains('NUEVO PACIENTE').click();

        cy.get('div').contains('BEBÉ').click();

        // Se completa datos básicos
        cy.plexText('name="apellido"', 'apellidoBebe22');
        cy.plexText('name="nombre"', 'nombreBebe22');
        cy.plexDatetime('name="fechaNacimiento"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectType('name="sexo"', 'femenino');



        // Se completa datos
        cy.get('paciente-buscar').plexText('name="buscador"', '12325484');

        // Se selecciona el progenitor 
        cy.get('paciente-listado').find('td').contains('12325484').click();
        //Espera confirmación de la búsqueda correcta del progenitor
        cy.wait('@busquedaProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait(2000);

        cy.plexButton('Guardar').click();

        // Se espera la actualización de la relación del progenitor con el bebé
        cy.wait('@relacionProgenitor').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.relaciones).to.have.length(1)
        });

        // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
        cy.wait('@bebeAgregado').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.contains("BEBE");
            expect(xhr.response.body.nombre).to.contains("BEBE");
        });

    });

    it('should registrar bebé sin completar algún campo requerido, debería fallar', () => {

        cy.server();
        cy.route('GET', '**api/modules/georeferencia/georeferenciar?**', []).as('geoReferencia');

        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('BEBÉ').click();

        // Se completan datos básicos
        cy.plexText('name="apellido"', 'apellidoBebe22');
        cy.plexText('name="nombre"', 'nombreBebe22');
        cy.plexDatetime('name="fechaNacimiento"', Cypress.moment().format('DD/MM/YYYY'));

        // Se selecciona el progenitor 
        cy.get('paciente-buscar').plexText('name="buscador"', '12325484');

        cy.get('paciente-listado').find('td').contains('12325484').click();

        cy.plexButton('Guardar').click();

        cy.contains('Debe completar los datos obligatorios');
        cy.swal('confirm');

    });

    // it('should registrar paciente extranjero', () => {

    //     cy.server();
    //     //Rutas para control
    //     cy.route('POST', '**api/core/mpi/pacientes').as('extranjeroAgregado');

    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('EXTRANJERO').click();

    //     // Se completan datos básicos
    //     cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni22').should('have.value', 'apellidoSinDni22');

    //     cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni22').should('have.value', 'nombreSinDni22');

    //     cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

    //     cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

    //     cy.get('plex-text[name="numeroIdentificacion"] input').first().type('35466577').should('have.value', '35466577');

    //     // Se completan datos de contacto
    //     cy.get('plex-bool[name="noPoseeContacto"]').click();

    //     // Se completan datos de domicilio
    //     cy.get('plex-select[name="provincia"] input').first().type('Neuquen{enter}');
    //     cy.get('plex-select[name="localidad"] input').first().type('Neuquen{enter}');

    //     cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //     cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

    //     cy.get('plex-button[label="Actualizar"]').click();

    //     cy.get('plex-button[label="Guardar"]').click();

    //     //Espera confirmación de que se agrego nuevo paciente(extranjero)correctamente
    //     cy.wait('@extranjeroAgregado').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);

    //     });

    //     cy.contains('Los datos se actualizaron correctamente');
    //     cy.swal('confirm');
    // });

    // it('should registrar extranjero sin completar algún campo requerido, debería fallar', () => {

    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('EXTRANJERO').click();

    //     cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni').should('have.value', 'apellidoSinDni');

    //     cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni').should('have.value', 'nombreSinDni');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

    //     cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

    //     cy.get('plex-text[name="numeroIdentificacion"] input').first().type('112233').should('have.value', '112233');

    //     cy.get('plex-bool[name="noPoseeContacto"]').click();

    //     cy.get('plex-select[name="provincia"] input').first().type('Neuquen{enter}');

    //     cy.get('plex-select[name="localidad"] input').first().type('Neuquen{enter}');

    //     cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //     cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

    //     cy.get('plex-button[label="Actualizar"]').click();

    //     cy.get('plex-button[label="Guardar"]').click();

    //     cy.contains('Debe completar los datos obligatorios');
    //     cy.swal('confirm');
    // });

    it('should validar paciente con Renaper', () => {

        let paciente_validado = {
            "paciente": {
                "id": null,
                "documento": 12325489,
                "cuil": "23123254899",
                "activo": true,
                "estado": "validado",
                "nombre": "JOSE",
                "apellido": "TEST",
                "nombreCompleto": "",
                "alias": "",
                "contacto": [{
                    "tipo": "celular",
                    "valor": "",
                    "ranking": 0,
                    "activo": true,
                    "ultimaActualizacion": "2019-06-25T11:46:48.465Z"
                }],
                "sexo": {
                    "id": "masculino",
                    "nombre": "Masculino"
                },
                "genero": "masculino",
                "fechaNacimiento": "1958-04-30T00:00:00.000Z",
                "tipoIdentificacion": "",
                "numeroIdentificacion": "",
                "edad": null,
                "edadReal": null,
                "fechaFallecimiento": null,
                "direccion": [{
                    "valor": "RUTA 328 KM  20",
                    "codigoPostal": "",
                    "ubicacion": {
                        "pais": null,
                        "provincia": null,
                        "localidad": null,
                        "barrio": null
                    },
                    "ranking": 0,
                    "geoReferencia": null,
                    "ultimaActualizacion": "2019-06-25T11:46:48.465Z",
                    "activo": true
                }],
                "foto": "",
                "relaciones": null,
                "financiador": null,
                "identificadores": null,
                "claveBlocking": null,
                "entidadesValidadoras": [""],
                "scan": null,
                "reportarError": false,
                "notaError": ""
            },
            "validado": true,
            "existente": false
        }
        cy.server();
        //Rutas para control
        cy.route({
            method: 'POST',
            url: '**api/core/mpi/pacientes/validar',
            response: paciente_validado
        });

        // Buscador
        cy.plexText('name="buscador"', '1232548');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();

        // Se completa datos básicos
        cy.plexInt('name="documento"', '12345489');
        cy.plexSelectType('name="sexo"', 'Masculino');

        // Se valida con FA RENAPER
        cy.plexButton('Validar Paciente').click();

        // Se verifican que los datos se muestren correctamente
        cy.plexText('name="apellido"').should('have.value', 'TEST');

        cy.contains('TEST, JOSE');
        cy.contains('Paciente Validado');

        cy.swal('confirm');

    });

    // it('should registrar un paciente existente y verificar similitud', () => {

    //     cy.server();
    //     //Rutas para control
    //     cy.route('POST', '**api/core/mpi/pacientes').as('existePaciente');
    //     cy.route('GET', '**api/core/mpi/pacientes**').as('seleccionarCandidato');

    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('CON DNI ARGENTINO').click();

    //     // Se completa datos básicos
    //     cy.get('plex-int[name="documento"] input').first().type('12325448').should('have.value', '12325448');

    //     cy.get('plex-text[name="apellido"] input').first().type('Oros').should('have.value', 'Oros');

    //     cy.get('plex-text[name="nombre"] input').first().type('Camilo Agustin').should('have.value', 'Camilo Agustin');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1998').should('have.value', '19/05/1998');

    //     cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

    //     // Se completa datos de contacto
    //     cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994331614').should('have.value', '02994331614');

    //     // Se completa los datos de domicilio
    //     cy.get('plex-bool[name="viveProvActual"]').click();

    //     cy.get('plex-bool[name="viveLocActual"]').click();

    //     cy.get('plex-select[name="barrio"] input[type="text"]').type('alta barda{enter}');

    //     cy.get('plex-text[name="direccion"] input[type="text"]').first().type('Avenida las Flores 1200').should('have.value', 'Avenida las Flores 1200');


    //     // Se guardan los cambios
    //     cy.get('plex-button[label="Guardar"]').click();
    //     //Espera hasta que verifica que el paciente ya existe y trae sugerencias de pacientes candidatos
    //     cy.wait('@existePaciente').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     // Se verifica que aparezca el cartel diga que ya existe el paciente y que seleccione una sugerencia
    //     cy.contains('verifique las sugerencias');
    //     cy.swal('confirm');

    //     cy.get('plex-button[label="Seleccionar"]').click();
    //     // Se selecciona el paciente candidato
    //     cy.wait('@seleccionarCandidato').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     // Se guardan cambios
    //     cy.get('plex-button[label="Guardar"]').click();

    //     cy.contains('Los datos se actualizaron correctamente');
    //     cy.swal('confirm');
    // });

    it('should buscar un paciente con scan', () => {

        cy.server();
        //Rutas para control
        cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaScan');

        // Buscador
        cy.plexText('name="buscador"', '00511808749@TEST@ANDES@M@11181222@B@10/01/2012@29/08/2017@208');

        cy.wait('@busquedaScan').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.url().should('include', '/apps/mpi/paciente');

        // Se verifica que todos los datos del paciente esten correctos.
        cy.plexInt('name="documento"').should('have.value', '11181222');

        cy.plexText('name="apellido"').should('have.value', 'TEST');

        cy.plexText('name="nombre"').should('have.value', 'ANDES');

        cy.plexDatetime('name="fechaNacimiento"').find('input').should('have.value', '10/01/2012');

        cy.plexSelectType('name="sexo"').contains('Masculino');

        // Se completa datos de contacto
        cy.plexPhone('label="Número"', '02991489753');

        // Se completa los datos de domicilio
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);

        cy.plexSelectType('name="barrio"', 'alta barda');
        cy.plexText('name="direccion"', 'Avenida las Flores 1200');


        // Se guardan cambios
        cy.plexButton('Guardar').click();

        cy.contains('Los datos se actualizaron correctamente');
        cy.swal('confirm');
    });

    // it('should buscar paciente manualmente', () => {

    //     cy.server();
    //     //Rutas para control
    //     cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaSinScan');

    //     // Buscador
    //     cy.get('plex-text[name="buscador"] input').first().type('52081206').should('have.value', '52081206');
    //     cy.wait('@busquedaSinScan').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     cy.get('div').contains('52081206').click();

    //     // Se verifica que todos los datos del paciente esten correctos.
    //     cy.get('plex-int[name="documento"] input').should('have.value', '52081206');

    //     cy.get('plex-text[name="apellido"] input').should('have.value', 'CHAVEZ SANDOVAL');

    //     cy.get('plex-text[name="nombre"] input').should('have.value', 'TOBIAS AGUSTIN');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').should('have.value', '10/01/2012');

    //     cy.get('plex-select[name="sexo"]').children().children().children().should('have.value', 'masculino');

    //     cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().should('have.value', '2994331614');

    //     cy.get('plex-text[ng-reflect-name="valor-1"] input').first().should('have.value', 'mail@ejemplo.com');

    //     cy.get('plex-text[name="direccion"] input').first().should('have.value', 'Avenida las Flores 1200');

    //     // Se guardan cambios
    //     cy.get('plex-button[label="Guardar"]').click();
    //     cy.contains('Los datos se actualizaron correctamente');
    //     cy.swal('confirm');

    // });

    // it('Habilitar boton validar renaper', () => {

    //     cy.server();
    //     //Rutas para control
    //     cy.route('GET', '**api/core/mpi/pacientes**').as('habilitarBotonRenaper');

    //     // Buscador
    //     cy.get('plex-text[name="buscador"] input').first().type('36593546').should('have.value', '36593546');
    //     cy.wait('@habilitarBotonRenaper').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     cy.get('div').contains('36593546').click();

    //     cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', false);

    //     cy.get('plex-int[name="documento"] input').clear();

    //     cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', true);

    //     cy.get('plex-int[name="documento"] input').type('36593546').should('have.value', '36593546');

    //     cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', false);

    //     cy.swal('confirm');

    // });

})