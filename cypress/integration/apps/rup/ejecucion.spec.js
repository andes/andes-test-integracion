/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.createPaciente('paciente-rup', token);
            cy.createPaciente('paciente-turno', token);
            cy.createPaciente('paciente-sobreturno', token);
            cy.createAgenda('agenda-rup', 0, 0, 1, token);

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
        cy.route('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        // api/modules/rup/prestaciones/huds
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.route('POST', '**/api/modules/huds/accesos/token**').as('tokenHuds');

        cy.plexButton('PACIENTE FUERA DE AGENDA').click();


        cy.plexSelectAsync('name="nombrePrestacion"', 'consulta de medicina general', '@prestaciones', 0);

        // cy.get('plex-text input').first().type('3399661');
        cy.plexText('name="buscador"', '3399661');

        cy.get('table tbody tr').first().click();

        cy.plexButton('INICIAR PRESTACIÓN').click();
        cy.wait('@tokenHuds').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });

        cy.plexButtonIcon('chevron-up').first().click();
        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then((xhr) => {
            cy.plexButtonIcon('plus').click();
        });
        cy.get('plex-tabs').contains('Historia de Salud').click();

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.eq(undefined);
        });

        cy.toast('success');
        cy.plexButton('Validar consulta de medicina general').click();

        // Popup alert
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

    it('Iniciar prestación - Turno', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.route('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.get('plex-radio[name="agendas"] input').eq(1).click({
            force: true
        });

        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');
        cy.get('table tr').contains('consulta de medicina general').first().click();
        cy.get('div[class="plex-box-content"] table').eq(1).plexButton('INICIAR PRESTACIÓN').click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.undefined;
        });

        cy.wait(3000);
        cy.get('button').contains('BUSCADOR BÁSICO').click();
        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then((xhr) => {

            // No es plex-button
            cy.plexButtonIcon('plus').click();

            // Implementar escribir en plex-text con rich text (quill editor)
            // cy.plexTextArea('name="evolucion"', 'test registro');
        });

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.undefined;
        });

        cy.toast('success');

        cy.plexButton('Validar consulta de medicina general').click();

        // Popup alert
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.eq(undefined);
        });
    });

    it('Iniciar prestación - Sobreturno', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.route('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '**/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.get('plex-radio[name="agendas"] input').eq(1).click({
            force: true
        });
        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');
        cy.get('table tr').contains('consulta de medicina general').first().click();
        cy.get('div[class="plex-box-content"] table').eq(2).plexButton('INICIAR PRESTACIÓN').click({
            force: true
        });

        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('39621068');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.undefined;
        });
        cy.wait(3000);

        cy.get('button').contains('BUSCADOR BÁSICO').click();

        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then((xhr) => {
            cy.plexButtonIcon('plus').click();
        });


        cy.plexButton('Guardar consulta de medicina general').click();
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('39621068');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.undefined;
        });
        cy.wait(1000); // da tiempo para que el boton cambie de cartel
        cy.plexButton('Validar consulta de medicina general').click();
        // cy.get('span').contains('Validar consulta de medicina general').first().click({
        //     force: true
        // });
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('39621068');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.eq(undefined);
        });
    });

    it('Iniciar prestación fuera de agenda con nota privada', () => {
        cy.goto('/rup', token);

        cy.server();
        const fixtures = [];
        const fixtures2 = [];
        cy.fixture('nota-privada.json').then(json => {
            fixtures.push(json);
        });
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures2.push(json);
        });

        // Stub
        cy.route('GET', /api\/core\/term\/snomed\?search=nota/, fixtures).as('search');
        cy.route('GET', /api\/core\/term\/snomed\?search=fiebre/, fixtures2).as('search2');

        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');

        cy.plexButton('PACIENTE FUERA DE AGENDA').click();


        cy.plexSelectAsync('name="nombrePrestacion"', 'consulta de medicina general', '@prestaciones', 0);

        cy.plexText('name="buscador"', '31549268');

        cy.get('table tbody tr').first().click();

        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.wait(3000);
        cy.get('button').contains('BUSCADOR BÁSICO ').click();
        cy.plexText('name="searchTerm"', 'nota');
        cy.wait('@search').then((xhr) => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexText('name="searchTerm"', '{selectall}{backspace}fiebre');
        cy.wait('@search2').then((xhr) => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(xhr.response.body.estados[1]).to.be.eq(undefined);
        });
        cy.toast('success');
        cy.plexButton('Validar consulta de medicina general').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patch').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.paciente.documento).to.be.eq('31549268');
            expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            expect(xhr.response.body.estados[2]).to.be.eq(undefined);
        });
        cy.plexButton('Punto de Inicio').click();
        cy.wait(2000);
        cy.get('table tbody tr td').contains(' Fuera de agenda ').click({ force: true });
        cy.get('tr td').contains("TURNO, PACIENTE ").parent().parent().plexButton(' VER HUDS ').click();
        cy.get('plex-radio').contains(' Procesos de Auditoría ').click({ force: true });
        cy.plexButton('ACEPTAR').click();
        cy.get('.rup-card').first().click();
        cy.get('.rup-card.elementoderegistro .rup-header .title').contains(' Nota privada (elemento de registro) ');

    });
});