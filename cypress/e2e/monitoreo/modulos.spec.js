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
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('formControlName="activo"', true); // `Inactiva`
        cy.plexText('formControlName="nombre"', 'RUP');
        cy.plexText('formControlName="subtitulo"', 'Registro Universal de Prestaciones');
        cy.plexText('formControlName="descripcion"', 'Ambulatorio');
        cy.plexText('formControlName="linkAcceso"', '/rup');
        cy.plexInt('formControlName="orden"', '1');
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

    it('Registro de módulo con 1 submódulo', () => {
        cy.plexButton('Nuevo módulo').click().blur();
        cy.plexBool('formControlName="activo"', true); // `Inactiva`

        cy.get('.text-warning').should('contain', 'Hay campos requeridos sin completar');

        cy.plexText('formControlName="nombre"', 'Módulo Principal');
        cy.plexText('formControlName="subtitulo"', 'Módulo con submódulo');
        cy.plexText('formControlName="descripcion"', 'Principal');
        cy.plexText('formControlName="linkAcceso"', '/principal');
        cy.plexText('formControlName="icono"', 'cat');
        cy.plexInt('formControlName="orden"', 1);

        // Submódulos
        cy.plexButton('Agregar submódulo').click();

        cy.get('.submodulos').plexBool('formControlName="activo"', true); // `Inactiva`
        cy.get('.submodulos').plexText('formControlName="nombre"', 'Módulo Secundario');
        cy.get('.submodulos').plexText('formControlName="linkAcceso"', '/principal/secundario');
        cy.get('.submodulos input[type="color"]')
            .focus()
            .invoke('val', '#ff9966')
            .trigger('change')
        cy.get('.submodulos').plexText('formControlName="icono"', 'panda');
        cy.get('.submodulos').plexInt('formControlName="orden"', '1');

        cy.get('.text-warning').should('have.length', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@postModulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.wait('@modulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains('Módulo Principal');
        cy.get('plex-item').contains('Activo');
    });

    it('Carga de módulo como INACTIVO y edición para activarlo', () => {
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('formControlName="activo"', false);
        cy.plexText('formControlName="nombre"', 'DASHBOARD');
        cy.plexText('formControlName="subtitulo"', 'Estadísticas');
        cy.plexText('formControlName="descripcion"', 'Visualice datos estadísticos en gráficos y tablas');
        cy.plexText('formControlName="linkAcceso"', '/dashboard');
        cy.plexText('formControlName="icono"', 'chart-line');
        cy.plexInt('formControlName="orden"', '2');
        cy.plexButton('Guardar').click();
        cy.wait('@postModulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.wait('@modulos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('plex-item').plexBadge('Inactivo').first().click();

        cy.plexBool('formControlName="activo"', true);
        cy.plexButton('Guardar').click();
        cy.get('plex-item').first().contains('Activo');

    })

    it('Buscar un módulo por título ', () => {
        cy.plexButton('Nuevo módulo').click();
        cy.plexBool('formControlName="activo"', true); // `Inactiva`
        cy.plexText('formControlName="nombre"', 'INTERNACIÓN');
        cy.plexText('formControlName="subtitulo"', 'Mapa de camas');
        cy.plexText('formControlName="descripcion"', 'Vea el estado del mapa de camas de los distintos servicios de la organización');
        cy.plexText('formControlName="linkAcceso"', '/internacion/mapa-de-camas');
        cy.plexText('formControlName="icono"', 'cama-paciente');
        cy.plexInt('formControlName="orden"', '3');
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