context('gestor-pantallas', () => {
    let token;
    let idPrestacion;

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
            cy.createPaciente("paciente-rup", token);
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('agendas');
        cy.task('database:seed:prestacion', { paciente: '586e6e8627d3107fde116cda', tipoPrestacion: '5cdc4c865cd661b503d727a6' }).then((prestacion) => {
            idPrestacion = prestacion._id;
        }); 
    });

    it('Acceso a buscador de HUDS denegado', () => {
        cy.goto('/rup/huds', token);
        cy.url().should('include', '/inicio');
        cy.goto('/rup/huds/paciente/586e6e8627d3107fde116cda', token);
        cy.url().should('include', '/inicio');
        cy.goto('/rup/vista/586e6e8627d3107fde116cda', token);
        cy.url().should('include', '/inicio');
    });

    it('RUP: ocultar boton de HUDS de Paciente', () => {
        cy.goto('/rup', token);
        cy.plexButton('HUDS DE UN PACIENTE').should('not.exist');
    });

    it('Fuera de agenda: ocultamiento de HUDS', () => {
        cy.goto('/rup', token);
        cy.plexButton('PACIENTE FUERA DE AGENDA').click();
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'consulta de medicina general').click({ force: true });
        cy.plexText('name="buscador"', '3399661');
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('3399661').click();
        cy.plexButton('INICIAR PRESTACIÓN').click();
        cy.get('plex-tabs').not().contains('Historia de Salud').should('not.exist');
        cy.get('plex-tabs').contains('Resumen del Paciente').should('not.exist');
    });
});
