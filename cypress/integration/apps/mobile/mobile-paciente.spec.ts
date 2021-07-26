context('mobile paciente', () => {
    let paciente;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then(pacientes => {
            paciente = pacientes[0];
            cy.task('database:seed:nomivac', { paciente: paciente._id, vacuna: 'Neumococo Conjugada VCN 13', dosis: '1er Dosis' });
            cy.task('database:create:paciente-app', { fromPaciente: paciente._id });
            cy.task('database:seed:campania');
        });

        cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', tipoPrestaciones: '598ca8375adc68e2a0c121b8', fecha: -1 });
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/api/modules/mobileApp/login').as('login');
        cy.route('POST', '**/api/auth/login').as('loginProfesional');
        cy.route('POST', '**/api/modules/mobileApp/registro').as('registro');
        cy.route('GET', '**/api/core/tm/campanias').as('campanias');
        cy.route('PUT', '**/api/modules/mobileApp/account').as('updateAccount');
        cy.route('PUT', '**/api/modules/mobileApp/paciente/**').as('updatePaciente');
        cy.route('GET', '**/api/modules/mobileApp/paciente/**').as('getProfile');
        cy.route('GET', '**/api/modules/vacunas/**').as('getVacunas');
        cy.viewport(550, 750);
    });

    it('Login de paciente inexistente', () => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.match(/Unexpected token '<'/)) {
                return false;
            }
        })
        cy.goto("/mobile/home");
        cy.get('.nologin').click();
        cy.get('input').first().type('pepe@gmail.com');
        cy.get('#password').first().type('pepe');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(422);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(false);
        });
    });

    it('Login de paciente existente', () => {
        cy.goto("/mobile/home", null, null, {
            "coords": {
                "latitude": -38.9502334061469,
                "longitude": -68.0569198206332
            }
        });
        cy.get('.nologin').click();
        cy.get('input').first().type('pacientevalidado@gmail.com');
        cy.get('#password').first().type('martin');
        cy.get('.success').click();
        cy.wait('@login').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
        });
        cy.contains('Hola ' + paciente.nombre);
    });

    it('Visualización de perfil', () => {
        cy.contains('Hola ' + paciente.nombre);
        cy.get('ion-menu-button').first().click();
        cy.contains('Datos Personales').click({ force: true });
        cy.contains('ANDES, PACIENTE VALIDADO');
        cy.contains(paciente.documento);
        cy.contains(Cypress.moment(paciente.fechaNacimiento).format('DD/MM/YYYY'));
    });

    it('Modificacion de datos de acceso', () => {
        cy.contains('Configurar cuenta').click({ force: true });
        cy.get('input').first().clear();
        cy.get('input').first().type('2944575757');
        cy.get('.success').click();
        cy.wait('@updateAccount').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('ion-menu-button').first().click({ force: true });
        cy.contains('Configurar cuenta').click({ force: true });
        cy.focused().click();
        cy.get('[placeholder="Teléfono"]').should('have.value', '2944575757');
        cy.get('[placeholder="Correo Electrónico"]').should('have.value', 'pacientevalidado@gmail.com');
    });

    it('Cambiar contraseña', () => {
        cy.contains('Configurar cuenta').click({ force: true });
        cy.get('.danger').click();
        cy.get('[placeholder="Contraseña actual"]').type('martin');
        cy.get('[placeholder="Nueva contraseña"]').type('martin123');
        cy.get('[placeholder="Repita contraseña"]').type('martin123');
        cy.get('.success').contains('Actualizar').click();
        cy.wait('@updateAccount').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

    });

    it('Modificación de email', () => {
        cy.contains('Datos Personales').parent().click({ force: true });
        cy.get('ion-content').eq(2).click(500, 500, { force: true })
        cy.wait('@getProfile').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait(500);
        cy.get('ion-tab-button').last().click({ force: true });

        cy.wait(500);
        cy.get('ion-input[name="email"] input').first().type('nuevoemail@gmail.com', { force: true });
        cy.get('ion-button').click({ force: true });

        cy.wait('@updatePaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('ion-back-button').click({ force: true });
    });

    it('Verificar historial de turnos', () => {
        cy.contains('Mi historial de turnos').click({ force: true });
        cy.contains('consulta de medicina general');
        cy.contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
        cy.contains('HUENCHUMAN, NATALIA VANESA');
        cy.get('ion-back-button').click({ force: true });
    });

    it('Verificar campañas', () => {
        cy.waitFor('[name="andes-agendas"]').then(() => {

            cy.get('[name="andes-agendas"]').click({ force: true });
            cy.wait('@campanias').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('ion-list').find('ion-icon').get('[name="calendar"]').should('have.length', 1);
            cy.get('ion-list').find('ion-icon').get('[name="calendar"]').click({ force: true });
            cy.get('.info').contains("mas info");
            cy.get('ion-back-button').last().click({ force: true });
            cy.get('ion-back-button').eq(1).click({ force: true });
        });
    });

    it('Consulta de vacunas', () => {
        cy.waitFor('[name="andes-vacuna"]').then(() => {

            cy.get('[name="andes-vacuna"]').click();
            cy.wait('@getVacunas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });

            cy.get('.andes-list').find('li').should('have.length', 1);
            cy.get('ion-back-button').click({ force: true });
        });
    });


    it('No hay turnos programados', () => {
        cy.route('GET', '**/api/modules/mobileApp/turnos?**').as('getTurnosMobile');
        cy.get('.circle-container',).within($container => {
            cy.wrap($container).find('[name="andes-turno"]').click();
        });

        cy.wait('@getTurnosMobile');
        cy.contains('No tienes ningún turno programado');

    });

    it('Dacion de turno', () => {
        cy.waitFor('[name="andes-turno"]').then(() => {

            cy.route('GET', '**/api/modules/mobileApp/turnos?**').as('getTurnosMobile');
            cy.route('GET', '**/api/modules/mobileApp/turnos/agenda**').as('getAgenda');
            cy.route('PATCH', '**api/modules/turnos/turno/**').as('patchTurno');
            cy.route('GET', '**/agendasDisponibles**').as('agendasDisponibles1');

            cy.task('database:seed:agenda', {
                tipoPrestaciones: '598ca8375adc68e2a0c121b8',
                estado: 'publicada',
                organizacion: '57e9670e52df311059bc8964',
                inicio: '3',
                fin: '4',
                fecha: 1,
                tipo: 'programado'
            });

            cy.get('.circle-container',).within($container => {
                cy.wrap($container).find('[name="andes-turno"]').click();
            });

            cy.wait('@getTurnosMobile');

            cy.get('.icono-text-container.no-item').within(() => {
                cy.get('ion-button').click({ force: true });
                cy.url().should('include', 'mobile/turnos/prestaciones');
            });

            cy.wait('@agendasDisponibles1').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.responseBody[0].agendas[0].estado).to.be.eq('publicada');
                expect(xhr.responseBody[0].agendas[0].tipoPrestaciones[0].conceptId).to.be.eq('391000013108');
                expect(xhr.responseBody[0].agendas[0].tipoPrestaciones[0].term).to.be.eq('consulta de medicina general');
            });

            cy.get('.andes-list').find('ion-icon').get('[name="chevron-forward-outline"]').click({ force: true });
            cy.wait('@agendasDisponibles1');
            cy.contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON').click({ force: true });
            cy.wait('@agendasDisponibles1');
            cy.get('ion-list-header').find('ion-label').contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            cy.get('ion-list-header').find('ion-label').contains('HUENCHUMAN NATALIA VANESA');
            cy.get('ion-item').find('ion-button').get('[name="checkmark"]').first().click({ force: true }).then((xhr) => {
                cy.get('ion-content').find('.titulo-prefix').contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
                cy.get('ion-content').find('.titulo-secundario').contains('consulta de medicina general');
                cy.get('ion-content').find('.andes-list-subtitle').contains('IMPORTANTE: Si Ud. no puede concurrir al turno por favor recuerde cancelarlo a través de esta aplicación móvil, o comunicándose telefónicamente al Centro de Salud, para que otro paciente pueda tomarlo. ¡Muchas gracias!');
                cy.get('ion-content').find('button').contains('Confirmar').click({ force: true });
            })
            cy.wait('@getProfile');
            cy.wait('@patchTurno');
            cy.contains('No tienes ningún turno programado');
        });
    });

    it('Registro - Número de trámite invalido', () => {
        cy.goto("/mobile/login/informacion-validacion", null, null, {
            "coords": {
                "latitude": -38.9502334061469,
                "longitude": -68.0569198206332
            }
        });
        cy.get('[id="documento"]').type('35593546');
        cy.get('[id="tramite"]').type('4444444445');
        cy.get('[id="celular"]').type('299444444');
        cy.get('[id="email"]').type('prueba@gmail.com');
        cy.get('[id="sexo"]').click().get('.alert-radio-button').contains('Masculino').click();
        cy.get('.alert-button').contains('Aceptar').click();
        cy.get('.success').contains('Registrarme').click();
        cy.wait('@registro').then((xhr) => {
            expect(xhr.status).to.be.eq(404);
            expect(xhr.responseBody).to.be.eq('Número de trámite inválido');
        });
    });

    it('Registro - Existe cuenta registrada', () => {
        cy.goto("/mobile/login/informacion-validacion", null, null, {
            "coords": {
                "latitude": -38.9502334061469,
                "longitude": -68.0569198206332
            }
        });
        cy.get('[id="documento"]').type('10000000');
        cy.get('[id="tramite"]').type('299999999999');
        cy.get('[id="celular"]').type('299444444');
        cy.get('[id="email"]').type('prueba@gmail.com');
        cy.get('[id="sexo"]').click().get('.alert-radio-button').contains('Masculino').click();
        cy.get('.alert-button').contains('Aceptar').click();
        cy.get('.success').contains('Registrarme').click();
        cy.wait('@registro').then((xhr) => {
            expect(xhr.status).to.be.eq(404);
            expect(xhr.responseBody).to.be.eq('Ya existe una cuenta registrada con el email ingresado');
        });
    });

    it('Registro - Formatos incorrectos', () => {
        cy.goto("/mobile/login/informacion-validacion", null, null, {
            "coords": {
                "latitude": -38.9502334061469,
                "longitude": -68.0569198206332
            }
        });

        cy.get('[id="documento"]').type('10000000{selectall}{backspace}');
        cy.contains('Debe ingresar su número de documento, sin espacios ni puntos.');
        cy.get('[id="tramite"]').type('2{selectall}{backspace}');
        cy.contains('Debe ingresar los 11 dígitos de su número de trámite de documento.');
        cy.get('[id="celular"]').type('2');
        cy.contains('Formato incorrecto. Debe ingresar su número sin prefijo 0 y sin 15.');
        cy.get('[id="email"]').type('p');
        cy.contains('Formato incorrecto. Debe ingresar un e-mail válido.');
    });
});