/// <reference types="Cypress" />

context('Gestor de módulos', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/modulos', token);
        cy.route('GET', '**/api/core/tm/modulos**').as('modulos');
        cy.route('POST', '**/api/core/tm/modulos').as('postModulos');
        cy.route('PATCH', '**/api/core/tm/modulos**').as('patchModulos');
    });

    it('Registro de nuevo módulo', () => {
        let text = 'alguna registro universal de prestaciones de pacientes';
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('name="activo"', true); // `Inactiva`
        cy.plexText('label="nombre"', 'HUDS');
        cy.plexText('label="subtitulo"', 'historia digital de salud');
        cy.plexText('label="descripcion"', 'registro universal de prestaciones de pacientes');
        cy.plexText('label="Link"', '/rup');
        cy.plexText('label="Icono"', 'mdi-contacts');
        cy.plexInt('label="Orden"', '1');
        cy.plexButton('Guardar').click();
        cy.wait('@postModulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.wait('@modulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains('HUDS');
        cy.get('plex-item').contains('Activo');
    });

    it('Carga de módulo como INACTIVO y edición para activarlo', () => {
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('name="activo"', false);
        cy.plexText('label="nombre"', 'DASHBOARD');
        cy.plexText('label="subtitulo"', 'Estadísticas');
        cy.plexText('label="descripcion"', 'Visualice datos estadísticos en gráficos y tablas');
        cy.plexText('label="Link"', '/dashboard');
        cy.plexText('label="Icono"', 'mdi-chart-line');
        cy.plexInt('label="Orden"', '2');
        cy.plexButton('Guardar').click();
        cy.wait('@postModulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.wait('@modulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').plexBadge('Inactivo').first().click();
        cy.plexBool('label="Activo"', true);
        cy.plexButton('Guardar').click();
        cy.plexText('label="Nombre"', 'DASHBOARD');
        cy.get('plex-item').first().contains('Activo');

    })

    it('Buscar un módulo por título ', () => {
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('name="activo"', true); // `Inactiva`
        cy.plexText('label="nombre"', 'INTERNACIÓN');
        cy.plexText('label="subtitulo"', 'Mapa de camas');
        cy.plexText('label="descripcion"', 'Vea el estado del mapa de camas de los distintos servicios de la organización');
        cy.plexText('label="Link"', '/internacion/mapa-de-camas');
        cy.plexText('label="Icono"', 'mdi-bed');
        cy.plexInt('label="Orden"', '3');
        cy.plexButton('Guardar').click();
        cy.wait('@postModulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.wait('@modulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('label="Nombre"', 'INTERNACIÓN');
        cy.get('plex-item').first().contains('INTERNACIÓN');
    });
});