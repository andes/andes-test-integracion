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
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**', req => {
            delete req.headers['if-none-match']
        }).as('busquedaPaciente');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables').as('conceptoTurneables');
        cy.intercept('GET', '**/api/modules/turnos/agenda?rango=true&desde=**').as('cargaAgendas');
        cy.intercept('PATCH', '**/api/modules/turnos/turno/**').as('darTurno');
        cy.intercept('GET', '**/api/modules/turnos/agenda/**', req => {
            delete req.headers['if-none-match']
        }).as('seleccionAgenda');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes/**', req => {
            delete req.headers['if-none-match']
        }).as('darTurnoPaciente');
    })

    it('Buscar agenda por prestación (0 resultados)', () => {
        BuscarPaciente(pacientes[0]);
        darTurno();
        cy.plexSelectAsync('name="tipoPrestacion"', 'Consulta de adolescencia', '@conceptoTurneables', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });

    it('Buscar agenda por prestación (2 resultados)', () => {
        BuscarPaciente(pacientes[0]);
        darTurno();
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        }
    });


    it('Buscar agenda por profesional (0 resultados)', () => {
        BuscarPaciente(pacientes[0]);
        darTurno();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);

        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
    });

    it('Buscar agenda por profesional (1 resultados)', () => {
        BuscarPaciente(pacientes[0]);
        darTurno();
        cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);

        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(0);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
        }
    });

    ['validado', 'temporal', 'sin-documento'].forEach((type, i) => {
        it('dar turno programado con filtros - paciente ' + type, () => {
            const paciente = pacientes[i];
            BuscarPaciente(paciente);
            darTurno();

            cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);

            if (cy.esFinDeMes()) {
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.response.statusCode).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(1);
                });
                cy.plexButtonIcon('chevron-right').click();
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.response.statusCode).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(2);
                });
            } else {
                cy.wait('@cargaAgendas').then((xhr) => {
                    expect(xhr.response.statusCode).to.be.eq(200);
                    expect(xhr.response.body).to.have.length(2);
                });
            }
            cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });

            cy.wait(1000)
            cy.get('div[class="dia"]').contains(Cypress.moment().add(1, 'days').format('D')).click();

            cy.wait('@seleccionAgenda').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200)
            });

            cy.get('plex-card').eq(i).click();

            cy.plexButton('Confirmar').click();
            cy.wait('@darTurno').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body.profesionales[0].apellido).to.be.eq('HUENCHUMAN');
                expect(xhr.response.body.profesionales[0].nombre).to.be.eq('NATALIA VANESA');
            });
        });

        it('dar turno agenda dinámica - paciente ' + type, () => {
            const paciente = pacientes[i];
            BuscarPaciente(paciente);
            darTurno();
            cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
            cy.wait('@cargaAgendas');
            cy.get('app-calendario .dia').contains(Cypress.moment().date()).click();
            cy.wait('@seleccionAgenda').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200)
            });
            cy.plexButton('Dar Turno').click();
            // Confirmo que se dio el turno desde la API
            cy.wait('@darTurno').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200)
            });
        });
    })

    it('Demanda insatisfecha', () => {
        cy.intercept('POST', '**/api/modules/turnos/listaEspera**').as('listaEspera');
        const paciente = pacientes[0];
        BuscarPaciente(paciente);
        cy.plexButtonIcon('account-cruz').click();
        cy.wait(1000);
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta de medicina general', '@conceptoTurneables', 0);
        cy.plexSelectAsync('name="profesionales"', 'USUARIO PRUEBA', '@getProfesionales', 0);
        cy.plexSelect('name="motivos"').click();
        cy.get('div').contains('No existe la oferta').click();
        cy.plexButton('Guardar').click();
        cy.wait('@listaEspera').then((xhr) => {
            console.log('xhr.response.body', xhr.response.body);
            expect(xhr.response.body).to.have.property('demandas');
        });
    });

    it('Verifica fecha/hora y usuario de dacion de turno', () => {
        const hoy = Cypress.moment().format('DD/MM/YYYY')
        BuscarPaciente(pacientes[0]);
        darTurno();
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta con médico oftalmólogo', '@conceptoTurneables', 0);
        if (cy.esFinDeMes()) {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(1);
            });
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });

        } else {
            cy.wait('@cargaAgendas').then((xhr) => {
                expect(xhr.response.statusCode).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });

        }
        cy.plexSelectAsync('name="profesional"', 'HUENCHUMAN NATALIA', '@getProfesionales', 0);
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
        });
        cy.wait(1000)
        cy.get('div[class="dia"]').contains(Cypress.moment().add(1, 'days').format('D')).click();

        cy.wait('@seleccionAgenda').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200)
        });
        cy.get('plex-card').eq(3).click();

        cy.plexButton('Confirmar').click();
        cy.wait('@cargaAgendas').then((xhr) => {
            expect(xhr.response.statusCode).to.be.eq(200);
            const fechaHora = Cypress.moment(xhr.response.body[0].bloques[0].turnos[3].fechaHoraDacion).format('DD/MM/YYYY');
            expect(fechaHora).to.be.eq(hoy);
            expect(xhr.response.body[0].bloques[0].turnos[3].usuarioDacion.nombreCompleto).to.be.eq('Natalia Huenchuman');
        });
    });

});

function BuscarPaciente(paciente) {
    // definimos el campo a buscar en el listado puede contener un documento con puntos o el nombre de paciente
    const searchList = (paciente.documento) ? paciente.documento.substr(0, paciente.documento.length - 6) + '.' +
        paciente.documento.substr(-6, 3) + '.' + paciente.documento.substr(-3) : paciente.nombre
    const searchField = paciente.documento || paciente.nombre;

    cy.plexText('name="buscador"', searchField);
    cy.wait('@busquedaPaciente').then((xhr) => {
        expect(xhr.response.statusCode).to.be.eq(200);
    });
    cy.get('paciente-listado plex-item').contains(searchList).click();
}

function darTurno() {
    cy.plexButtonIcon('calendar-plus').click({ force: true });
    return cy.wait('@darTurnoPaciente').then((xhr) => {
        expect(xhr.response.statusCode).to.be.eq(200);
    });
}
