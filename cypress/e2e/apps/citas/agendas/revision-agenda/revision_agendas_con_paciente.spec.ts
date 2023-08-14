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
        cy.task('database:seed:agenda', {
            tipoPrestaciones: '598ca8375adc68e2a0c121d5',
            dinamica: true,
            profesionales: null,
            fecha: '-1',
            inicio: '22', fin: '23'
        });

        cy.login('30643636', 'asd').then(t => {
            token = t;
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhrPac => {
            paciente = xhrPac.body;
            pacienteDoc = xhrPac.body;
            return cy.createAgenda('agenda-auditada-con-paciente', 0, 0, 1, token);
        }).then((xhrAgenda) => {
            idAgenda = xhrAgenda.body.id;
            idBloque = xhrAgenda.body.bloques[0].id;
            idTurno = xhrAgenda.body.bloques[0].turnos[0].id;
            horaInicio = xhrAgenda.body.horaInicio;
        });
        cy.intercept('GET', '**/api/modules/turnos/agenda/**').as('agenda');
        cy.intercept('PATCH', '**/api/modules/turnos/agenda/**').as('agendaPatch');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('paciente');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**').as('listaPacientes');
        cy.intercept('PUT', '**/api/modules/turnos/turno/*/bloque/*/agenda/**').as('putTurno');
        cy.intercept('GET', '**/api/core/term/cie10**', req => {
            delete req.headers['if-none-match'] // evita que responda con datos de caché (statusCode 304)
        }).as('diagnosticos');
    });

    it('Se quita asistencia a paciente existente', () => {
        cy.goto('/citas/auditoria_agendas', token);
        cy.get('tr:nth-child(1) td:first-child').click();

        cy.seleccionarTurno('FELIPE');
        cy.plexButtonIcon('undo').click();
        cy.get('plex-dropdown').click();
        cy.get('a').contains('No Asistió').click();

        let turnoAgendaAsistio;
        cy.wait('@agenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            turnoAgendaAsistio = response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno);
            expect(turnoAgendaAsistio.asistencia).to.be.eq('asistio');
        });

        cy.wait('@putTurno').then(({ response }) => {
            const turnoAgendaNoAsistio = response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno);
            expect(response.statusCode).to.be.eq(200);
            expect(turnoAgendaNoAsistio.paciente.id).to.be.eq(turnoAgendaAsistio.paciente.id);
            expect(turnoAgendaNoAsistio.asistencia).to.be.eq('noAsistio');
        });
    });

    it('Se reestablece diagnóstico', () => {

        cy.goto(`/citas/auditoria_agendas`, token);

        seleccionarAgenda();
        cy.seleccionarTurno('Auditado', '.turnos');

        cy.plexButtonIcon('undo').click();
        cy.get('plex-dropdown').click();
        cy.get('a').contains('Asistió').click();
        cy.plexButtonIcon('pc').click();
        cy.seleccionarTurno('Principal', '.codificacion')
        cy.plexButtonIcon('refresh').click();

        cy.plexButtonIcon('-herramienta').click();
        cy.plexText('name="searchTerm"', 'fiebre inducida por drogas');

        // cy.wait('@diagnosticos').then(({ response }) => {
        //     expect(response.statusCode).to.be.eq(200);
        //     console.log('response.body', response.body[0].codigo);
        //     expect(response.body[0].codigo).to.be.eq('R50.2');
        // });

        cy.wait('@diagnosticos')
        cy.get('tr td').contains('Fiebre inducida por drogas').click();

        cy.wait('@putTurno').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.id).to.be.eq(idAgenda);
            const idTurnoPut = response.body.bloques.find(x => x.id === idBloque).turnos.find(y => y.id === idTurno).id;
            expect(idTurnoPut).to.be.eq(idTurno);
        });

        // cy.wait('@agendaPatch').then(({ response }) => {
        //     expect(response.statusCode).to.be.eq(200);
        //     expect(response.body.id).to.be.eq(idAgenda);
        //     const diagCIE10 = response.body.bloques.find(
        //         x => x.id === idBloque).turnos.find(
        //             y => y.id === idTurno).diagnostico.codificaciones[0];

        //     if (diagCIE10 && diagCIE10.codificacionAuditoria) {
        //         console.log('id', response.body.id, 'diagCIE10.codificacionAuditoria.codigo', diagCIE10.codificacionAuditoria.codigo);
        //         expect(diagCIE10.codificacionAuditoria.codigo).to.be.eq('R50.2');
        //     }
        // });
    });

    it('Se agrega sobreturno', () => {
        cy.goto(`/citas/auditoria_agendas`, token);
        seleccionarAgenda();

        cy.wait('@agenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.id).to.be.eq(idAgenda);
        });

        cy.plexButtonIcon('account-plus').click();
        cy.buscarPaciente(pacienteDoc.documento, false)
        cy.wait('@listaPacientes').then(({ response }) => {
            expect(response.body[0].documento).to.be.eq(pacienteDoc.documento)
        })

        cy.plexDatetime('label="Hora Turno"', { text: Cypress.moment(horaInicio).add(15, 'minutes').format('HH:mm'), skipEnter: true });
        cy.plexButton('Guardar').click();
        cy.wait('@agendaPatch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.sobreturnos.find(x => x.paciente.id === paciente.id).paciente.id).to.be.eq(paciente.id);
        });
    });

    it('Se agrega sobreturno agenda dinamica', () => {
        cy.goto(`/citas/auditoria_agendas`, token);
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + Cypress.moment().add(-1, 'days').format('DD/MM/YYYY'));

        seleccionarAgenda();
        cy.wait('@agenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.id).to.be.eq(idAgenda);
        });

        cy.plexButtonIcon('account-plus').click();
        cy.buscarPaciente(pacienteDoc.documento, false);
        cy.wait('@listaPacientes').then(({ response }) => {
            expect(response.body[0].documento).to.be.eq(pacienteDoc.documento)
        })

        cy.plexDatetime('label="Hora Turno"', { text: Cypress.moment(horaInicio).add(30, 'minutes').format('HH:mm'), skipEnter: true });
        cy.plexButton('Guardar').click();
        cy.wait('@agendaPatch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.wait(2000);
        cy.seleccionarTurno(pacienteDoc.documento, '.sobreturnos');
    });
})

function seleccionarAgenda() {
    cy.get('tr:nth-child(1) td:first-child').click();
}