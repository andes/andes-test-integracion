/// <reference types="Cypress" />

context('CITAS - Revisión de Agendas', () => {
    let token;
    let horaInicio;
    let idAgenda;
    let idBloque;
    let idTurno;
    let paciente;
    let pacienteDoc;
    before(() => {

    })

    beforeEach(() => {
        cy.cleanDB();

        cy.login('30643636', 'asd').then(t => {
            token = t;
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhrPac => {
            paciente = xhrPac.body;
            pacienteDoc = xhrPac.body.documento;
            return cy.createAgenda('agenda-auditada-con-paciente', null, null, null, token);
        }).then((xhrAgenda) => {
            // cy.log(xhrAgenda);
            idAgenda = xhrAgenda.body.id;
            idBloque = xhrAgenda.body.bloques[0].id;
            idTurno = xhrAgenda.body.bloques[0].turnos[0].id;
            horaInicio = xhrAgenda.horaInicio;
        });
    });

    it('Se quita asistencia a paciente existente', () => {

        cy.server();
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('agenda');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('paciente');
        cy.route('PUT', '**/api/modules/turnos/turno/*/bloque/*/agenda/**').as('putTurno');

        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.get('tbody:nth-child(1) tr:first-child').click();
        cy.plexSelectType('label="Asistencia"').click().get('.option').contains('No Asistio').click();
        cy.toast('success', 'El estado de la agenda fue actualizado');

        cy.wait('@agenda').then(xhrAgenda => {
            cy.expect(xhrAgenda.status).to.be.eq(200);
            const turnoAgendaAsistio = xhrAgenda.response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno);

            cy.wait('@paciente').then(xhrPaciente => {
                cy.expect(xhrPaciente.status).to.be.eq(200);
                cy.expect(xhrPaciente.response.body.id).to.be.eq(turnoAgendaAsistio.paciente.id);
                cy.expect(turnoAgendaAsistio.asistencia).to.be.eq('asistio');
            });

            cy.wait('@putTurno').then(xhrTurno => {
                // cy.log(xhrTurno.response.body);
                const turnoAgendaNoAsistio = xhrTurno.response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno);

                cy.expect(xhrTurno.status).to.be.eq(200);
                cy.expect(turnoAgendaNoAsistio.paciente.id).to.be.eq(turnoAgendaAsistio.paciente.id);
                cy.expect(turnoAgendaNoAsistio.asistencia).to.be.eq('noAsistio');
            });

        });


    });

    it('Se reestablece diagnóstico', () => {
        cy.server();
        cy.route('GET', '**/api/core/term/cie10**').as('diagnosticos');
        cy.route('PUT', '**/api/modules/turnos/turno/*/bloque/*/agenda/**').as('putTurno');
        // cy.route('PUT', '**/api/modules/turnos/turno/*/bloque/*/agenda/**', req2).as('putTurno2');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda');

        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.get('tbody:nth-child(1) tr:first-child').click();

        cy.get('plex-layout-main .plex-box-content').scrollTo('bottom');
        cy.wait(500);

        // Hay que corregir el plex-button, ya que debería funcionar así:
        cy.plexButtonIcon('refresh').click();

        cy.toast('success', 'El estado de la agenda fue actualizado');

        // Hay que corregir el plex-button, ya que debería funcionar así:
        cy.plexButtonIcon('pencil').click();

        cy.plexText('name="searchTerm"', 'fiebre inducida por drogas');

        cy.wait('@diagnosticos').then(xhrDiag => {
            cy.expect(xhrDiag.status).to.be.eq(200);
            cy.expect(xhrDiag.response.body[0].codigo).to.be.eq('R50.2');
        });

        cy.get('tr td').contains('Fiebre inducida por drogas').click();

        cy.toast('success', 'El estado de la agenda fue actualizado');


        cy.wait('@putTurno').then(xhrPT => {
            cy.expect(xhrPT.status).to.be.eq(200);
            cy.expect(xhrPT.response.body.id).to.be.eq(idAgenda);
            const idTurnoPut = xhrPT.response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno).id;
            cy.expect(idTurnoPut).to.be.eq(idTurno);

        });

        cy.wait('@patchAgenda').then(xhrPA => {
            cy.expect(xhrPA.status).to.be.eq(200);
            cy.expect(xhrPA.response.body.id).to.be.eq(idAgenda);
            const diagCIE10 = xhrPA.response.body.bloques.find(
                x => x.id === idBloque).turnos.find(
                    y => y.id === idTurno).diagnostico.codificaciones[0];

            if (diagCIE10 && diagCIE10.codificacionAuditoria) {
                cy.expect(diagCIE10.codificacionAuditoria.codigo).to.be.eq('R50.2');
            }
        });


    });

    it('Se agrega sobreturno', () => {
        cy.server();
        cy.route('GET', '**/api/auth/organizaciones**').as('organizacionesGet');
        cy.route('POST', '**/api/auth/organizaciones**').as('organizacionesPost');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('agenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('agendaPatch');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');

        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);

        // Ver cómo detectar si hay scroll
        // cy.get('plex-layout-sidebar .plex-box-content').scrollTo('bottom');

        cy.wait('@agenda').then(xhrAgenda => {
            cy.expect(xhrAgenda.status).to.be.eq(200);
            cy.expect(xhrAgenda.response.body.id).to.be.eq(idAgenda);
            cy.plexButton('Agregar Sobreturno').click();
            cy.plexText('name="buscador"', pacienteDoc);
            cy.wait('@listaPacientes');
            cy.get('tr td').contains(pacienteDoc).click();
            cy.plexDatetime('label="Hora Turno"', Cypress.moment(xhrAgenda.response.body.horaInicio).add(10, 'minutes').format('HH:mm'));
            cy.plexButton('Guardar').click();
            cy.wait('@agendaPatch').then(xhrAgendaPatch => {
                cy.expect(xhrAgendaPatch.status).to.be.eq(200);
                cy.expect(xhrAgendaPatch.response.body.sobreturnos.find(x => x.paciente.id === paciente.id).paciente.id).to.be.eq(paciente.id);
            });
        });


    });

})