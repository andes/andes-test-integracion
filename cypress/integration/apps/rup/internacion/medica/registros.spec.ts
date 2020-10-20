['medica', 'enfermeria'].forEach((capa) => {

    describe(`Capa ${capa} - registros`, () => {
        let token;
        let pacientes;
        let paciente;
        before(() => {
            cy.seed();
            cy.loginCapa(capa).then(([user, t, pacientesCreados]) => {
                token = t;
                pacientes = pacientesCreados;
                paciente = pacientes[0];

                // CREA UN MUNDO IDEAL DE INTERNACION
                cy.factoryInternacion({
                    configCamas:
                        [{
                            estado: 'ocupada',
                            pacientes: [paciente],
                            fechaIngreso: Cypress.moment().add(-5, 'day')
                        }]
                }).then((camitas) => {
                    cy.log(camitas);
                    cy.taskN('database:seed:prestacion', [{
                        paciente: paciente._id,
                        estado: 'validada',
                        fecha: -1
                    }, {
                        paciente: paciente._id,
                        estado: 'validada',
                        fecha: -6
                    }, {
                        paciente: paciente._id,
                        estado: 'ejecucion',
                        fecha: -1
                    }, {
                        paciente: paciente._id,
                        estado: 'ejecucion',
                        fecha: -1,
                        createdBy: user._id
                    }]);
                    return cy.goto('/mapa-camas', token);
                });
            });
        });

        beforeEach(() => {
            cy.server();
            cy.route('POST', '/api/modules/huds/accesos/token').as('acceso');
            cy.viewport(1920, 1080);
        });

        it('ver registros de un paciente', () => {
            cy.getCama(pacientes[0].apellido).click();
            cy.plexTab('INTERNACION').click();
            cy.plexOptions('REGISTROS').click();
            cy.modalPrivacidad(true);

            cy.plexLayoutSidebar().contains('Movimientos de Internación');

            cy.plexOptions('REGISTROS').click();
            cy.modalPrivacidad('Procesos de Auditoría');

            cy.wait('@acceso').then((xhr) => {
                const body = xhr.request.body;
                expect(body.motivo).to.be.eq('Procesos de Auditoría');
                expect(body.paciente.id).to.be.eq(paciente._id);
            })

            cy.plexLayoutSidebar().contains('Registros');

            cy.getRegistrosMedicos().should('have.length', 2);
            cy.getRegistrosMedicos().eq(0).plexButtonIcon('eye');
            cy.getRegistrosMedicos().eq(1).plexButton('Continuar');

            cy.getRegistrosMedicos().eq(0).plexButtonIcon('eye').click();

            cy.plexLayoutMain().contains('consulta con médico general');

            cy.plexLayoutMain().find('plex-title').plexButtonIcon('close').click();

            cy.plexLayoutMain().contains('Mapa de Camas');

        });
    });
});