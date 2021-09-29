/// <reference types="Cypress" />

context('prestaciones', () => {
    let token, pacientes;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then((list) => {
            pacientes = list;
        });
        cy.login('30643636', 'asd', '57fcf038326e73143fb48dac').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.goto('/rup', token);
    });

    ['validado', 'temporal', 'sin-documento'].forEach((type, i) => {
        it('Registrar Prestación de Colonoscopia, Fuera de Agenda, paciente ' + type, () => {
            const paciente = pacientes[i];
            cy.server();
            cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
            cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
            cy.route('GET', '**/api/modules/rup/prestaciones*').as('guardar');
            cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
            cy.route('GET', '/api/modules/cda/paciente/**', []).as('cda');
            cy.route('GET', '/api/core/term/snomed/**', []).as('search');
            cy.plexButton('PACIENTE FUERA DE AGENDA').click();
            cy.plexSelectType('name="nombrePrestacion"', 'colonoscopia');



            cy.plexText('name="buscador"', paciente.nombre);
            cy.get('paciente-listado plex-item').contains(paciente.nombre).click();

            cy.plexButton('INICIAR PRESTACIÓN').click();

            cy.wait('@create').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                if (paciente.documento) {
                    expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
                }
                expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
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
            // cy.get('plex-radio[name="binario"] input').eq(15).click({
            //     force: true
            // });

            cy.get('plex-radio[name="binario"] input').eq(16).click({
                force: true
            });

            cy.get('plex-radio[name="binario"] input').eq(18).click({
                force: true
            });

            cy.get('plex-radio[name="binario"] input').eq(22).click({
                force: true
            });

            cy.get('plex-radio[name="binario"] input').eq(26).click({
                force: true
            });

            cy.plexButton('Guardar colonoscopia').click();

            cy.wait('@patch').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                if (paciente.documento) {
                    expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
                }
                expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
                expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
            });

            cy.toast('success');
            cy.wait(1);
            cy.plexButton('Validar colonoscopia').click();

            // Popup alert
            cy.get('button').contains('CONFIRMAR').click();

            cy.wait('@patch').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                if (paciente.documento) {
                    expect(xhr.response.body.paciente.documento).to.be.eq(paciente.documento);
                }
                expect(xhr.response.body.paciente.nombre).to.be.eq(paciente.nombre);
                expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
            });

        });

    });
})