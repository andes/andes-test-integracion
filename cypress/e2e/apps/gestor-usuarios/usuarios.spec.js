/// <reference types="Cypress" />

context('Gestor de Usuarios', () => {
    let token;
    let perfil;
    let usuario;
    let usuario2;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
        cy.task('database:create:perfil').then(p => {
            perfil = p;
        });
        cy.task('database:create:usuario').then(user => {
            usuario = user;
        });
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964' }).then(user => {
            usuario2 = user;
        });
    });

    beforeEach(() => {
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.intercept('GET', '**api/modules/gestor-usuarios/usuarios?search=**').as('busquedaUsuario');
        cy.intercept('GET', '**api/core/tm/profesionales?documento=**').as('seleccionUsuario');
        cy.intercept('GET', '**api/modules/gestor-usuarios/perfiles**').as('getPerfiles');
        cy.intercept('PATCH', '**api/modules/gestor-usuarios/usuarios/**').as('patchUsuario');
    });

    it('Asignar un perfil a un usuario', () => {
        cy.contains('Gestor de Usuarios');
        cy.plexText('placeholder="Buscar por DNI, nombre o apellido"', usuario.documento);
        cy.wait('@busquedaUsuario');

        cy.get('table tbody td').first().contains(usuario.documento).click();
        cy.wait('@seleccionUsuario');
        cy.plexButton('AGREGAR ORGANIZACION').click();

        cy.get('plex-layout-sidebar').within(() => {
            cy.plexSelectType('placeholder="Seleccione una organización"', 'dr. eduardo castro rendon{enter}');
            cy.plexButton('AGREGAR').click({ force: true });
        });
        // cy.wait('@getPerfiles').then(({ response }) => {
        //     expect(response.statusCode).to.be.eq(200);
        // });
        cy.toast('success', 'Organizacion agregada exitosamente!');
        cy.get('plex-layout-main').find('.plex-box').find('.list-group-item').contains(perfil.nombre).find('plex-bool').eq(0).click();

        cy.get('plex-layout-sidebar').plexButton("GUARDAR").click();
        cy.wait('@patchUsuario').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.toast('success', 'Permisos grabados exitosamente!');
    });

    it('Seleccionar todas las prestaciones del modulo solicitud', () => {
        cy.plexText('placeholder="Buscar por DNI, nombre o apellido"', usuario2.documento);
        cy.wait('@busquedaUsuario').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body[0].documento).to.be.eq(usuario2.documento);
            expect(response.body[0].nombre).to.be.eq(usuario2.nombre);
            expect(response.body[0].apellido).to.be.eq(usuario2.apellido);
        });

        cy.get('table tbody td').first().contains(usuario2.documento).click();
        cy.wait('@seleccionUsuario').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.plexButtonIcon('pencil').click();
        cy.get('plex-accordion plex-panel').contains(' Módulo Solicitudes ').click();
        cy.plexBool('label="Seleccionar todos"', true);
        cy.plexButton(" GUARDAR ").click();
        cy.wait('@patchUsuario').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.permisos[3]).to.be.eq('solicitudes:tipoPrestacion:*');

        });
    });
});