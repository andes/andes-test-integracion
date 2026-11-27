/// <reference types="Cypress" />

context('RUP - Mapa de agendas (Resonancia)', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            cy.task('database:seed:agenda', {
                pacientes: p._id,
                tipoPrestaciones: '65f34e1af7b4e4852242c49c',
                organizacion: '57e9670e52df311059bc8964',
                estado: 'publicada',
                fecha: 0,
                inicio: '10',
                fin: '12'
            });
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/api/modules/turnos/agenda?**').as('agendas');
    });

    it('muestra la agenda de resonancia magnética en la vista mensual', () => {
        cy.goto('/rup/mapa_agendas', token);
        cy.wait('@agendas');

        cy.url().should('include', 'mapa_agendas');
        cy.contains('CALENDARIO DE TURNOS');
        cy.get('mapa-agenda-mes table.mes').should('be.visible');

        cy.get('.progress').should('exist');
        cy.get('.progress-value')
            .invoke('text')
            .should('match', /1\s*\/\s*\d+/);

        cy.get('.progress-value')
            .filter((_, el) => /\s*1\s*\/\s*\d+/.test(el.textContent || ''))
            .first()
            .closest('td.selectable')
            .click();

        cy.contains('detalle del dia');
        cy.contains('No hay turnos asignados.').should('not.exist');
    });
});