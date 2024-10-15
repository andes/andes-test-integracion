let i = 0;
['medica', 'enfermeria'].forEach((capa) => {
    let arreProfesionales = [4163782, 15789463];
    describe(`Capa ${capa} - registros`, () => {
        let token;
        let pacientes;
        let paciente;
        before(() => {
            cy.seed();
            cy.loginCapa(capa, arreProfesionales[i]).then(([user, t, pacientesCreados]) => {
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
            i++;
        });

        beforeEach(() => {
            cy.intercept('POST', '/api/modules/huds/accesos/token').as('acceso');
            cy.viewport(1920, 1080);
            cy.intercept('GET', '/api/modules/huds/motivosHuds/motivosHuds**', { fixture: 'huds/modalHuds.json' }).as('motivosHuds');

        });

        it('ver registros de un paciente', () => {
            cy.getCama(pacientes[0].apellido).click();
            cy.plexTab('INTERNACION').click();
            cy.wait(2000)
            cy.plexOptions('REGISTROS').click();
            cy.modalPrivacidad(true);

            cy.plexLayoutSidebar().contains('MOVIMIENTOS');

            cy.plexOptions('REGISTROS').click();
            cy.modalPrivacidad('Procesos de Auditoría');

            cy.wait('@acceso').then((xhr) => {
                const body = xhr.request.body;
                cy.wait('@motivosHuds');
                expect(body.motivo).to.be.eq('auditoria');
                expect(body.paciente.id).to.be.eq(paciente._id);
            })

            cy.plexLayoutSidebar().contains('Registros');
            cy.getRegistrosMedicos().should('have.length', 2);
            cy.getRegistrosMedicos().plexButtonIcon('eye').click();
            cy.getRegistrosMedicos().plexButton('Continuar');
            cy.getRegistrosMedicos().plexButtonIcon('eye').click();
            cy.plexLayoutMain().contains('consulta con médico general');
            cy.plexLayoutMain().find('plex-title').plexButtonIcon('close').click();
            let fecha = Cypress.moment().format('DD/MM/yyyy HH:mm');
            cy.plexLayoutMain().get('plex-title').contains(fecha)
        });
    });
});