/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)

        cy.visit(Cypress.env('BASE_URL') + '/buscador', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('buscador de turnos y prestaciones', () => {
        cy.server();
        cy.route('**/api/modules/estadistica/turnos_prestaciones**').as('busqueda');
        // ingreso los valores en cada uno de los filtros
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        cy.get('plex-button[name="mostrar"]').click();
        const hoy = Cypress.moment().add(-6, 'days').format('DD/MM/YYYY')
        cy.get('plex-dateTime[name="fechaDesde"] input').clear().type(hoy).should('have.value', hoy);

        cy.get('plex-select[label="Equipo de salud"] input').type('monteverde');
        cy.get('plex-select[label="Equipo de salud"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="58f74fd4d03019f919ea17a8"]').click({
            force: true
        })
        cy.get('plex-select[name="estado"] input').type('Sin registro de asistencia{enter}');

        cy.get('plex-select[name="financiador"] input').type('neuquen');
        cy.get('plex-select[name="financiador"]').children().children().children('.selectize-input').click({
            force: true
        }).get('.option[data-value="5a7c837274342a1a5221ddd0"]').click({
            force: true
        })


        cy.get('plex-button[label="Buscar"]').click();
        cy.wait('@busqueda').then(() => {
            cy.get('plex-select[label="Equipo de salud"] .mdi-close-circle').click();
            cy.get('plex-select[name="estado"] .mdi-close-circle').click();

            cy.get('plex-select[name="prestaciones"] input').type('general');

            cy.get('plex-select[name="prestaciones"] ').children().children('.selectize-control').click()
                .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click()
            cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla

            cy.get('plex-button[label="Buscar"]').click();
        });
    });

})