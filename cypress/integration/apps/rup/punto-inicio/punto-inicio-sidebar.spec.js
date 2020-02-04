/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token;
    let pacientes;

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
        let agendaDinamica, agendaNoNominalizada;

        before(() => {

            cy.cleanDB(['agenda', 'prestaciones']);

            cy.task('database:seed:agenda', {
                inicio: 0,
                fin: 4,
                pacientes: pacientes.map(p => p._id)
            });

            cy.task('database:seed:agenda', {
                inicio: 1,
                fin: 5,
                pacientes: pacientes.map(p => p._id),
                dinamica: true
            }).then((agenda) => agendaDinamica = agenda);

            cy.task('database:seed:agenda', {
                inicio: 2,
                fin: 5,
                tipoPrestaciones: '5b61d59968954f3e6ea84586'
            }).then((agenda) => agendaNoNominalizada = agenda);

        })

        beforeEach(() => {

            cy.server();
            cy.route({ method: 'GET', url: '**/api/modules/turnos/agenda**' }).as('agendas');
            cy.route({ method: 'POST', url: '**/api/modules/rup/prestaciones**' }).as('crearPrestacion');
            cy.route({ method: 'GET', url: '**/api/modules/rup/prestaciones**' }).as('prestaciones');
            cy.route({ method: 'GET', url: '**/api/modules/turnero/pantalla**' }).as('turnero');
            cy.route({ method: 'GET', url: '**/api/modules/rup/elementosRUP**' }).as('elementosRUP');
            cy.route({ method: 'GET', url: '**/api/auth/organizaciones**' }).as('organizaciones');
            cy.route({ method: 'GET', url: '**/api/core/tm/tiposPrestaciones**' }).as('tiposPrestaciones');
            cy.route({ method: 'GET', url: '**api/modules/cde/paciente**' }).as('paciente');
            cy.route({ method: 'GET', url: '/api/modules/rup/prestaciones/huds/**', response: [] }).as('huds');
            cy.route({ method: 'GET', url: '/api/modules/top/reglas**', response: [] }).as('reglas');

        });

        ['comun', 'dinamica', 'no-nominalizada'].forEach((typeAgenda, agendaIndex) => {

            if (typeAgenda === 'no-nominalizada') {

                flujoPrestacion(typeAgenda, agendaIndex, null, 0);

            } else {
                ['validado', 'temporal', 'sin-documento'].forEach((typePaciente, i) => {

                    flujoPrestacion(typeAgenda, agendaIndex, typePaciente, i);

                    if (typeAgenda === 'dinamica') {
                        it(`agregar paciente agenda dinamica - ${typePaciente}`, () => {
                            cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
                            cy.route('PATCH', '**/api/modules/turnos/turno/agenda/**').as('agregarTurnoDinamico');
                            cy.goto('/rup', token);
                            cy.wait('@agendas');
                            cy.wait('@tiposPrestaciones');
                            cy.wait('@turnero');
                            cy.wait('@tiposPrestaciones');
                            cy.wait('@tiposPrestaciones');
                            cy.wait('@prestaciones');
                            cy.wait(1000);

                            cy.get('table').first().as('tablaAgendas');
                            cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();

                            cy.plexButton('AGREGAR PACIENTE').click();

                            cy.get('paciente-buscar input').first().type(pacientes[i].nombre);
                            cy.wait('@consultaPaciente');

                            cy.get('paciente-listado').find('table tbody').contains(pacientes[i].nombre).click();

                            cy.get('plex-layout-sidebar').plexButton('Guardar').click();

                            cy.swal('confirm');

                            cy.wait('@agregarTurnoDinamico').then((xhr) => {
                                const agenda = xhr.response.body;
                                expect(agenda.dinamica).to.be.eq(true);
                                expect(agenda.bloques[0].turnos[i + 3].paciente.id).to.be.eq(pacientes[i]._id);
                            })
                            cy.wait('@crearPrestacion').then((xhr) => {
                                const prestacion = xhr.response.body;
                                expect(prestacion.paciente.id).to.be.eq(pacientes[i]._id);
                                expect(prestacion.solicitud.tipoPrestacion.conceptId).to.be.eq(agendaDinamica.tipoPrestaciones[0].conceptId);


                            })


                        });
                    }
                });
            }
        });
    });

    // describe('prestaciones fuera de agenda', () => {
    //     let idPrestacion;
    //     let dtoValidacion = {
    //         op: 'estadoPush',
    //         estado: { tipo: 'validada' }
    //     };

    //     beforeEach(() => {
    //         cy.server();
    //         cy.cleanDB(['agenda', 'prestaciones']);
    //         cy.task('database:seed:prestacion', { paciente: pacientes[0]._id });
    //     });

    //     it.only('Visualizar boton "continuar registro" en prestacion fuera de agenda', () => {
    //         cy.goto('/rup', token);
    //         cy.wait(1000);
    //         cy.get('table').first().find('tbody tr').eq(1).click();
    //         cy.plexButton('CONTINUAR REGISTRO').click();

    //         cy.url().should('include', '/rup/ejecucion/').then($url => {
    //             const parts = $url.split('/');
    //             idPrestacion = parts[parts.length - 1];

    //             cy.patch('/api/modules/rup/prestaciones/' + idPrestacion, dtoValidacion, token);
    //             setRoute();
    //             cy.goto('/rup', token);
    //             cy.wait(1000);
    //             cy.get('table').find('td').contains('Fuera de agenda').click();
    //             cy.plexButton('VER RESUMEN');
    //         });
    //     });
    // })

    function flujoPrestacion(typeAgenda, agendaIndex, typePaciente, pacienteIndex) {

        describe(`flujo prestación agenda ${typeAgenda} paciente ${typePaciente}`, () => {
            let idPrestacion;

            it('iniciar prestacion', () => {
                const paciente = pacientes[pacienteIndex];

                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@tiposPrestaciones');
                cy.wait('@turnero');
                cy.wait('@tiposPrestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@prestaciones');
                cy.wait('@prestaciones');

                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').should('have.length', 3);

                cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();

                cy.plexButton('INICIAR PRESTACIÓN').click();
                cy.swal('confirm');
                cy.wait('@crearPrestacion');
                cy.url().should('include', '/rup/ejecucion/').then($url => {
                    const parts = $url.split('/');
                    idPrestacion = parts[parts.length - 1];
                    cy.route('GET', '**/api/modules/rup/prestaciones/' + idPrestacion).as('findPrestacion');
                    cy.wait('@findPrestacion').then((xhr) => {
                        const prestacion = xhr.response.body;
                        expect(prestacion.id).to.be.eq(idPrestacion)
                    });
                });
            });

            it('continuar prestacion', () => {
                cy.log(idPrestacion)
                cy.route('GET', '**/api/modules/rup/prestaciones/' + idPrestacion).as('findPrestacion');

                const paciente = pacientes[pacienteIndex];

                setRoute();
                cy.goto('/rup', token);
                cy.wait('@agendas');
                cy.wait('@tiposPrestaciones');
                cy.wait('@turnero');
                cy.wait('@tiposPrestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@prestaciones');
                cy.wait('@prestaciones');

                cy.get('table').first().as('tablaAgendas');
                cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();
                cy.plexButton('CONTINUAR REGISTRO').click();


                cy.url().should('include', '/rup/ejecucion/');
                cy.wait('@findPrestacion').then((xhr) => {
                    const prestacion = xhr.response.body;
                    expect(prestacion.id).to.be.eq(idPrestacion)
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
                cy.wait('@tiposPrestaciones');
                cy.wait('@turnero');
                cy.wait('@tiposPrestaciones');
                cy.wait('@tiposPrestaciones');
                cy.wait('@prestaciones');
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
                    cy.wait('@tiposPrestaciones');
                    cy.wait('@turnero');
                    cy.wait('@tiposPrestaciones');
                    cy.wait('@tiposPrestaciones');
                    cy.wait('@prestaciones');
                    cy.wait('@prestaciones');

                    cy.get('table').first().as('tablaAgendas');
                    cy.get('@tablaAgendas').find('tbody tr').eq(agendaIndex).click();
                    cy.plexButton('VER HUDS').click();
                    cy.contains('Procesos de Auditoría').click({ force: true });

                    cy.plexButton('ACEPTAR').click();
                    cy.url().should('include', '/rup/vista/');
                });
            }

        })

    }
});


function setRoute() {
    cy.server();
    cy.route({ method: 'GET', url: '**/api/modules/turnos/agenda**' }).as('agendas');
    cy.route({ method: 'POST', url: '**/api/modules/rup/prestaciones**' }).as('crearPrestacion');
    cy.route({ method: 'GET', url: '**/api/modules/rup/prestaciones**' }).as('prestaciones');
    cy.route({ method: 'GET', url: '**/api/modules/turnero/pantalla**' }).as('turnero');
    cy.route({ method: 'GET', url: '**/api/modules/rup/elementosRUP**' }).as('elementosRUP');
    cy.route({ method: 'GET', url: '**/api/core/tm/tiposPrestaciones**' }).as('tiposPrestaciones');
    cy.route({ method: 'GET', url: '**api/modules/cde/paciente**' }).as('paciente');
    cy.route({ method: 'GET', url: '/api/modules/rup/prestaciones/huds/**', response: [] }).as('huds');
    cy.route({ method: 'GET', url: '/api/modules/top/reglas**', response: [] }).as('reglas');
    cy.route('GET', '/api/core/term/snomed/expression**', []).as('expression');
    cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
}