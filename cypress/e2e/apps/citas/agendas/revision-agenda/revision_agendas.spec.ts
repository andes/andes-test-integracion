/// <reference types="Cypress" />

context('CITAS - Revisión de Agendas', () => {
    let token;
    let idAgenda;
    let idBloque;
    let idTurno;
    let paciente;
    let pacienteDoc;
    let horaInicio;
    let prestacion;
    let estado = 'Pendiente Auditoria';
    let equipoSalud;
    before(() => {
        cy.seed();

        cy.login('30643636', 'asd').then(t => {
            token = t;
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhr => {
            paciente = xhr.body;
            pacienteDoc = xhr.body.documento;
            return cy.createAgenda('agenda-auditada', 0, 0, 0, token);
        }).then((xhr) => {
            idAgenda = xhr.body.id;
            idBloque = xhr.body.bloques[0].id;
            idTurno = xhr.body.bloques[0].turnos[1].id;
            prestacion = xhr.body.bloques[0].tipoPrestaciones[0].term;
            horaInicio = xhr.body.horaInicio;
            equipoSalud = xhr.body.nombreCompleto;
            return cy.createTurno('nuevo-turno-asistio', idTurno, idBloque, idAgenda, paciente, token);
        });
    })

    beforeEach(() => {
        cy.goto(`/citas/auditoria_agendas`, token);
    });

    it('Comprueba datos de la agenda', () => {
        cy.plexDatetime('label="Desde"', { text: Cypress.moment().format('DD/MM/YYYY'), clear: true, skipEnter: true });
        cy.plexSelectType('label="Prestación"', prestacion);
        cy.plexSelectType('label="Estado"', estado);
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Equipo de Salud"', equipoSalud);
        cy.plexButtonIcon('chevron-up').click();
    });

    it('Agregar y eliminar un diagnóstico', () => {
        cy.get('tr:nth-child(1) td:first-child').click();
        cy.seleccionarTurno('Turno Libre');
        AgregarPaciente();
        cy.buscarPaciente(pacienteDoc, false);
        cy.get('plex-dropdown').click();
        cy.get('a').contains('Asistió').click();
        cy.plexButtonIcon('pc').click();
        cy.plexText('name="searchTerm"', 'c11');
        cy.intercept('GET', '**/api/core/term/cie10**').as('diagnosticos');
        cy.wait('@diagnosticos');
        cy.get('tr td').contains('C11.0').click();
        cy.get('plex-bool').click();
        cy.get('plex-layout-sidebar plex-table tr td').contains('Principal').click();
        cy.plexButtonIcon('delete').click();
    });

    it('Asignar asistencia a varios turnos, mismo paciente', () => {
        cy.get('tr:nth-child(1) td:first-child').click();
        let listaTurnos = cy.get('plex-layout-sidebar plex-table tr');
        listaTurnos.each(($el, index, $list) => {
            if (index > 0 && index <= 3) {
                console.log('index:', index);
                cy.seleccionarTurno('Turno Libre');
                AgregarPaciente();
                cy.buscarPaciente(pacienteDoc, false);
                cy.get('plex-dropdown').click();
                cy.get('a').contains(index === 1 ? 'Asistió' : index === 2 ? 'No Asistió' : 'Sin Datos').click();
            }
        });
    });

    it('Agregar un sobreturno a la agenda', () => {
        cy.get('tr:nth-child(1) td:first-child').click();
        cy.plexButtonIcon('account-plus').click();
        cy.buscarPaciente(pacienteDoc, false);
        cy.plexDatetime('label="Hora Turno"', { text: Cypress.moment(horaInicio).format('HH:mm'), skipEnter: true });
        cy.plexButton('Guardar').click();
        cy.wait(1000);
        cy.seleccionarTurno(pacienteDoc, '.sobreturnos');
        cy.get('plex-dropdown').click();
        cy.get('a').contains('Sin Datos').click();
    });

})

function AgregarPaciente() {
    cy.get('plex-table tr').plexButtonIcon('account-plus').click();
}
