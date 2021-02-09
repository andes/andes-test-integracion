context('Pagina de login', () => {
    let paciente;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then(pacientes => {
            paciente = pacientes[0];
            cy.task('database:seed:nomivac', { paciente: paciente._id, vacuna: 'Neumococo Conjugada VCN 13', dosis: '1er Dosis' });
            cy.task('database:create:paciente-app', { fromPaciente: paciente._id });
            cy.task('database:seed:campania');
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/api/modules/mobileApp/login').as('login');
        cy.route('POST', '**/api/auth/login').as('loginProfesional');
        cy.route('GET', '**/api/core/tm/campanias').as('campanias');
        cy.route('PUT', '**/api/modules/mobileApp/account').as('updateAccount');
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
        cy.goto("/home/");
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
        cy.goto("/home/", null, null, {
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

    it.skip('Modificación de email', () => {
        cy.get('ion-menu-button').first().click();
        cy.contains('Datos Personales').click({ force: true });
        cy.get('ion-tab-button').last().click({ force: true });
        cy.get('[placeholder="Dirección de e-mail"]').type('nuevoemail@gmail.com');
        cy.get('.success').click();
        cy.get('.back-button').last().click();

    });

    it('Verificar campañas', () => {
        cy.get('ion-back-button').click({ force: true });
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

    it('Sacar turno on line', () => {

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