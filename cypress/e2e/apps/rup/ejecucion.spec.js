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
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.intercept('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.intercept('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('pacientes');
        cy.intercept('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');

        cy.plexButton('PACIENTE FUERA DE AGENDA').click();

        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');

        cy.plexText('name="buscador"', '3399661');
        cy.wait('@pacientes');
        cy.get('paciente-listado plex-item').contains(formatDocumento('3399661')).click();

        cy.plexButton('INICIAR PRESTACIÓN').click();
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('3399661');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.wait('@paciente');
        cy.plexButtonIcon('chevron-up').first().click();
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then(() => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('3399661');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.eq(undefined);
        });

        cy.toast('success');
        cy.wait('@paciente');
        cy.wait(1000);
        cy.plexButton('Validar consulta de medicina general').click();

        // Popup alert
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('3399661');
            expect(response.body.estados[1].tipo).to.be.eq('validada');
            expect(response.body.estados[2]).to.be.eq(undefined);
        });

    });

    it('Iniciar prestación - Turno', () => {
        cy.goto('/rup', token);

        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.intercept('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.intercept('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.intercept('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');

        cy.get('plex-radio[name="agendas"] input').eq(1).click({
            force: true
        });

        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');
        cy.get('table tr').contains('consulta de medicina general').first().click();
        cy.get('div[class="plex-box-content"] table').eq(1).plexButton('INICIAR PRESTACIÓN').click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click();
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.undefined;
        });
        cy.wait('@paciente');
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.get('rup-buscador').find('button').contains('BUSCADOR BÁSICO').click();
        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then(() => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.undefined;
        });

        cy.toast('success');
        cy.wait('@paciente');
        cy.plexButton('Validar consulta de medicina general').click();

        // Popup alert
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d79417a5f6cfc13bb7d7842');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[1].tipo).to.be.eq('validada');
            expect(response.body.estados[2]).to.be.eq(undefined);
        });
    });

    it('Iniciar prestación - Sobreturno', () => {
        cy.goto('/rup', token);

        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        // Stub
        cy.intercept('GET', /api\/core\/term\/snomed\?/, fixtures).as('search');
        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('GET', '**/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.intercept('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.intercept('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');

        cy.get('plex-radio[name="agendas"] input').eq(1).click({
            force: true
        });
        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');
        cy.get('table tr').contains('consulta de medicina general').first().click();
        cy.get('div[class="plex-box-content"] table').eq(2).plexButton('INICIAR PRESTACIÓN').click({
            force: true
        });
        cy.get('button').contains('CONFIRMAR').click();
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('39621068');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.undefined;
        });
        cy.wait('@paciente');

        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.get('rup-buscador').find('button').contains('BUSCADOR BÁSICO').click();
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.plexText('name="searchTerm"', 'fiebre');
        cy.wait('@search').then(({ response }) => {
            cy.plexButtonIcon('plus').click();
        });


        cy.plexButton('Guardar consulta de medicina general').click();
        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('39621068');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.undefined;
        });

        cy.toast('success');
        cy.wait('@paciente');
        cy.plexButton('Validar consulta de medicina general').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.eq('5d790d2659530a13545f85b0');
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('39621068');
            expect(response.body.estados[1].tipo).to.be.eq('validada');
            expect(response.body.estados[2]).to.be.eq(undefined);
        });
    });

    it('Iniciar prestación fuera de agenda con nota privada', () => {
        cy.goto('/rup', token);

        const fixtures = [];
        const fixtures2 = [];
        cy.fixture('nota-privada.json').then(json => {
            fixtures.push(json);
        });
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures2.push(json);
        });

        // Stub
        cy.intercept('GET', /api\/core\/term\/snomed\?search=nota/, fixtures).as('search');
        cy.intercept('GET', /api\/core\/term\/snomed\?search=fiebre/, fixtures2).as('search2');

        cy.intercept('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.intercept('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.intercept('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');


        cy.plexButton('PACIENTE FUERA DE AGENDA').click();


        cy.plexSelectType('name="nombrePrestacion"', 'consulta de medicina general');

        cy.plexText('name="buscador"', '31549268');
        cy.get('paciente-listado plex-item').contains(formatDocumento('31549268')).click();

        cy.plexButton('INICIAR PRESTACIÓN').click();
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force2: true });
        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
        });
        cy.wait('@paciente');
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.get('rup-buscador').find('button').contains('BUSCADOR BÁSICO').click();
        cy.plexText('name="searchTerm"', 'nota');
        cy.wait('@search').then(({ response }) => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexText('name="searchTerm"', '{selectall}{backspace}fiebre');
        cy.wait('@search2').then(({ response }) => {
            cy.plexButtonIcon('plus').click();
        });

        cy.plexButton('Guardar consulta de medicina general').click();

        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[0].tipo).to.be.eq('ejecucion');
            expect(response.body.estados[1]).to.be.eq(undefined);
        });
        cy.toast('success');
        cy.wait('@paciente');
        cy.wait(1000);
        cy.plexButton('Validar consulta de medicina general').click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patch').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.turno).to.be.undefined;
            expect(response.body.solicitud.tipoPrestacion.id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.paciente.documento).to.be.eq('31549268');
            expect(response.body.estados[1].tipo).to.be.eq('validada');
            expect(response.body.estados[2]).to.be.eq(undefined);
        });
        cy.plexButton('Punto de Inicio').click();
        cy.wait(2000);
        cy.get('table tbody tr td').contains(' Fuera de agenda ').click({ force: true });
        cy.get('tr td').contains("TURNO, PACIENTE ").parent().parent().plexButton(' VER HUDS ').click();
        cy.get('plex-radio').contains(' Procesos de Auditoría ').click({ force: true });
        cy.plexButton('ACEPTAR').click();
        cy.get('rup-hudsbusqueda .menu-buscador button').contains('PRESTACIONES').click();
        cy.get('rup-hudsbusqueda ul li .rup-header').first().click();
        cy.get('.rup-card.elementoderegistro .rup-header .title').contains(' Nota privada (elemento de registro) ');

    });
});
function formatDocumento(documentoPac) {
    // armamos un documento con puntos como se muestra en la lista de pacientes
    if (documentoPac) {
        return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
    }
    return documentoPac;
}