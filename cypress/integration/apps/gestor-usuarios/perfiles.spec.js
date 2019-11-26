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

    it('Inactivar un perfil activo y verificar que se vea desactivado', () => {
        cy.get('table tbody tr').find('span').should('have.class', 'badge badge-success badge-md').first().click();
        cy.get('plex-bool[name="activo"]').click();
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
    });

});