context('perfiles-usuario', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.server();
        cy.route('GET', '**/api/modules/gestor-usuarios/perfiles').as('perfil');
        cy.route('PATCH', '**/api/modules/gestor-usuarios/perfiles/**').as('savePerfil');
        cy.route('POST', '**/api/modules/gestor-usuarios/perfiles').as('postPerfil');
        cy.route('**api/core/tm/tiposPrestaciones?term=**').as('prestaciones');
        cy.plexButton("VER PERFILES").click();
        cy.wait('@perfil');
    });

    it('Crear nuevo perfil', () => {
        cy.plexButton('NUEVO').click();
        cy.plexText('name="nombre"', 'test perfil');
        cy.get('div[id="accordion"]').eq(0).find('plex-bool').eq(0).click();
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
        cy.wait('@postPerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

    });

    it('Agregar permisos de un perfil existente', () => {
        cy.get('table tbody tr').first().click();
        cy.get('plex-layout-sidebar arbol-permisos>div').eq(0).plexAccordion().eq(0).as('rupAccordion');

        cy.get('@rupAccordion').plexBool('type="slide"', true)
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('Inactivar un perfil activo y verificar la modificación', () => {
        cy.get('table tbody tr').find('span').should('have.class', 'badge badge-success badge-md').first().click();
        cy.get('gestor-usarios-perfiles-detail >div').plexBool('name="activo"', false);
        cy.plexButton('Guardar').click();
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@perfil');
        cy.get('table tbody tr').find('span.badge.badge-success').should('not.exist');
    });

    it('Editar prestaciones de RUP en un perfil existente', () => {
        cy.get('table tbody tr').first().click();

        // El gestor de usuario tiene un escrutura media maleta XD
        // Usa muchos plex-accordion en vez de uno solo.
        cy.get('plex-layout-sidebar arbol-permisos>div').eq(2).plexAccordion().eq(0).as('rupAccordion');
        cy.get('@rupAccordion').plexPanel(0).click();

        cy.get('@rupAccordion').plexSelectAsync('name="plexSelect"', 'colonoscopia', '@prestaciones', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@perfil');
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
    });

    it('Editar prestaciones de RUP en un perfil existente y cancelar, verificar que no se realicen cambios', () => {
        cy.get('table tbody tr').first().click();

        cy.get('plex-layout-sidebar arbol-permisos>div').eq(2).plexAccordion().eq(0).as('rupAccordion');
        cy.get('@rupAccordion').plexPanel(0).click();

        cy.get('@rupAccordion').plexSelect('name="plexSelect"').clearSelect();
        cy.get('@rupAccordion').plexSelectAsync('name="plexSelect"', 'consulta de nutrición', '@prestaciones', 0);

        cy.plexButton('Cancelar').click();
        cy.get('table tbody tr').first().click();

        cy.wait('@perfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].permisos).to.include('rup:tipoPrestacion:5a26e113291f463c1b982d98')
        });
        cy.plexSelect('name="plexSelect"').contains('consulta de nutrición').should('not.exist');
    });

});