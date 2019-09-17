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

    it('Iniciar y validar prestación - Fuera de agenda', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
            console.log(fixtures);
        });
        // Stub
        cy.route(/api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click();

        cy.wait('@prestaciones');
        cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="598ca8375adc68e2a0c121b8"]').click();

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click();
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

        cy.get('plex-text[name="searchTerm"] input').first().type('fiebre');
        cy.wait(3000);
        cy.wait('@search').then((xhr) => {
            console.log('Search', xhr);
        });

        cy.get('.mdi-plus').first().click();
        cy.get('textarea').first().type('test', {
            force: true
        });
        cy.get('span').contains('Guardar consulta de medicina general').click({
            force: true
        });
        cy.wait(3000)
        cy.get('span').contains('Validar consulta de medicina general').first().click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click()

    });

    it('Iniciar y validar prestación niño sano - Fuera de agenda', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        const requeridos = [];
        cy.fixture('conceptos-snomed-ninoSano.json').then(json => {
            fixtures.push(...json);
        });
        cy.fixture('conceptos-snomed-requeridosNinoSano1Mes.json').then(json => {
            requeridos.push(...json);
        });

        // Stub
        cy.route(/api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('GET', '/api/modules/obraSocial/puco/**', []).as('version');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.route('GET', 'api/core/term/snomed/expression?expression=^2501000013104', requeridos).as('requeridos')

        cy.get('plex-button[label="PACIENTE FUERA DE AGENDA"]').click({
            force: true
        });

        cy.wait('@prestaciones');
        cy.get('plex-select[name="nombrePrestacion"]').children().children('.selectize-control').click()
            .find('.option[data-value="57f5069d69fe79a5980b072f"]').click();

        cy.get('plex-button[label="SELECCIONAR PACIENTE"]').click({
            force: true
        });
        cy.get('plex-text input').first().type('55687645');
        cy.get('table tbody tr').first().click();

        cy.get('plex-button[type="success"]').contains('INICIAR PRESTACIÓN').click();
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
            expect(xhr.response.body.paciente.documento).to.be.eq('55687645');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.wait(3000); // le da tiempo para que cargue el sidebar
        cy.get('plex-text input').first().type('al mes');
        cy.wait(3000);

        cy.get('.mdi-plus').first().click();

        cy.get('rup-peso input').type('3');
        cy.get('rup-percentilo-peso input').type('85');
        cy.get('rup-talla input').type('55');
        cy.get('rup-percentilo-talla input').type('57');
        cy.get('rup-perimetrocefalico input').type('20');
        cy.get('rup-percentiloperimetrocefalico input').type('75');
        cy.get('rup-lactancia plex-bool').eq(1).click();
        cy.get('rup-desarrollo-psicomotor plex-bool').eq(1).click();
        cy.get('span').contains('Guardar consulta de niño sano').click({
            force: true
        });
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
            expect(xhr.response.body.paciente.documento).to.be.eq('55687645');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.undefined;
        });
        cy.wait(1000); // da tiempo para que el boton cambie de cartel
        cy.get('span').contains('Validar consulta de niño sano').first().click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
            expect(xhr.response.body.paciente.documento).to.be.eq('55687645');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.undefined;
        });
    })
});