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

    it('Iniciar prestación - Niño sano', () => {
        cy.goto('/rup', token);

        cy.server();
        // Stub
        cy.route(/api\/modules\/rup\/frecuentesProfesional\?/).as('search');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');
        cy.route('GET', '**api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('create');
        cy.route('GET', '/api/modules/obraSocial/os/**', []).as('obraSocial');
        cy.route('PATCH', 'api/modules/rup/prestaciones/**').as('patch');
        cy.route('GET', '/api/core/term/snomed/expression**', []).as('expression');
        cy.route('POST', '/api/modules/rup/codificacion').as('codificacion');
        cy.route('GET', '/api/modules/cda/paciente/**').as('cdaPaciente');

        cy.plexButton('PACIENTE FUERA DE AGENDA').click();
        cy.plexSelectAsync('name="nombrePrestacion"', 'consulta de niño sano', '@prestaciones', 0);
        cy.plexText('name="buscador"', '3399661');
        cy.get('paciente-listado plex-item').contains(formatDocumento('3399661')).click();
        //cy.get('table tbody tr').first().click();
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.turno).to.be.undefined;
            expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
            expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
            expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
        });

        cy.wait('@cdaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.plexText('name="search"', 'consulta de niño sano, recién nacido');
            cy.wait('@search').then((xhr) => {
                cy.plexButtonIcon('plus').click();
            });

            cy.plexFloat('label="Peso"', 63);
            cy.plexFloat('label="Percentilo de Peso"', 70);
            cy.plexFloat('name="talla"', 120);
            cy.plexFloat('label="Percentilo de Talla"', 80);
            cy.plexFloat('label="Perímetro Cefálico"', 55);
            cy.plexFloat('label="Percentilo de Perímetro Cefálico"', 40);

            cy.get('plex-bool').first().click();

            cy.plexButton('Guardar consulta de niño sano').click();

            cy.wait('@patch').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.solicitud.turno).to.be.undefined;
                expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
                expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
                expect(xhr.response.body.estados[0].tipo).to.be.eq('ejecucion');
                expect(xhr.response.body.estados[1]).to.be.eq(undefined);
            });

            cy.toast('success');
            cy.plexButton('Validar consulta de niño sano').click();

            // Popup alert
            cy.get('button').contains('CONFIRMAR').click();

            cy.wait('@patch').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.solicitud.turno).to.be.undefined;
                expect(xhr.response.body.solicitud.tipoPrestacion.id).to.be.eq('57f5069d69fe79a5980b072f');
                expect(xhr.response.body.paciente.documento).to.be.eq('3399661');
                expect(xhr.response.body.estados[1].tipo).to.be.eq('validada');
                expect(xhr.response.body.estados[2]).to.be.eq(undefined);
            });
            cy.wait('@codificacion').then((xhr) => {
                expect(xhr.status).to.be.eq(200);

            });
        });

    });

});
function formatDocumento(documentoPac) {
    // armamos un documento con puntos como se muestra en la lista de pacientes
    if (documentoPac) {
        return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
    }
    return documentoPac;
}