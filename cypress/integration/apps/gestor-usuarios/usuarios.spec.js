context('usuarios', () => {
    let token;
    let perfil1;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
        cy.task('database:create:perfil').then(p => {
            perfil1 = p;
        });
    });

    beforeEach(() => {
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.server();
        cy.route('GET', '**api/modules/gestor-usuarios/usuarios?search=**').as('busquedaUsuario');
        cy.route('GET', '**api/core/tm/profesionales?documento=**').as('seleccionUsuario');
        cy.route('PATCH', '**api/modules/gestor-usuarios/usuarios/**').as('patchUsuario');
    });

    it('asignar un perfil a un usuario', () => {
        cy.task('database:create:usuario').then(user => {
            cy.plexText('placeholder="Buscar por DNI, nombre o apellido"', user.usuario);
            cy.wait('@busquedaUsuario');

            cy.get('table tbody td').first().contains(user.usuario).click();
            cy.wait('@seleccionUsuario');
            cy.plexButton('AGREGAR ORGANIZACION').click();
            cy.get('plex-layout-sidebar').within(() => {
                cy.plexSelectType('placeholder="Seleccione una organización"', 'dr. eduardo castro rendon{enter}');
                cy.plexButton('AGREGAR').click();

            });

            cy.get('plex-layout-main').within(() => {
                cy.get('div[class="list-group mt-2"]').contains(perfil1.nombre).within(() => {
                    cy.get('plex-bool input[type="checkbox"]').check({
                        force: true
                    });
                })
            })
            cy.get('plex-layout-sidebar plex-button').first().click();
            cy.wait('@patchUsuario').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body.permisos).to.deep.equal(perfil1.permisos);
            });
        });

    });
})