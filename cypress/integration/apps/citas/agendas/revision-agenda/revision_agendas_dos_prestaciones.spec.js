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
                horaInicio: '2019-09-11T10:00:00.000-03:00'
            }).then(a => {
                agenda = a;
            });
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });
    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('busquedaPaciente');
    });

    it.skip('Se selecciona la primera de dos prestaciones, luego se cambia por la segunda', () => {
        cy.goto(`/citas/revision_agenda/${agenda._id}`, token);
        cy.get('tbody:nth-child(1) tr:nth-child(3)').click();

        cy.buscarPaciente(paciente.documento, false);
        cy.plexSelectType('name="tipoPrestacionTurno"').click().get('.option').contains(agenda.tipoPrestaciones[0].term).click();
        cy.wait(1000);
        cy.plexSelectType('name="tipoPrestacionTurno"').click().get('.option').contains(agenda.tipoPrestaciones[1].term).click();
        cy.plexSelectType('label="Asistencia"', 'Asistio');

    });

});