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
        cy.viewport(1280, 720);
        cy.login('30643636', 'asd').then(t => {
            token = t;
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhr => {
            paciente = xhr.body;
            pacienteDoc = xhr.body.documento;
            return cy.createAgenda('agenda-auditada-con-paciente', null, null, null, token);
        }).then((xhr) => {
            idAgenda = xhr.body.id;
            idBloque = xhr.body.bloques[0].id;
            idTurno = xhr.body.bloques[0].turnos[1].id;
            horaInicio = xhr.horaInicio;
        });
    });

    it('Se quita asistencia a paciente existente', () => {
        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.get('tbody:nth-child(1) tr:first-child').click();
        cy.plexSelectType('label="Asistencia"').click().get('.option').contains('No Asistio').click();
    });

    it('Se reestablece diagnóstico', () => {
        cy.server();
        cy.route('GET', '**/api/modules/obraSocial/puco/**').as('consultaPuco');
        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.get('tbody:nth-child(1) tr:first-child').click();


        cy.get('plex-layout-main .plex-box-content').scrollTo('bottom');
        cy.wait(500);

        // Hay que corregir el plex-button, ya que debería funcionar así:
        cy.plexButtonIcon('refresh').click();

        cy.get('div[class="simple-notification toast success"]').contains('El estado de la agenda fue actualizado');

        // Hay que corregir el plex-button, ya que debería funcionar así:
        cy.plexButtonIcon('pencil').click();

        cy.plexText('name="searchTerm"', 'fiebre inducida por drogas');

        cy.route('GET', '**/api/core/term/cie10**').as('diagnosticos');

        cy.wait('@diagnosticos');

        cy.get('tr td').contains('Fiebre inducida por drogas').click();

    });

    it('Se agrega sobreturno', () => {
        cy.server();
        cy.route('GET', '**/api/auth/organizaciones**').as('organizacionesGet');
        cy.route('POST', '**/api/auth/organizaciones**').as('organizacionesPost');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('agendas');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');

        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);

        cy.wait('@organizacionesGet');

        // Ver cómo detectar si hay scroll
        // cy.get('plex-layout-sidebar .plex-box-content').scrollTo('bottom');

        cy.wait('@agendas');

        cy.plexButton('Agregar Sobreturno').click();
        cy.plexText('name="buscador"', pacienteDoc);
        cy.wait('@listaPacientes');
        cy.get('tr td').contains(pacienteDoc).click();
        cy.plexDatetime('label="Hora Turno"', Cypress.moment(horaInicio).format('HH:mm'));
        cy.plexButton('Guardar').click();

    });

})