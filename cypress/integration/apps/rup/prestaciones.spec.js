/// <reference types="Cypress" />

context('prestaciones', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57fcf038326e73143fb48dac').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })
    beforeEach(() => {
        cy.visit('/rup', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('Registrar Prestación de Colonoscopia, Fuera de Agenda', () => {
        cy.server();
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '**/api/modules/rup/prestaciones*').as('guardar');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.route('GET', '/api/modules/cda/paciente/**', []).as('cda');
        cy.route('GET', '/api/core/term/snomed/**',[]).as('search');
        cy.plexButton('PACIENTE FUERA DE AGENDA').click();
        cy.plexSelectAsync('name="nombrePrestacion"', 'colonoscopia', '@prestaciones', 0);


        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', '3399661');
        cy.get('table tbody tr').first().click();
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
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
        cy.plexInt('name="intValue"').type('100');
        cy.get('plex-radio[name="binario"] input').eq(15).click({
            force: true
        });

        cy.plexButton('Guardar colonoscopia').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });

        cy.toast('success');
        cy.plexButton('Validar colonoscopia').click();

        // Popup alert
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
        });

    })
})