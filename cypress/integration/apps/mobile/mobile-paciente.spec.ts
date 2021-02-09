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
        cy.goto("/mobile/home/");
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
        cy.goto("/mobile/home/", null, null, {
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
        cy.contains('Datos Personales').click({ force: true });
        cy.wait('@getProfile').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('ion-tab-button').last().click({ force: true });

        cy.get('[placeholder="Dirección de e-mail"]').first().type('nuevoemail@gmail.com');
        cy.get('.ion-color-success').click();
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
        cy.get('[name="andes-agendas"]').click({ force: true });
        cy.wait('@campanias').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('ion-list').find('ion-icon').get('[name="calendar"]').should('have.length', 1);
        cy.get('ion-list').find('ion-icon').get('[name="calendar"]').click({ force: true });
        cy.contains("Desde: 1 de octubre del 2018");
        cy.contains("Hasta: 31 de octubre del 2030");
        cy.get('.info').contains("mas info");
        cy.get('ion-back-button').last().click({ force: true });
        cy.get('ion-back-button').eq(1).click({ force: true });
    });

    it('Consulta de vacunas', () => {
        cy.get('[name="andes-vacuna"]').click();
        cy.wait('@getVacunas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });

        cy.get('.andes-list').find('li').should('have.length', 1);
        cy.get('ion-back-button').click({ force: true });
    });

    it.skip('Sacar turno on line', () => {

        cy.task('database:seed:agenda', {
            tipoPrestaciones: '598ca8375adc68e2a0c121bc',
            estado: 'publicada',
            organizacion: '57e9670e52df311059bc8964',
            inicio: '3',
            fin: '4',
            fecha: 1,
            tipo: 'programado'
        });

        cy.route('GET', '**/api/modules/mobileApp/turnos?**').as('getTurnosMobile');
        cy.route('PATCH', '**api/modules/turnos/turno/**').as('patchTurno');
        cy.route('GET', '**/agendasDisponibles?**').as('agendasDisponibles');

        cy.get('[name="andes-turno"]').click();

        cy.wait('@getTurnosMobile');
        cy.contains('No tienes ningún turno programado');
        // cy.get('ion-button').contains('Solicitar Turno').last().click();
        // cy.wait('@agendasDisponibles');
        // cy.get('page-turnos-prestaciones [name="ios-arrow-forward-outline"]').last().click();
        // cy.get('[name="ios-arrow-forward-outline"]').last().click();
        // cy.get('[name="andes-confirmar"]').first().click();
        // cy.get('button').contains('Confirmar').click();
        // cy.wait('@patchTurno').then((xhr) => {
        //expect(xhr.status).to.be.eq(200);
        //});
    });
}); 