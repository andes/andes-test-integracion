/// <reference types="Cypress" />

context('CITAS - Revisión de Agendas', () => {
    let token;
    let agenda;
    let paciente;

    before(() => {
        cy.seed();
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            paciente = p;
            cy.task('database:seed:agenda', {
                pacientes: p._id,
                tipoPrestaciones: ['598ca8375adc68e2a0c121b8', '598ca8375adc68e2a0c121bc'],
                estado: 'auditada',
                organizacion: '57e9670e52df311059bc8964',
                horaInicio: Cypress.moment()
            }).then(a => {
                agenda = a;
            });
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.goto(`/citas/auditoria_agendas`, token);
        cy.get('tr:nth-child(1) td:first-child').click();
    })

    it('Agrega paciente a un turno, selecciona prestación y asistencia.', () => {
        cy.log(agenda);
        cy.seleccionarTurno('Turno Libre');
        cy.get('plex-table tr').plexButtonIcon('account-plus').click();
        cy.buscarPaciente(paciente.documento, false);
        cy.plexSelectType('name="tipoPrestacion"').click().get('.option').contains(agenda.tipoPrestaciones[0].term).click();
        cy.plexSelectType('name="tipoPrestacion"').click().get('.option').contains(agenda.tipoPrestaciones[1].term).click();
        cy.get('plex-dropdown button').click();
        cy.get('a').contains('Asistió').click();
    });

    it('Agregar un sobreturno a la agenda y selecciona una prestación y asistencia.', () => {
        cy.plexButtonIcon('account-plus').click();
        cy.buscarPaciente(paciente.documento, false);
        cy.plexSelectType('name="tipoPrestacion"').click().get('.option').contains(agenda.tipoPrestaciones[1].term).click();
        cy.plexDatetime('label="Hora Turno"', { text: Cypress.moment(agenda.horaInicio).format('HH:mm'), skipEnter: true });
        cy.plexButton('Guardar').click();
        cy.wait(1000);
        cy.seleccionarTurno(paciente.documento);
        cy.get('plex-dropdown').click();
        cy.get('a').contains('Sin Datos').click();
    });

});

