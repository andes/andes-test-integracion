

/*******************************************************************

DEJAR COMENTADO HASTA QUE SE SUBA LA ACTUALIZACION DE MPI 2 

********************************************************************/




/// <reference types="Cypress" />

context('MPI', () => {
    let token
    before(() => {
        cy.login('35864378', 'lxia1866').then(t => {
            token = t;
        })
    });

    beforeEach(() => {
        const optionsSimplequery = {
            method: 'GET',
            url: 'http://localhost:3002/api/core/mpi/pacientes/',
            qs:
            {
                type: 'simplequery',
                apellido: 'FIGUEREDO',
                nombre: 'CAROLINA ALEJANDRA',
                documento: '14800050',
                sexo: 'femenino',
                escaneado: true
            },
            headers:
            {
                Authorization: "JWT " + token
            }
        };
        cy.request(optionsSimplequery)
            .then((response) => {
                if (response.body[0] && response.body[0].id) {
                    cy.request({
                        method: 'DELETE',
                        url: 'http://localhost:3002/api/core/mpi/pacientes/' + response.body[0].id,
                        headers:
                        {
                            Authorization: "JWT " + token
                        }
                    }).then((responseDelete => {
                        cy.log('THIS IS AFTER DELETE', responseDelete);
                    }))
                }
            });

        const optionsMultimatch = {
            method: 'GET',
            url: 'http://localhost:3002/api/core/mpi/pacientes/',
            qs:
            {
                type: 'multimatch',
                cadenaInput: 'Aquiles Baeza'
            },
            headers:
            {
                Authorization: "JWT " + token
            }
        };
        cy.request(optionsMultimatch)
            .then((response) => {
                if (response.body[0] && response.body[0].id) {
                    cy.request({
                        method: 'DELETE',
                        url: 'http://localhost:3002/api/core/mpi/pacientes/' + response.body[0].id,
                        headers:
                        {
                            Authorization: "JWT " + token
                        }
                    }).then((responseDelete => {
                        cy.log('THIS IS AFTER DELETE', responseDelete);
                    }))
                }
            });
        cy.goto('/apps/mpi/busqueda', token);
    });


    /*     it('registro de argentino con dni', () => {
            cy.server();
            //Rutas para control
            cy.route('POST', '**api/core/mpi/pacientes').as('conDniGuardar');
    
            // Buscador
            cy.get('plex-text input[type="text"]').first().type('12325483').should('have.value', '12325483');
    
            cy.get('div.alert.alert-danger').should('exist');
    
            cy.get('div').contains('NUEVO PACIENTE').click();
    
            cy.get('div').contains('CON DNI ARGENTINO').click();
    
            // Se completa datos básicos
            cy.get('plex-int[name="documento"] input').type('12325484');
    
            cy.get('plex-text[name="apellido"] input').first().type('Camilo');
    
            cy.get('plex-text[name="nombre"] input').first().type('Oros');
    
            cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1998').should('have.value', '19/05/1998');
    
            cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');
    
            // Se completa datos de contacto
            cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02991489753').should('have.value', '02991489753');
    
            // Se guardan cambios
            cy.get('plex-button[label="Guardar"]').click();
            cy.wait('@conDniGuardar').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
    
            // Se verifica que aparezca el cartel de que se creo correctamente
            cy.contains('Los datos se actualizaron correctamente');
        });
    
        it('Registro de argentino sin dni', () => {
    
            cy.server();
            //Rutas para control
            cy.route('POST', '**api/core/mpi/pacientes').as('sinDniGuardar');
    
            // Buscador
            cy.get('plex-text input[type="text"]').first().type('1232548').should('have.value', '1232548');
    
            cy.get('div').contains('NUEVO PACIENTE').click();
    
            cy.get('div').contains('SIN DNI ARGENTINO').click();
    
            //Se completa datos básicos
            cy.get('plex-bool[name = "noPoseDNI"]').click();
    
            cy.contains('Recuerde que al guardar un paciente sin el número de documento será imposible realizar validaciones contra fuentes auténticas.');
            cy.swal('confirm');
    
            cy.get('plex-text[name="apellido"] input').first().type('manual').should('have.value', 'manual');
    
            cy.get('plex-text[name="nombre"] input').first().type('paciente').should('have.value', 'paciente');
    
            cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');
    
            cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');
    
            // Se completa datos de contacto
            cy.get('plex-select[ng-reflect-name="tipo-0"]').children().children('.selectize-control').click().find('div[data-value="fijo"]').click();
    
            cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994331614').should('have.value', '02994331614');
    
            // Se agrega nuevo contacto
            cy.get('plex-button[name="agregarContacto"]').click();
    
            cy.get('plex-select[ng-reflect-name="tipo-1"]').children().children('.selectize-control').click()
                .find('div[data-value="email"]').click();
    
            cy.get('plex-text[ng-reflect-name="valor-1"] input').first().type('mail@ejemplo.com').should('have.value', 'mail@ejemplo.com');
    
            // Se completa los datos de domicilio
            cy.get('plex-bool[name="viveProvActual"]').click();
    
            cy.get('plex-bool[name="viveLocActual"]').click();
    
            cy.get('plex-select[name="barrio"] input[type="text"]').type('alta barda{enter}');
    
            cy.get('plex-text[name="direccion"] input[type="text"]').first().type('Avenida las Flores 1200').should('have.value', 'Avenida las Flores 1200');
    
            cy.get('plex-button[label="Actualizar"]').click();
    
            // Se guardan los cambios
            cy.get('plex-button[label="Guardar"]').click();
            // Se espera confirmación de que se agrego nuevo paciente SIN DNI correctamente
            cy.wait('@sinDniGuardar').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
    
            // Se v erifica que aparezca el cartel de que se creo correctamente
            cy.contains('Los datos se actualizaron correctamente');
            cy.swal('confirm');
    
        });
     */

    // it('Registro Bebé', () => {

    //     cy.server();
    //     // Rutas para control
    //     cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaProgenitor');
    //     cy.route('PATCH', '**api/core/mpi/pacientes/**').as('patchPaciente');
    //     cy.route('POST', '**api/core/mpi/pacientes').as('bebeAgregado');

    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('BEBÉ').click();

    //     // Se completa datos básicos
    //     cy.get('plex-text[name="apellido"] input').first().type('Baeza').should('have.value', 'Baeza');

    //     cy.get('plex-text[name="nombre"] input').first().type('Aquiles').should('have.value', 'Aquiles');

    //     cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

    //     // Se completa datos de contacto
    //     cy.get('paciente-buscar[label="Buscar"] input').first().type('27644166');

    //     //Espera confirmación de la búsqueda correcta del progenitor
    //     cy.wait('@busquedaProgenitor');

    //     // Se selecciona el progenitor 
    //     cy.get('paciente-listado').find('td').contains('27644166').click();

    //     // Se actualizan los datos del domicilio
    //     cy.get('plex-button[label="Actualizar"]').click();

    //     cy.get('plex-button[label="Guardar"]').click({ force: true });

    //     // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
    //     cy.wait('@bebeAgregado');

    //     cy.contains('Los datos se actualizaron correctamente');
    //     cy.swal('confirm');
    // });

    // it('Registro Bebe agrega relacion escaneando un paciente existente', () => {

    //     cy.server();
    //     // Rutas para control
    //     cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaPaciente');
    //     cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
    //     cy.route('POST', '**api/core/mpi/pacientes').as('postPaciente');
    //     cy.route('PUT', '**api/core/mpi/pacientes').as('putPaciente');


    //     const optionsPost = {
    //         method: 'POST',
    //         url: 'http://localhost:3002/api/core/mpi/pacientes/',
    //         body: {
    //             ignoreCheck: true,
    //             paciente: {
    //                 apellido: "FIGUEREDO",
    //                 documento: "14800050",
    //                 estado: "validado",
    //                 fechaNacimiento: "1962-09-29",
    //                 genero: "femenino",
    //                 nombre: "CAROLINA ALEJANDRA",
    //                 scan: "00580431597@FIGUEREDO@CAROLINA ALEJANDRA@F@14800050@D@29/09/1962@30/01/2019@207",
    //                 sexo: "femenino",
    //             }
    //         },
    //         headers:
    //         {
    //             Authorization: "JWT " + token
    //         }
    //     };
    //     cy.request(optionsPost).then(() => {


    //         // Buscador
    //         cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //         cy.get('div').contains('NUEVO PACIENTE').click();

    //         cy.get('div').contains('BEBÉ').click();

    //         // Se completa datos básicos
    //         cy.get('plex-text[name="apellido"] input').first().type('Baeza').should('have.value', 'Baeza');

    //         cy.get('plex-text[name="nombre"] input').first().type('Aquiles').should('have.value', 'Aquiles');

    //         cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');

    //         cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

    //         // Se completa datos de contacto
    //         cy.get('paciente-buscar[label="Buscar"] input').first().type('00580431597@FIGUEREDO@CAROLINA ALEJANDRA@F@14800050@D@29/09/1962@30/01/2019@207');

    //         //Espera confirmación de la búsqueda correcta del progenitor
    //         cy.wait('@busquedaPaciente');
    //         cy.wait('@busquedaPaciente');
    //         cy.get('plex-text[name="documentoRelacion"] input').should('have.value', '14800050');
    //         cy.get('plex-text[name="apellidoRelacion"] input').should('have.value', 'FIGUEREDO');
    //         cy.get('plex-text[name="nombreRelacion"] input').should('have.value', 'CAROLINA ALEJANDRA');
    //         cy.get('plex-select[name="sexoRelacion"]').contains('Femenino');
    //         // Se actualizan los datos del domicilio
    //         cy.get('plex-bool[name="viveProvActual"]').click();

    //         cy.get('plex-bool[name="viveLocActual"]').click();

    //         cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //         cy.get('plex-text[name="direccion"] input').first().type('stefenelli 450').should('have.value', 'stefenelli 450');

    //         cy.get('plex-button[label="Actualizar"]').click();

    //         cy.get('plex-button[label="Guardar"]').click();

    //         // Se espera la actualización de la relacion del progenitor con el bebe
    //         cy.wait('@relacionProgenitor').then((xhr) => {
    //             expect(xhr.status).to.be.eq(200);
    //         });

    //         // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
    //         cy.wait('@postPaciente').then((xhr) => {
    //             expect(xhr.status).to.be.eq(200);
    //         });

    //         cy.contains('Los datos se actualizaron correctamente');
    //         cy.swal('confirm');
    //     });
    // });

    // it('Registro Bebe agrega relacion escaneando un paciente que no existe', () => {

    //     cy.server();
    //     // Rutas para control
    //     cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaPaciente');
    //     cy.route('PATCH', '**api/core/mpi/pacientes/**').as('relacionProgenitor');
    //     cy.route('POST', '**api/core/mpi/pacientes').as('postPaciente');
    //     cy.route('PUT', '**api/core/mpi/pacientes').as('putPaciente');


    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('BEBÉ').click();

    //     // Se completa datos básicos
    //     cy.get('plex-text[name="apellido"] input').first().type('Baeza').should('have.value', 'Baeza');

    //     cy.get('plex-text[name="nombre"] input').first().type('Aquiles').should('have.value', 'Aquiles');

    //     cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

    //     // Se completa datos de contacto
    //     cy.get('paciente-buscar[label="Buscar"] input').first().type('00580431597@FIGUEREDO@CAROLINA ALEJANDRA@F@14800050@D@29/09/1962@30/01/2019@207');

    //     //Espera confirmación de la búsqueda correcta del progenitor
    //     cy.wait('@busquedaPaciente');
    //     cy.wait('@postPaciente');
    //     cy.wait('@busquedaPaciente');
    //     cy.get('plex-text[name="documentoRelacion"] input').should('have.value', '14800050');
    //     cy.get('plex-text[name="apellidoRelacion"] input').should('have.value', 'FIGUEREDO');
    //     cy.get('plex-text[name="nombreRelacion"] input').should('have.value', 'CAROLINA ALEJANDRA');
    //     cy.get('plex-select[name="sexoRelacion"]').contains('Femenino');
    //     // Se actualizan los datos del domicilio
    //     cy.get('plex-bool[name="viveProvActual"]').click();

    //     cy.get('plex-bool[name="viveLocActual"]').click();

    //     cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //     cy.get('plex-text[name="direccion"] input').first().type('stefenelli 450').should('have.value', 'stefenelli 450');

    //     cy.get('plex-button[label="Actualizar"]').click();

    //     cy.get('plex-button[label="Guardar"]').click();

    //     // Se espera la actualización de la relacion del progenitor con el bebe
    //     cy.wait('@relacionProgenitor').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     // Se espera confirmación de que se agrego nuevo paciente(bebe) correctamente
    //     cy.wait('@postPaciente').then((xhr) => {
    //         expect(xhr.status).to.be.eq(200);
    //     });

    //     cy.contains('Los datos se actualizaron correctamente');
    //     cy.swal('confirm');
    // });


    // it('Registro Bebé sin completar algún campo requerido', () => {

    //     cy.server();
    //     // Rutas para control
    //     cy.route('PATCH', '**api/core/mpi/pacientes/**').as('patchPaciente');
    //     cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');

    //     // Buscador
    //     cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //     cy.get('div').contains('NUEVO PACIENTE').click();

    //     cy.get('div').contains('BEBÉ').click();

    //     // Se completan datos básicos
    //     cy.get('plex-text[name="apellido"] input').first().type('apellidoBebe').should('have.value', 'apellidoBebe');

    //     cy.get('plex-text[name="nombre"] input').first().type('nombreBebe').should('have.value', 'nombreBebe');

    //     cy.get('plex-datetime[name="fechaNacimiento"] input').type(Cypress.moment().format('DD/MM/YYYY'));

    //     // Se selecciona el progenitor 
    //     cy.get('paciente-buscar[label="Buscar"] input').first().type('27644166');
    //     cy.wait('@busquedaPaciente');
    //     cy.get('paciente-listado').find('td').contains('27644166').click();

    //     cy.get('plex-button[label="Actualizar"]').click();

    //     cy.get('plex-button[label="Guardar"]').click({ force: true });

    //     cy.contains('Debe completar los datos obligatorios');
    //     cy.swal('confirm');

    // });

    //  it('Registro extranjero', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('POST', '**api/core/mpi/pacientes').as('extranjeroAgregado');

    //      // Buscador
    //      cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //      cy.get('div').contains('NUEVO PACIENTE').click();

    //      cy.get('div').contains('EXTRANJERO').click();

    //      // Se completan datos básicos
    //      cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni22').should('have.value', 'apellidoSinDni22');

    //      cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni22').should('have.value', 'nombreSinDni22');

    //      cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

    //      cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

    //      cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

    //      cy.get('plex-text[name="numeroIdentificacion"] input').first().type('35466577').should('have.value', '35466577');

    //      // Se completan datos de contacto
    //      cy.get('plex-bool[name="noPoseeContacto"]').click();

    //      // Se completan datos de domicilio
    //      cy.get('plex-bool[name="viveProvActual"]').click();

    //      cy.get('plex-bool[name="viveLocActual"]').click();

    //      cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //      cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

    //      cy.get('plex-button[label="Actualizar"]').click();

    //      cy.get('plex-button[label="Guardar"]').click();

    //      //Espera confirmación de que se agrego nuevo paciente(extranjero)correctamente
    //      cy.wait('@extranjeroAgregado').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      cy.contains('Los datos se actualizaron correctamente');
    //      cy.swal('confirm');
    //  });

    //  it('Registro extranjero sin completar algún campo requerido', () => {

    //      // Buscador
    //      cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

    //      cy.get('div').contains('NUEVO PACIENTE').click();

    //      cy.get('div').contains('EXTRANJERO').click();

    //      cy.get('plex-text[name="apellido"] input').first().type('apellidoSinDni').should('have.value', 'apellidoSinDni');

    //      cy.get('plex-text[name="nombre"] input').first().type('nombreSinDni').should('have.value', 'nombreSinDni');

    //      cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('19/05/1993').should('have.value', '19/05/1993');

    //      cy.get('plex-select[name="tipoIdentificacion"] input[type="text"]').type('pasaporte{enter}');

    //      cy.get('plex-text[name="numeroIdentificacion"] input').first().type('112233').should('have.value', '112233');

    //      cy.get('plex-bool[name="noPoseeContacto"]').click();

    //      cy.get('plex-bool[name="viveProvActual"]').click();

    //      cy.get('plex-bool[name="viveLocActual"]').click();

    //      cy.get('plex-select[name="barrio"] input[type="text"]').type('confluencia urbano{enter}')

    //      cy.get('plex-text[name="direccion"] input').first().type('Dewey Luis 521').should('have.value', 'Dewey Luis 521');

    //      cy.get('plex-button[label="Actualizar"]').click();

    //      cy.get('plex-button[label="Guardar"]').click();

    //      cy.contains('Debe completar los datos obligatorios');
    //      cy.swal('confirm');
    //  });

    //  it('Validar por renaper un paciente que ya existe', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('GET', '**api/core/mpi/pacientes/**').as('renaper');

    //      // Buscador
    //      cy.get('plex-text input[type="text"]').first().type('12325489').should('have.value', '12325489');

    //      cy.get('div').contains('NUEVO PACIENTE').click();

    //      cy.get('div').contains('CON DNI ARGENTINO').click();

    //      // Se completa datos básicos
    //      cy.get('plex-int[name="documento"] input').first().type('3u5yr5w9s3s5sx4vb6').should('have.value', '35593546');

    //      cy.get('plex-select[name="sexo"] input[type="text"]').type('Masculino{enter}');

    //      // Se completa datos de contacto
    //      cy.get('plex-select[ng-reflect-name="tipo-0"]').children().children('.selectize-control').click()
    //          .find('div[data-value="fijo"]').click();

    //      // Se valida con FA RENAPER
    //      cy.get('plex-button[label="Validar Paciente"]').click();


    //      // Se espera la confirmacion de renaper y que el status sea OK
    //      cy.wait('@renaper').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      // Se verifica que aparezca el cartel diga que ya existe el paciente 
    //      cy.contains('El paciente que está cargando ya existe en el sistema');
    //      cy.swal('confirm');
    //  });

    //  it('Guardar un paciente que ya existe y seleccionar similitud', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('POST', '**api/core/mpi/pacientes').as('existePaciente');
    //      cy.route('GET', '**api/core/mpi/pacientes**').as('seleccionarCandidato');

    //      // Buscador
    //      cy.get('plex-text input[type="text"]').first().type('123254').should('have.value', '123254');

    //      cy.get('div').contains('NUEVO PACIENTE').click();

    //      cy.get('div').contains('CON DNI ARGENTINO').click();

    //      // Se completa datos básicos
    //      cy.get('plex-int[name="documento"] input').first().type('41436751').should('have.value', '41436751');

    //      cy.get('plex-text[name="apellido"] input').first().type('Hugo').should('have.value', 'Hugo');

    //      cy.get('plex-text[name="nombre"] input').first().type('Agustin').should('have.value', 'Agustin');

    //      cy.get('plex-datetime[name="fechaNacimiento"] input').first().type('01/02/1999').should('have.value', '01/02/1999');

    //      cy.get('plex-select[name="sexo"] input[type="text"]').type('masculino{enter}');

    //      // Se completa datos de contacto
    //      cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().type('02994331614').should('have.value', '02994331614');

    //      // Se guardan los cambios
    //      cy.get('plex-button[label="Guardar"]').click();
    //      //Espera hasta que verifica que el paciente ya existe y trae sugerencias de pacientes candidatos
    //      cy.wait('@existePaciente').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      // Se verifica que aparezca el cartel diga que ya existe el paciente y que seleccione una sugerencia
    //      cy.contains('El paciente ya existe, verifique las sugerencias');
    //      cy.swal('confirm');

    //      cy.get('plex-button[label="Seleccionar"]').click();
    //      // Se selecciona el paciente candidato
    //      cy.wait('@seleccionarCandidato').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      // Se guardan cambios
    //      cy.get('plex-button[label="Guardar"]').click();

    //      cy.contains('Los datos se actualizaron correctamente');
    //      cy.swal('confirm');
    //  });

    //  it('Buscar paciente con scan', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaScan');

    //      // Buscador
    //      cy.get('plex-text[name="buscador"] input').first().type('00511808749@CHAVEZ SANDOVAL@TOBIAS AGUSTIN@M@52081206@B@10/01/2012@29/08/2017@208').should('have.value', '00511808749@CHAVEZ SANDOVAL@TOBIAS AGUSTIN@M@52081206@B@10/01/2012@29/08/2017@208');
    //      cy.wait('@busquedaScan').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      cy.url().should('include', '/apps/mpi/paciente');

    //      // Se verifica que todos los datos del paciente esten correctos.
    //      cy.get('plex-int[name="documento"] input').should('have.value', '52081206');

    //      cy.get('plex-text[name="apellido"] input').should('have.value', 'CHAVEZ SANDOVAL');

    //      cy.get('plex-text[name="nombre"] input').should('have.value', 'TOBIAS AGUSTIN');

    //      cy.get('plex-datetime[name="fechaNacimiento"] input').should('have.value', '10/01/2012');

    //      cy.get('plex-select[name="sexo"]').children().children().children().should('have.value', 'masculino');

    //      cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().should('have.value', '2994331614');

    //      cy.get('plex-text[ng-reflect-name="valor-1"] input').first().should('have.value', 'mail@ejemplo.com');

    //      cy.get('plex-text[name="direccion"] input').first().should('have.value', 'Avenida las Flores 1200');

    //      // Se guardan cambios
    //      cy.get('plex-button[label="Guardar"]').click();

    //      cy.contains('Los datos se actualizaron correctamente');
    //      cy.swal('confirm');

    //  });

    //  it('Buscar paciente sin scan', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('GET', '**api/core/mpi/pacientes**').as('busquedaSinScan');

    //      // Buscador
    //      cy.get('plex-text[name="buscador"] input').first().type('52081206').should('have.value', '52081206');
    //      cy.wait('@busquedaSinScan').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      cy.get('div').contains('52081206').click();

    //      // Se verifica que todos los datos del paciente esten correctos.
    //      cy.get('plex-int[name="documento"] input').should('have.value', '52081206');

    //      cy.get('plex-text[name="apellido"] input').should('have.value', 'CHAVEZ SANDOVAL');

    //      cy.get('plex-text[name="nombre"] input').should('have.value', 'TOBIAS AGUSTIN');

    //      cy.get('plex-datetime[name="fechaNacimiento"] input').should('have.value', '10/01/2012');

    //      cy.get('plex-select[name="sexo"]').children().children().children().should('have.value', 'masculino');

    //      cy.get('plex-phone[ng-reflect-name="valor-0"] input').first().should('have.value', '2994331614');

    //      cy.get('plex-text[ng-reflect-name="valor-1"] input').first().should('have.value', 'mail@ejemplo.com');

    //      cy.get('plex-text[name="direccion"] input').first().should('have.value', 'Avenida las Flores 1200');

    //      // Se guardan cambios
    //      cy.get('plex-button[label="Guardar"]').click();
    //      cy.contains('Los datos se actualizaron correctamente');
    //      cy.swal('confirm');

    //  });

    //  it('Habilitar boton validar renaper', () => {

    //      cy.server();
    //      //Rutas para control
    //      cy.route('GET', '**api/core/mpi/pacientes**').as('habilitarBotonRenaper');

    //      // Buscador
    //      cy.get('plex-text[name="buscador"] input').first().type('36593546').should('have.value', '36593546');
    //      cy.wait('@habilitarBotonRenaper').then((xhr) => {
    //          expect(xhr.status).to.be.eq(200);
    //      });

    //      cy.get('div').contains('36593546').click();

    //      cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', false);

    //      cy.get('plex-int[name="documento"] input').clear();

    //      cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', true);

    //      cy.get('plex-int[name="documento"] input').type('36593546').should('have.value', '36593546');

    //      cy.get('button[class="btn btn-info  waves-effect"]').should('have.prop', 'disabled', false);

    //      cy.swal('confirm');

    //  }); 

})
