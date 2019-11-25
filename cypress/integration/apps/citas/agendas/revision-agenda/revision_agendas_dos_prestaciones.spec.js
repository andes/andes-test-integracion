/// <reference types="Cypress" />

// import { buscarPaciente } from './revision_agendas.spec';

context('CITAS - Revisión de Agendas', () => {
    let token;
    let horaInicio;
    let tipoPrestacion1;
    let tipoPrestacion2;
    let idAgenda;
    let idBloque;
    let idTurno;
    let paciente;
    let pacienteDoc;

    beforeEach(() => {
        cy.seed();

        cy.login('30643636', 'asd').then(t => {
            token = t;
            return cy.createPaciente('paciente-masculino', token);
        }).then(xhr => {
            paciente = xhr.body;
            pacienteDoc = xhr.body.documento;
            return cy.createAgenda('agenda-auditada-con-dos-prestaciones', null, null, null, token);
        }).then((xhr) => {
            idAgenda = xhr.body.id;
            idBloque = xhr.body.bloques[0].id;
            idTurno = xhr.body.bloques[0].turnos[1].id;
            horaInicio = xhr.body.horaInicio;
            tipoPrestacion1 = xhr.body.tipoPrestaciones[0];
            tipoPrestacion2 = xhr.body.tipoPrestaciones[1];
        });
    });


    it.skip('Se selecciona la primera de dos prestaciones, luego se cambia por la segunda', () => {
        cy.goto(`/citas/revision_agenda/${idAgenda}`, token);
        cy.get('tbody:nth-child(1) tr:nth-child(3)').click();

        cy.buscarPaciente(pacienteDoc, false);

        // El <plex-select> no está armado con label
        cy.plexSelectType('name="tipoPrestacionTurno"').click().get('.option').contains(tipoPrestacion1.term).click();
        cy.wait(1000);
        cy.plexSelectType('name="tipoPrestacionTurno"').click().get('.option').contains(tipoPrestacion2.term).click();
        cy.plexSelectType('label="Asistencia"', 'Asistio');

    });

})