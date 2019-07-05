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
        cy.visit(Cypress.env('BASE_URL') + '/citas/punto-inicio', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    // Necesita tener cargada una agenda para colonoscopia, publicada. Que tenga el horario 15:00 disponible
    it.skip('Registrar Prestación de Colonoscopia', () => {
        cy.server();
        // doy turno
        cy.get('plex-text input[type=text]').first().type('12325484');
        cy.get('tr').contains('OROS, CAMILO').first().click()
        cy.get('plex-button').first().click()
        cy.get('plex-select[name="tipoPrestacion"] input').type('colonoscopia{enter}');
        cy.get('.outline-success ').first().click();
        cy.get('div').contains('15:00').first().click()
        cy.get('plex-button[label="Confirmar"]').click();
        cy.get('div[class="simple-notification toast info"]').contains('El turno se asignó correctamente');

        // comienzo la atención
        cy.visit(Cypress.env('BASE_URL') + '/rup');
        cy.get('plex-button[title="Mostrar todas las agendas"]').click();
        cy.get('plex-select[label="Filtrar por prestación"] input').type('colonoscopia{enter}');
        cy.wait(2000);
        cy.get('tbody td').first().click();
        cy.get('plex-button[label="INICIAR PRESTACIÓN"]').first().click();
        cy.get('button[class="swal2-confirm btn btn-success"]').click();
        // cy.get('plex-button[label="CONTINUAR REGISTRO"]').first().click();
        cy.wait(2000);
        cy.get('div[class="introjs-tooltipbuttons"] a[class="introjs-button introjs-skipbutton"]').click();

        // completo el procedimiento
        cy.get('plex-radio[name="binario"] input').first().click({
            force: true
        });
        cy.get('plex-radio[name="binario"] input').eq(2).click({
            force: true
        });
        cy.get('plex-radio[name="binario"] input').eq(7).click({
            force: true
        });
        cy.get('plex-radio[name="CI"] input').first().click({
            force: true
        });
        cy.get('plex-radio[name="CT"] input').first().click({
            force: true
        });
        cy.get('plex-radio[name="CD"] input').first().click({
            force: true
        });
        cy.get('plex-radio[name="binario"] input').eq(11).click({
            force: true
        });
        cy.get('plex-radio[name="binario"] input').eq(13).click({
            force: true
        });
        cy.get('plex-radio[name="binario"] input').eq(15).click({
            force: true
        });

        cy.route('GET', '**/api/modules/rup/prestaciones*').as('guardar');
        cy.get('footer plex-button[type="success"]').click(); // guarda colonoscopia
        cy.wait('@guardar').then(() => {
            cy.get('footer plex-button[type="success"]').click(); // valida colonoscopia
        })
        cy.get('button').contains('CONFIRMAR').click();

        cy.get('div[class="simple-notification toast success"]').contains('La prestación se validó correctamente');
    })
})