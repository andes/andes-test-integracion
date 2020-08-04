/// <reference types="Cypress" />

export function buscarPaciente(dni) {
    cy.plexButton("Buscar Paciente").click();
    cy.plexText('name="buscador"', dni);
    cy.wait('@listaPacientes');

    const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
    cy.get('plex-item').contains(documento).click();
    cy.wait('@getPaciente');
    cy.plexButton("Cambiar Paciente").click();
    cy.plexText('name="buscador"', dni);
    cy.wait('@listaPacientes');
    cy.get('plex-item').contains(documento).click();
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
        });
    })

    beforeEach(() => {
        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');
        cy.route('GET', '**/api/core/mpi/pacientes/**').as('getPaciente');
    });

    it('Comprueba datos de la agenda', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.get('plex-layout-sidebar header > fieldset > div > div:nth-child(2) > div').contains(/[A-Z]{3}\. [0-9]{2}\/[0-9]{2}\/[0-9]{4}, [0-9]{2}:[0-9]{2} a [0-9]{2}:[0-9]{2} hs/).should('not.be.empty');
        cy.get('plex-layout-sidebar header > fieldset > div > div:nth-child(3) > div div').should('not.be.empty');
        cy.get('plex-layout-sidebar header > fieldset > div > div:nth-child(4) > div div').should('not.be.empty');
        cy.get('plex-layout-sidebar header > fieldset > div > div:nth-child(5) > div span').should('not.be.empty');
        cy.plexButtonIcon('chevron-up').click();
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
                cy.get('.simple-notification').click();
            }
        });

    });



})