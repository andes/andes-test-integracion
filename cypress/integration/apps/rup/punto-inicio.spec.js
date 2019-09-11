/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
        })
    })

    it('Iniciar prestación - Fuera de agenda', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.route(/api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click({
            force: true
        });

        cy.wait('@prestaciones');
        cy.selectOption('name="nombrePrestacion"', '"598ca8375adc68e2a0c121b8"');

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click({
            force: true
        });
        cy.get('plex-text input').first().type('3399661');
        cy.get('table tbody tr').first().click();

        cy.get('plex-button[type="success"]').contains('INICIAR PRESTACIÓN').click();
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.wait(3000); // le da tiempo para que cargue el sidebar
        cy.get('plex-text[name="searchTerm"] input').first().type('fiebre');
        cy.wait(3000);
        cy.wait('@search').then((xhr) => {
            cy.get('.mdi-plus').first().click();
            cy.get('textarea').first().type('test', {
                force: true
            });
        });

        cy.get('span').contains('Guardar consulta de medicina general').click({
            force: true
        });
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.eq(undefined);
        });
        cy.wait(1000); // da tiempo para que el boton cambie de cartel
        cy.get('span').contains('Validar consulta de medicina general').first().click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.eq(undefined);
        });

    });
});