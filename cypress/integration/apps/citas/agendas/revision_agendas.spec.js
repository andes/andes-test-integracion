/// <reference types="Cypress" />

export function buscarPaciente(pacienteDoc) {
    cy.wait(4500);
    cy.plexButton("Buscar Paciente").click();
    cy.plexText('name="buscador"', pacienteDoc);

    cy.server();
    cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');

    cy.wait('@listaPacientes');

    cy.get('tr td').contains(pacienteDoc).click();

    cy.plexButton("Cambiar Paciente").click();
    cy.plexText('name="buscador"', pacienteDoc);

    cy.wait('@listaPacientes');
    cy.get('tr td').contains(pacienteDoc).click();
};

context('CITAS - Revisión de Agendas', () => {
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
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhr => {
            paciente = xhr.body;
            pacienteDoc = xhr.body.documento;
            return cy.createAgenda('agenda-auditada', null, null, null, token);
        }).then((xhr) => {
            idAgenda = xhr.body.id;
            idBloque = xhr.body.bloques[0].id;
            idTurno = xhr.body.bloques[0].turnos[1].id;
            return cy.createTurno('nuevo-turno-asistio', idTurno, idBloque, idAgenda, paciente, token);
            // }).then(xhr => {
            // return cy.createPrestacionAgenda('prestacion-validada-turno', idTurno, paciente, token);
        }).then(xhr => {
            cy.log(xhr.body.paciente);
        });
    })

    beforeEach(() => {
        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.server();
    });

    it('Agregar y eliminar un diagnóstico', () => {
        cy.get('tr:nth-child(1) td:first-child').click();

        buscarPaciente(pacienteDoc);
        cy.plexSelectType('label="Asistencia"', 'Asistio');

        cy.plexText('name="searchTerm"', 'c11');

        cy.route('GET', '**/api/core/term/cie10**').as('diagnosticos');

        cy.wait('@diagnosticos');

        cy.get('tr td').contains('C11.0').click();

        cy.plexButtonIcon('delete').click();

    });


    it('Asignar asistencia a todos los turnos, mismo paciente', () => {

        let listaTurnos = cy.get('plex-layout-sidebar > .plex-box > .plex-box-content table:first-child tr');

        listaTurnos.each(($el, index, $list) => {
            if (index > 0) {
                cy.get($el).click();
                buscarPaciente(pacienteDoc);
                cy.plexSelectType('label="Asistencia"').click().get('.option').contains('No Asistio').click();
                cy.wait(4500);
            }
        });

    });



})