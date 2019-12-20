context('perfiles-usuario', () => {
    let token;
    let perfil1;
    before(() => {
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.seed()
        cy.task('database:create:perfil', { permisos: ['rup:tipoPrestacion:598ca8375adc68e2a0c121b7'] }).then(p => {
            perfil1 = p;
        });
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
        crearPerfilBasico();
        cy.wait('@postPerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('Crear nuevo perfil con permisos de diferentes niveles', () => {
        cy.plexButton('NUEVO').click();
        cy.plexText('name="nombre"', 'test perfil');
        cy.get('plex-layout-sidebar arbol-permisos>div').eq(0).plexAccordion().eq(0).as('citasAccordion');
        cy.get('@citasAccordion').plexBool('type="slide"', true)
        cy.get('plex-layout-sidebar arbol-permisos>div').eq(1).plexAccordion().eq(0).as('mpiAccordion');
        cy.get('@mpiAccordion').plexBool('type="slide"', true)
        cy.get('plex-layout-sidebar arbol-permisos>div').eq(2).plexAccordion().click().as('rupAccordion');
        cy.get('@rupAccordion').plexSelectAsync('placeholder="Seleccione los elementos con permisos"', 'Consulta de medicina general', '@prestaciones', 0);



        cy.get('plex-layout-sidebar arbol-permisos>div').eq(8).plexAccordion().click().as('internacionAccordion');
        cy.get('@internacionAccordion').within((item) => {
            cy.get('plex-bool input[type="checkbox"]').eq(1).check({
                force: true
            });
        });

        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
        cy.wait('@postPerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.permisos).to.have.length(4);
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
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');

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
            expect(xhr.response.body[0].permisos).to.include('rup:tipoPrestacion:598ca8375adc68e2a0c121b7')
        });
        cy.plexSelect('name="plexSelect"').contains('consulta de nutrición').should('not.exist');
    });

    it('Crear nuevo perfil y verificar que no se modifica uno pre-existente', () => {
        crearPerfilBasico();
        cy.wait(['@perfil', '@postPerfil']).then((xhr) => {
            expect(xhr[1].status).to.be.eq(200);
            cy.wait('@perfil').then((xhr2) => {
                expect(xhr2.response.body).to.have.length(2);
                expect(xhr2.response.body[0].permisos).to.have.length(1);
            });
        });
    });

    function crearPerfilBasico() {
        cy.plexButton('NUEVO').click();
        cy.plexText('name="nombre"', 'test perfil');
        cy.get('div[id="accordion"]').eq(0).find('plex-bool').eq(0).click();
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
    };
});