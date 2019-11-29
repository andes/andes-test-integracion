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

    });

    it('Agregar permisos de un perfil existente', () => {
        cy.get('table tbody tr').first().click();
        cy.get('div[id="accordion"]').eq(1).find('plex-bool').eq(0).click();
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
    });

    it('Inactivar un perfil activo y verificar la modificación', () => {
        cy.get('table tbody tr').find('span').should('have.class', 'badge badge-success badge-md').first().click();
        cy.get('plex-bool[name="activo"]').click();
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
    });

    it('Editar prestaciones de RUP en un perfil existente', () => {
        cy.get('table tbody tr').first().click();
        cy.get('div[id="accordion"]').eq(2).click();
        cy.plexSelect('name="plexSelect"').click();
        cy.plexSelectType('placeholder="Seleccione los elementos con permisos"', 'colonoscopia', null, true, true);
        cy.wait('@prestaciones');
        cy.get('plex-select[placeholder="Seleccione los elementos con permisos"] input').first().type('{enter}');
        cy.plexButton('Guardar').click();
        cy.wait('@perfil');
        cy.contains('El perfil se ha guardado satisfactoriamente!');
    });

    it('Editar prestaciones de RUP en un perfil existente y cancelar, verificar que no se realicen cambios', () => {
        cy.get('table tbody tr').first().click();
        cy.get('div[id="accordion"]').eq(2).click();
        cy.plexSelect('name="plexSelect"').click();
        cy.plexSelectType('placeholder="Seleccione los elementos con permisos"', 'consulta de nutrición', null, true, true);
        cy.wait('@prestaciones');
        cy.get('plex-select[placeholder="Seleccione los elementos con permisos"] input').first().type('{enter}');
        cy.plexButton('Cancelar').click();
        cy.get('table tbody tr').first().click();
        cy.get('div[id="accordion"]').eq(2).click();
        cy.wait('@perfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].permisos).to.include('rup:tipoPrestacion:5a26e113291f463c1b982d98')
        });;
        cy.plexSelect('name="plexSelect"').contains('consulta de nutrición').should('not.exist');
    });



});