/// <reference types="Cypress" />

const agenda = require('../../../../fixtures/agenda_auditada');

context('TM Profesional', () => {
    let token;
    let idAgenda;
    let idBloque;
    let idTurno;
    let paciente;
    let pacienteDoc;
    before(() => {
        cy.seed();
        cy.viewport(1280, 720);
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-normal', token).then((xhr) => {
                paciente = xhr.body;
                pacienteDoc = xhr.body.documento;
                cy.createAgenda('agenda_auditada', null, null, null, token).then((xhr) => {
                    idAgenda = xhr.body.id;
                    idBloque = xhr.body.bloques[0].id;
                    idTurno = xhr.body.bloques[0].turnos[1].id;
                    cy.createTurno('nuevo-turno-asistio', idTurno, idBloque, idAgenda, paciente, token).then(xhr => {
                        cy.createPrestacionAgenda('prestacion-validada-turno', idTurno, paciente, token).then(xhr => {
                            cy.log(xhr.body.paciente);
                        });
                    });
                });
            });
        });
    })

    beforeEach(() => {
        // cy.seed();
        // cy.createAgenda('agenda_auditada', null, null, null, token).then((xhr) => {
        //     idAgenda = xhr.body.id;
        //     cy.log(idAgenda);
        // });
        // cy.createPaciente('paciente-normal', token).then((xhr) => {
        //     pacienteDoc = xhr.body.documento;
        // });
    });

    // it('Asignar paciente con asistencia, sin prestación', () => {
    //     cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
    //     cy.get('tr:nth-child(1) td:first-child').click();
    //     cy.plexButton("Buscar Paciente").click();
    //     cy.plexText('name="buscador"', pacienteDoc);

    //     cy.server();
    //     cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');

    //     cy.wait('@listaPacientes');
    //     cy.get('tr td').contains(pacienteDoc).click();

    //     cy.plexSelectType('label="Asistencia"', 'Asistio');



    // });


    it('Cambiar paciente', () => {

        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        // cy.get('tr:nth-child(1) td:first-child').click();
        // cy.plexButton("Buscar Paciente").click();
        // cy.plexText('name="buscador"', pacienteDoc);

        // cy.server();
        // cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');

        // cy.wait('@listaPacientes');

        // cy.get('tr td').contains(pacienteDoc).click();

        // cy.plexButton("Cambiar Paciente").click();
        // cy.plexText('name="buscador"', pacienteDoc);

        // cy.wait('@listaPacientes');
        // cy.get('tr td').contains(pacienteDoc).click();

        // cy.plexSelectType('label="Asistencia"', 'Asistio');

        // cy.plexText('name="searchTerm"', 'c11');

        // cy.route('GET', '**/api/core/term/cie10**').as('diagnosticos');

        // cy.wait('@diagnosticos');

        // cy.get('tr td').contains('C11.0').click();

        // cy.plexButtonIcon('delete').click();

    });

})