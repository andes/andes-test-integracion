context('punto de inicio', () => {
    let token;
    before(() => {
        // Borro los datos de la base antes de los test
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal.json', token);
        });
    });
    beforeEach(() => {
        cy.server();
        cy.goto('/citas/punto-inicio', token);
        cy.route('GET', '**api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**api/core/log/paciente?idPaciente=**').as('seleccionPaciente');
    })
    it('Buscar paciente inexistente', () => {
        cy.plexText('name="buscador"', '12362920');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.alert.alert-danger').should('contain', 'No se encontró ningún paciente..');
    });
    it('dar turno', () => {
        cy.darTurno('**api/core/mpi/pacientes/57f3b5d579fe79a598e6281f', token);
    });
    it('generar solicitud', () => {
        cy.route('GET', '**api/modules/rup/prestaciones/solicitudes?idPaciente=**').as('generarSolicitudPaciente');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');
        cy.plexText('name=buscador', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906734').click();
        cy.wait('@seleccionPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('open-in-app').click({
            force: true
        });
        cy.wait('@generarSolicitudPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('lista-solicitud-turno-ventanilla').plexButton('Cargar Solicitud nueva').click();
        // cy.plexButton('Cargar Solicitud nueva').click();
    });
    it('activar app mobile', () => {
        cy.route('GET', '**api/core/mpi/modules/mobileApp/check/**', {
            "message": "account_doesntExists",
            "account": null
        }).as('clickActivarApp');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('puco');
        cy.route('GET', '/api/modules/obraSocial/prepagas/**', []).as('prepagas');
        cy.plexText('name=buscador', '38906734');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains('38906734').click();
        cy.plexButtonIcon('cellphone-android').click({
            force: true
        });
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}prueba@prueba.com');
        cy.plexText('placeholder="Celular"', '{selectall}{backspace}2995290357');
        cy.plexButton('Activar App Mobile').click();
        cy.swal('confirm')
    })
})