/// <reference types="Cypress" />

const tipoAgendas = ['comun', 'dinamica', 'no-nominalizada', 'con-solicitud'];

context('RUP - Punto de inicio', () => {
    let token;
    let pacientes;
    const agendas = {};

    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then(ps => {
            pacientes = ps;
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    describe('acciones de agendas en sidebar', () => {
        before(() => {
            cy.cleanDB(['agenda', 'prestaciones']);

            if (tipoAgendas.includes('comun')) {
                cy.task('database:seed:agenda', {
                    inicio: '0',
                    fin: '4',
                    pacientes: pacientes.map(p => p._id)
                }).then(agenda => agendas['comun'] = agenda);
            }
            if (tipoAgendas.includes('dinamica')) {
                cy.task('database:seed:agenda', {
                    inicio: '1',
                    fin: '5',
                    pacientes: pacientes.map(p => p._id),
                    dinamica: true
                }).then((agenda) => agendas['dinamica'] = agenda);
            }

            if (tipoAgendas.includes('no-nominalizada')) {
                cy.task('database:seed:agenda', {
                    inicio: '2',
                    fin: '5',
                    tipoPrestaciones: '5b61d59968954f3e6ea84586'
                }).then(agenda => agendas['no-nominalizada'] = agenda);
            }

            if (tipoAgendas.includes('con-solicitud')) {
                cy.task('database:seed:agenda', {
                    inicio: '3',
                    fin: '6',
                    pacientes: pacientes.map(p => p._id),
                }).then(agenda => agendas['con-solicitud'] = agenda);
            }
        })

        beforeEach(() => {

            cy.intercept({ method: 'GET', url: '**/api/modules/turnos/agenda**' }).as('agendas');
            cy.intercept({ method: 'POST', url: '**/api/modules/rup/prestaciones**' }).as('crearPrestacion');
            cy.intercept({ method: 'PATCH', url: '**/api/modules/rup/prestaciones/**' }).as('patchPrestacion');
            cy.intercept({ method: 'GET', url: '**/api/modules/rup/prestaciones**' }).as('prestaciones');
            cy.intercept({ method: 'GET', url: '**/api/modules/turnero/pantalla**' }).as('turnero');
            cy.intercept({ method: 'GET', url: '**/api/modules/rup/elementosRUP**' },).as('elementosRUP');
            cy.intercept({ method: 'GET', url: '**/api/auth/organizaciones**' }).as('organizaciones');
            cy.intercept({ method: 'GET', url: '**api/modules/cde/paciente**' }).as('paciente');
            cy.intercept({ method: 'GET', url: '/api/modules/rup/prestaciones/huds/**' }).as('huds');
            cy.intercept({ method: 'GET', url: '/api/modules/top/reglas**' }).as('reglas');
            cy.intercept({ method: 'GET', url: '**/api/modules/rup/plantillas?conceptId=**' }).as('plantillas');

        });

        tipoAgendas.forEach((typeAgenda, agendaIndex) => {
            if (typeAgenda === 'no-nominalizada') {
                flujoPrestacion(typeAgenda, agendaIndex, null, 0);
            } else {
                ['validado', 'temporal', 'sin-documento'].forEach((typePaciente, i) => {

                    flujoPrestacion(typeAgenda, agendaIndex, typePaciente, i);

                    if (typeAgenda === 'dinamicaa') {
                        it(`agregar paciente agenda dinamica - ${typePaciente}`, () => {
                            cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('consultaPaciente');
                            cy.intercept('PATCH', '**/api/modules/turnos/turno/agenda/**').as('agregarTurnoDinamico');
                            cy.goto('/rup', token);
                            cy.wait('@agendas');
                            cy.wait('@prestaciones');
                            cy.wait(1000);

                            cy.get('table').first().as('tablaAgendas');
                            cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();

                            cy.plexButton('AGREGAR PACIENTE').click();

                            cy.get('paciente-buscar input').first().type(pacientes[i].nombre);
                            cy.wait('@consultaPaciente');

                            cy.get('paciente-listado plex-item').contains(pacientes[i].nombre).click();

                            cy.get('plex-layout-sidebar').plexButton('Guardar').click();

                            cy.swal('confirm');

                            cy.wait('@agregarTurnoDinamico').then(({ response }) => {
                                const agenda = response.body;
                                expect(agenda.dinamica).to.be.eq(true);
                                expect(agenda.bloques[0].turnos[i].paciente.id).to.be.eq(pacientes[i]._id);
                            });
                            cy.wait('@crearPrestacion').then(({ response }) => {
                                const prestacion = response.body;
                                expect(prestacion.paciente.id).to.be.eq(pacientes[i]._id);
                                expect(prestacion.solicitud.tipoPrestacion.conceptId).to.be.eq(agendas['dinamica'].tipoPrestaciones[0].conceptId);
                            });
                        });
                    }
                });
            }

            if (typeAgenda !== 'no-nominalizada') {
                it('Anular inicio de prestación', () => {
                    cy.goto('/rup', token);
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');
                    cy.wait(1000);
                    cy.get('table tbody tr').eq(agendaIndex).click();
                    cy.plexButton('INICIAR PRESTACIÓN').click();
                    cy.swal('confirm');
                    cy.wait('@crearPrestacion');
                    cy.wait('@prestaciones');

                    cy.goto('/rup', token)
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');
                    cy.wait(1000);
                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();

                    if (typeAgenda !== 'no-nominalizada') {
                        cy.plexButton('ANULAR INICIO DE PRESTACIÓN').click();
                        cy.swal('confirm');
                        cy.wait('@prestaciones').then(({ response }) => {
                            expect(response.statusCode).to.be.eq(200);
                            expect(response.body.length).to.be.eq(0);
                        });
                    }
                });
            }
        });
    });

    describe('prestaciones fuera de agenda', () => {
        before(() => {
            cy.cleanDB(['agenda', 'prestaciones']);
            cy.task('database:seed:prestacion', { paciente: pacientes[0]._id });
        });

        beforeEach(() => {

            cy.intercept({ method: 'GET', url: '**/api/modules/turnos/agenda**' }).as('agendas');
            cy.intercept({ method: 'POST', url: '**/api/modules/rup/prestaciones**' }).as('crearPrestacion');
            cy.intercept({ method: 'GET', url: '**/api/modules/rup/prestaciones**' }).as('prestaciones');
            cy.intercept({ method: 'GET', url: '**/api/modules/turnero/pantalla**' }).as('turnero');
            cy.intercept({ method: 'GET', url: '**/api/modules/rup/elementosRUP**' }).as('elementosRUP');
            cy.intercept({ method: 'GET', url: '**/api/auth/organizaciones**' }).as('organizaciones');
            cy.intercept({ method: 'GET', url: '**api/modules/cde/paciente**' }).as('paciente');
            cy.intercept({ method: 'GET', url: '/api/modules/rup/prestaciones/huds/**' }).as('huds');
            cy.intercept({ method: 'GET', url: '/api/modules/top/reglas**' }).as('reglas');

        });

        ['validado', 'temporal', 'sin-documento'].forEach((typePaciente, pacienteIndex) => {

            describe(`flujo prestación fuera agenda paciente ${typePaciente}`, () => {
                let idPrestacion;

                before(() => {
                    cy.cleanDB(['agenda', 'prestaciones']);
                    cy.task('database:seed:prestacion', { paciente: pacientes[pacienteIndex]._id }).then((prestacion) => {
                        idPrestacion = prestacion._id.toString();
                    });
                })

                it('continuar prestacion', () => {
                    cy.intercept('GET', '**/api/modules/rup/prestaciones/' + idPrestacion, req => {
                        delete req.headers['if-none-match']
                    }).as('findPrestacion');

                    const paciente = pacientes[pacienteIndex];

                    setRoute();
                    cy.goto('/rup', token);
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');

                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(1).click({ force: true });
                    cy.plexButton('CONTINUAR REGISTRO').click();


                    cy.url().should('include', '/rup/ejecucion/');
                    cy.wait('@findPrestacion').then(({ response }) => {
                        const prestacion = response.body;
                        expect(prestacion.id).to.be.eq(idPrestacion)
                        if (paciente) {
                            expect(prestacion.paciente.id).to.be.eq(paciente._id);
                            expect(prestacion.paciente.nombre).to.be.eq(paciente.nombre);

                            expect(prestacion.paciente.nombre).to.be.eq(paciente.nombre);
                            expect(prestacion.solicitud.tipoPrestacion.conceptId).to.be.eq('391000013108');
                        }
                    });

                    cy.plexButton('Guardar').click();
                    cy.url().should('include', '/rup/validacion/');

                    const dtoValidacion = {
                        op: 'estadoPush',
                        estado: { tipo: 'validada' }
                    };
                    cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);
                });

                it('ver resumen', () => {
                    const paciente = pacientes[pacienteIndex];

                    setRoute();
                    cy.goto('/rup', token);
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');

                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(1).click();
                    cy.get('plex-layout-sidebar table').find('tbody tr').eq(0).as('turnoRow');

                    cy.get('@turnoRow').plexButton('VER RESUMEN').click();
                    cy.url().should('include', '/rup/validacion/' + idPrestacion);
                });

                it('VER HUDS', () => {
                    setRoute();
                    cy.goto('/rup', token);
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');

                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(1).click();
                    cy.plexButton('VER HUDS').click();
                    cy.contains('Procesos de Auditoría').click({ force: true });

                    cy.plexButton('ACEPTAR').click();
                    cy.url().should('include', '/huds/paciente/');
                });
            })
        });
    })

    function flujoPrestacion(typeAgenda, agendaIndex, typePaciente, pacienteIndex) {

        describe(`flujo prestación agenda ${typeAgenda} paciente ${typePaciente}`, () => {
            let idPrestacion;

            if (typeAgenda === 'con-solicitud') {
                before(() => {
                    cy.task('database:seed:prestacion', {
                        paciente: pacientes[pacienteIndex]._id,
                        turno: agendas['con-solicitud'].bloques[0].turnos[pacienteIndex]._id,
                        estado: 'pendiente'
                    });
                });
            }

            it('iniciar prestacion', () => {
                const paciente = typePaciente && pacientes[pacienteIndex];

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@prestaciones');

                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();

                cy.plexButton('INICIAR PRESTACIÓN').click();
                cy.swal('confirm');

                const wait = typeAgenda !== 'con-solicitud' ? cy.wait('@crearPrestacion') : cy.wait('@patchPrestacion');
                wait.then(xhr => {
                    idPrestacion = xhr.response.body.id;
                    cy.intercept('GET', '**/api/modules/rup/prestaciones/' + idPrestacion, req => {
                        delete req.headers['if-none-match']
                    }).as('findPrestacion');

                    cy.url().should('include', '/rup/ejecucion/' + idPrestacion);
                    cy.wait('@findPrestacion').then(({ response }) => {
                        const prestacion = xhr.response.body;
                        expect(prestacion.id).to.be.eq(idPrestacion)
                        if (paciente) {
                            expect(prestacion.paciente.id).to.be.eq(paciente._id);
                            expect(prestacion.paciente.nombre).to.be.eq(paciente.nombre);
                            expect(prestacion.solicitud.tipoPrestacion.conceptId).to.be.eq('391000013108');
                        }
                    });
                });
            });

            it('continuar prestacion', () => {
                cy.intercept('GET', '**/api/modules/rup/prestaciones/' + idPrestacion, req => {
                    delete req.headers['if-none-match']
                }).as('findPrestacion');

                setRoute();

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@prestaciones');

                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();
                cy.plexButton('CONTINUAR REGISTRO').click();

                cy.url().should('include', '/rup/ejecucion/');
                cy.wait('@findPrestacion').then(({ response }) => {
                    expect(response.statusCode).to.be.eq(200);
                    const prestacion = response.body;
                    expect(prestacion.id).to.be.eq(idPrestacion)
                });

                const dtoValidacion = {
                    op: 'estadoPush',
                    estado: { tipo: 'validada' }
                };
                cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);
            });

            it('ver resumen', () => {
                const paciente = pacientes[pacienteIndex];

                setRoute();
                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@prestaciones');

                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();
                cy.get('plex-layout-sidebar table').find('tbody tr').eq(pacienteIndex).as('turnoRow');

                cy.get('@turnoRow').plexButton('VER RESUMEN').click();
                cy.url().should('include', '/rup/validacion/' + idPrestacion);
            });

            if (typePaciente) {
                it('VER HUDS', () => {
                    const paciente = pacientes[pacienteIndex];

                    setRoute();
                    cy.goto('/rup', token);
                    cy.wait('@agendas');
                    cy.wait('@prestaciones');

                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();
                    cy.plexButton('VER HUDS').click();
                    cy.contains('Procesos de Auditoría').click({ force: true });

                    cy.plexButton('ACEPTAR').click();
                    cy.url().should('include', '/huds/paciente/');
                });
            }
        })
    }
});


function setRoute() {
    cy.intercept({ method: 'GET', url: '**/api/modules/turnos/agenda**' }).as('agendas');
    cy.intercept({ method: 'POST', url: '**/api/modules/rup/prestaciones**' }).as('crearPrestacion');
    cy.intercept({ method: 'PATCH', url: '**/api/modules/rup/prestaciones**' }).as('patchPrestacion');
    cy.intercept({ method: 'GET', url: '**/api/modules/rup/prestaciones**' }).as('prestaciones');
    cy.intercept({ method: 'GET', url: '**/api/modules/turnero/pantalla**' }).as('turnero');
    cy.intercept({ method: 'GET', url: '**/api/modules/rup/elementosRUP**' }).as('elementosRUP');
    cy.intercept({ method: 'GET', url: '**api/modules/cde/paciente**' }).as('paciente');
    cy.intercept({ method: 'GET', url: '/api/modules/rup/prestaciones/huds/**' }).as('huds');
    cy.intercept({ method: 'GET', url: '/api/modules/top/reglas**' }).as('reglas');
    cy.intercept('GET', '/api/core/term/snomed/expression**', []).as('expression');
    cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
}