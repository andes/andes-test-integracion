/// <reference types="Cypress" />

context('RUP - Punto de inicio', () => {
    const request = require('request');
    let token;
    let pacientes;

    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then((list) => {
            pacientes = list;
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    it('Ver accesos desde url', () => {
        cy.goto('/rup/vista/' + pacientes[0]._id, token);
        cy.url().should('contains', '/inicio')  // vuelve al punto de inicio por no poseer token de acceso a huds
    });

    it('Ver accesos a la huds por buscador', () => {
        let paciente = pacientes[0];
        let usuario;
        cy.server();
        const fixtures = [];
        cy.fixture('conceptos-snomed.json').then(json => {
            fixtures.push(json);
        });
        cy.route('GET', '/api/modules/huds/accesos?paciente**').as('accesos');

        cy.goto('/rup/huds', token).then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            usuario = xhr.response.body.usuario
        })
        cy.plexText('name="buscador"', paciente.nombre);
        cy.get('paciente-listado').find('td').contains(paciente.nombre).click();
        cy.contains('Procesos de Auditoría').click()
        cy.contains('ACEPTAR').click();
        //vista de accesos
        cy.wait('@accesos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0].usuario.id).to.be.eq(usuario.id);
            cy.wait(4000);
            cy.get('plex-tab').contains('Accesos a la HUDS').click()
        });
    });
});