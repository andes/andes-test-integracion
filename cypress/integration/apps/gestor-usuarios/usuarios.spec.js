/// <reference types="Cypress" />

context('Gestor de Usuarios', () => {
    let token;
    let perfil;
    let usuario;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
        cy.task('database:create:perfil').then(p => {
            perfil = p;
        });
        cy.task('database:create:Gusuario').then(user => {
            usuario = user;
        });
    });

    beforeEach(() => {
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.server();
        cy.route('GET', '**api/modules/gestor-usuarios/usuarios?search=**').as('busquedaUsuario');
        cy.route('GET', '**api/core/tm/profesionales?documento=**').as('seleccionUsuario');
        cy.route('GET', '**api/modules/gestor-usuarios/perfiles').as('getPerfiles');
        cy.route('PATCH', '**api/modules/gestor-usuarios/usuarios/**').as('patchUsuario');
    });

    it('Asignar un perfil a un usuario', () => {
        cy.plexText('placeholder="Buscar por DNI, nombre o apellido"', usuario.documento);
        cy.wait('@busquedaUsuario');

        cy.get('table tbody td').first().contains(usuario.documento).click();
        cy.wait('@seleccionUsuario');
        cy.plexButton('AGREGAR ORGANIZACION').click();

        cy.get('plex-layout-sidebar').within(() => {
            cy.plexSelectType('placeholder="Seleccione una organización"', 'dr. eduardo castro rendon{enter}');
            cy.plexButton('AGREGAR').click();
        });
        cy.wait('@getPerfiles').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Organizacion agregada exitosamente!');
        cy.get('plex-layout-main').find('.plex-box').find('.list-group-item').contains(perfil.nombre).get('plex-bool input[type="checkbox"]').check({ force: true });

        cy.get('plex-layout-sidebar').plexButton("GUARDAR").click();
        cy.wait('@patchUsuario').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Permisos grabados exitosamente!');
    });
});