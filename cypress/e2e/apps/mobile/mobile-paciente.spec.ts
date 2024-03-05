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

    describe('Acciones de paciente sin loguear', function () {
        before(() => {
            cy.viewport(550, 750);
            cy.intercept('POST', '**/api/modules/mobileApp/login', req => {
                delete req.headers['if-none-match']
            }).as('login');
            cy.intercept('POST', '**/api/auth/login', req => {
                delete req.headers['if-none-match']
            }).as('loginProfesional');
        });

        it('Login de paciente inexistente', () => {
            cy.viewport(550, 750);
            cy.goto("/mobile/home", null, null, {
                "coords": {
                    "latitude": -38.9502334061469,
                    "longitude": -68.0569198206332
                }
            });
            cy.wait(500)
            cy.get('.nologin').click();
            cy.get('input').first().type('pepe@gmail.com');
            cy.get('#password').first().type('pepe');
            cy.get('.success').click();
            cy.wait('@login').then(({ response }) => {
                expect(response.statusCode).to.eq(422);
            });
        });
    })

    describe('acciones con paciente logueado', function () {

        beforeEach(() => {
            cy.intercept('POST', '**/api/modules/mobileApp/login', req => {
                delete req.headers['if-none-match']
            }).as('login');
            cy.intercept('POST', '**/api/auth/login', req => {
                delete req.headers['if-none-match']
            }).as('loginProfesional');
            cy.intercept('GET', '**/api/core/tm/campanias').as('campanias');
            cy.intercept('PUT', '**/api/modules/mobileApp/account').as('updateAccount');
            cy.intercept('PUT', '**/api/modules/mobileApp/paciente/**').as('updatePaciente');
            cy.intercept('GET', '**/api/modules/mobileApp/paciente/**').as('getProfile');
            cy.intercept('GET', '**/api/modules/vacunas/**').as('getVacunas');
            cy.viewport(550, 750);

            cy.goto("/mobile/home", null, null, {
                "coords": {
                    "latitude": -38.9502334061469,
                    "longitude": -68.0569198206332
                }
            });
            cy.wait(500)
            cy.get('.nologin').click();
            cy.get('input').first().type('pacientevalidado@gmail.com');
            cy.get('#password').first().type('martin');
            cy.get('.success').click();
            cy.wait(500)
            cy.contains('Hola ' + paciente.nombre);
        });

        afterEach(() => {
            cy.wait(1000)
            cy.get('ion-menu-button').first().click({ force: true });
            cy.wait(1000)
            cy.contains('Cerrar sesión').click({ force: true })
            cy.contains('Bienvenido');
        })

        it('Visualización de perfil', () => {
            cy.contains('Hola ' + paciente.nombre);
            cy.get('ion-menu-button').first().click();
            cy.wait(500)
            cy.contains('Datos Personales').click({ force: true });
            cy.contains('ANDES, PACIENTE VALIDADO');
            cy.contains(paciente.documento);
            cy.contains(Cypress.moment(paciente.fechaNacimiento).format('DD/MM/YYYY'));
        });

        it('Modificacion de datos de acceso', () => {
            cy.contains('Configurar cuenta').click({ force: true });
            cy.get('input').first().clear({ force: true }).type('2944575757', { force: true });
            cy.get('.success').click({ force: true });
            cy.wait('@updateAccount').then(({ response }) => {
                expect(response.statusCode).to.eq(200);
            });
            cy.get('ion-menu-button').first().click({ force: true });
            cy.contains('Configurar cuenta').click({ force: true });
            cy.focused().click({ force: true });
            cy.get('[placeholder="Teléfono"]').should('have.value', '2944575757');
            cy.get('[placeholder="Correo Electrónico"]').should('have.value', 'pacientevalidado@gmail.com');
        });


        it('Verificar historial de turnos', () => {
            cy.waitFor('[name="andes-turno"]').then(() => {
                cy.get('[name="andes-turno"]').click({ force: true });
                cy.contains('consulta de medicina general');
                cy.contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
                cy.contains('HUENCHUMAN, NATALIA VANESA');
                cy.get('ion-back-button').click({ force: true });
            });
        });

        it('Verificar campañas', () => {
            cy.waitFor('[name="andes-agendas"]').then(() => {

                cy.get('[name="andes-agendas"]').click({ force: true });
                cy.wait('@campanias').then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
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
                cy.wait('@getVacunas').then(({ response }) => {
                    expect(response.statusCode).to.eq(200);
                    expect(response.body).to.have.length(1);
                });

                cy.get('.andes-list').find('li').should('have.length', 1);
                cy.get('ion-back-button').click({ force: true });
            });
        });


        it('No hay turnos programados', () => {
            cy.intercept('GET', '**/api/modules/mobileApp/turnos?**').as('getTurnosMobile');
            cy.get('.circle-container',).within($container => {
                cy.wrap($container).find('[name="andes-turno"]').click();
            });

            cy.wait('@getTurnosMobile');
            cy.contains('No tienes ningún turno programado');
            cy.get('ion-back-button').click({ force: true })
        });

        it('Dacion de turno', () => {
            cy.waitFor('[name="andes-turno"]').then(() => {

                cy.intercept('GET', '**/api/modules/mobileApp/turnos?**').as('getTurnosMobile');
                cy.intercept('GET', '**/api/modules/mobileApp/turnos/agenda**').as('getAgenda');
                cy.intercept('PATCH', '**api/modules/turnos/turno/**').as('patchTurno');
                cy.intercept('GET', '**/agendasDisponibles**').as('agendasDisponibles1');

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

                cy.wait('@agendasDisponibles1').then(({ response }) => {
                    expect(response.statusCode).to.be.eq(200);
                    expect(response.body[0].agendas[0].estado).to.be.eq('publicada');
                    expect(response.body[0].agendas[0].tipoPrestaciones[0].conceptId).to.be.eq('391000013108');
                    expect(response.body[0].agendas[0].tipoPrestaciones[0].term).to.be.eq('consulta de medicina general');
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

        it('Cambiar contraseña', () => {
            cy.contains('Configurar cuenta').click({ force: true });
            cy.wait(1000)
            cy.contains('Configurar cuenta').click({ force: true });
            cy.get('.danger').click({ multiple: true });
            cy.get('[placeholder="Contraseña actual"]').type('martin', { force: true });
            cy.get('[placeholder="Nueva contraseña"]').type('martin123');
            cy.get('[placeholder="Repita contraseña"]').type('martin123');
            cy.get('.success').contains('Actualizar').click();
            cy.wait('@updateAccount').then(({ response }) => {
                expect(response.statusCode).to.eq(200);
            });
        });
    })
});