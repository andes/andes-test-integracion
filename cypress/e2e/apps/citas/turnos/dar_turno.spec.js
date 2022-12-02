context('CITAS - punto de inicio', () => {
    let token;
    let pacientes;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:seed:agenda', { tipoPrestaciones: '598ca8375adc68e2a0c121d5', dinamica: true, profesionales: null, inicio: '22', fin: '23' });
            cy.task('database:seed:agenda', { tipoPrestaciones: '598ca8375adc68e2a0c121d5', fecha: 1, tipo: 'programado' });
            cy.task('database:seed:paciente').then(p => { pacientes = p; })
        });
    });

    beforeEach(() => {
        cy.goto('/citas/punto-inicio', token);
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables').as('conceptoTurneables');
        cy.intercept('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
        cy.intercept('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.intercept('GET', '**/api/modules/turnos/agenda/**').as('seleccionAgenda');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
    })


    it('Buscar agenda por prestación (0 resultados)', () => {
        darTurno(pacientes[0]);
        cy.plexSelectAsync('name="tipoPrestacion"', 'Consulta de adolescencia', '@conceptoTurneables', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });


    it('Buscar agenda por prestación (2 resultados)', () => {
        darTurno(pacientes[0]);
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        }
    });


    it('Buscar agenda por profesional (0 resultados)', () => {
        darTurno(pacientes[0]);
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);

        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });

    it('Buscar agenda por profesional (1 resultados)', () => {
        darTurno(pacientes[0]);
        cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);

        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(0);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
        }
    });

    ['validado', 'temporal', 'sin-documento'].forEach((type, i) => {
        it('dar turno programado con filtros - paciente ' + type, () => {
            const paciente = pacientes[i];
            darTurno(paciente);

            cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);

            if (cy.esFinDeMes()) {
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.status).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(1);
                });
                cy.plexButtonIcon('chevron-right').click();
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.status).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(2);
                });
            } else {
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.status).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(2);
                });
            }
            cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });

            cy.get('div[class="dia"]').contains(Cypress.moment().add(1, 'days').format('D')).click();

            cy.wait('@seleccionAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200)
            });

            cy.get('plex-card').eq(i).click();

            cy.plexButton('Confirmar').click();
            cy.wait('@darTurno').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.profesionales[0].apellido).to.be.eq('HUENCHUMAN');
                expect(xhr.response.body.profesionales[0].nombre).to.be.eq('NATALIA VANESA');
            });
        });

        it('dar turno agenda dinámica - paciente ' + type, () => {
            const paciente = pacientes[i];
            darTurno(paciente);

            cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
            cy.wait('@cargaAgendas');
            cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
            cy.wait('@seleccionAgenda').then((xhr) => {
                expect(xhr.status).to.be.eq(200)
            });
            cy.plexButton('Dar Turno').click();
            // Confirmo que se dio el turno desde la API
            cy.wait('@darTurno').then((xhr) => {
                expect(xhr.status).to.be.eq(200)
            });
        });

        // Test para verificar que al no asignar el turno, guarde la organizacion
        it('rechazar turno', () => {
            cy.intercept('POST', '**/api/modules/turnos/listaEspera**').as('listaEspera');
            const paciente = pacientes[i];
            darTurno(paciente);

            cy.selectOption('name="tipoPrestacion"', '"598ca8375adc68e2a0c121d5"');
            cy.wait('@cargaAgendas');
            cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
            cy.wait('@seleccionAgenda')
            cy.plexButton('Demanda Rechazada').click();
            cy.wait('@listaEspera').then((xhr) => {
                expect(xhr.response.body).to.have.property('organizacion');
            });
        });

    })

    it('Verifica fecha/hora y usuario de dacion de turno', () => {
        const hoy = Cypress.moment().format('DD/MM/YYYY')
        darTurno(pacientes[0]);
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });

        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });

        }
        cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });
        cy.get('div[class="dia"]').contains(Cypress.moment().add(1, 'days').format('D')).click();

        cy.wait('@seleccionAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.get('plex-card').eq(3).click();

        cy.plexButton('Confirmar').click();
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            const fechaHora = Cypress.moment(xhr.response.body[0].bloques[0].turnos[0].fechaHoraDacion).format('DD/MM/YYYY');
            expect(fechaHora).to.be.eq(hoy);
            expect(xhr.response.body[0].bloques[0].turnos[0].usuarioDacion.nombreCompleto).to.be.eq('Natalia Huenchuman');
        });
    });

});

function darTurno(paciente) {
    cy.intercept('GET', '**api/core-v2/mpi/pacientes/**').as('darTurnoPaciente');
    // definimos el campo a buscar en el listado puede contener un documento con puntos o el nombre de paciente
    const searchList = (paciente.documento) ? paciente.documento.substr(0, paciente.documento.length - 6) + '.' +
        paciente.documento.substr(-6, 3) + '.' + paciente.documento.substr(-3) : paciente.nombre
    const searchField = paciente.documento || paciente.nombre;
    cy.plexText('name="buscador"', searchField);

    cy.wait('@busquedaPaciente').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
    });
    cy.get('paciente-listado plex-item').contains(searchList).click();

    cy.wait(500);

    cy.plexButtonIcon('calendar-plus').click({ force: true });
    return cy.wait('@darTurnoPaciente').then((xhr) => {
        expect(xhr.status).to.be.eq(200);
    });
}
