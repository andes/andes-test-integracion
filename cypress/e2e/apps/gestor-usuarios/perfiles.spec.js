/// <reference types="Cypress" />

function crearPerfilBasico() {
    cy.plexButton('NUEVO').click();
    cy.plexText('name="nombre"', 'test perfil');
    cy.get('div[id="accordion"]').eq(0).find('plex-bool').eq(0).click();
    cy.plexButton('Guardar').click();
    cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
};

context('Perfiles de usuario', () => {
    let token;
    let perfil1;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd', '57e9670e52df311059bc8964').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.seed();
        cy.task('database:create:perfil', { permisos: ['rup:tipoPrestacion:598ca8375adc68e2a0c121b8'] }).then(p => {
            perfil1 = p;
        });
        cy.viewport(1600, 900);
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.intercept('GET', '**/api/modules/gestor-usuarios/perfiles**').as('getPerfiles');
        cy.intercept('PATCH', '**/api/modules/gestor-usuarios/perfiles/**').as('savePerfil');
        cy.intercept('POST', '**/api/modules/gestor-usuarios/perfiles').as('postPerfil');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables?term=**').as('conceptoTurneables');
        cy.plexButton("PERFILES").click();
        cy.wait('@getPerfiles');
    });

    it('Crear nuevo perfil', () => {
        crearPerfilBasico();
        cy.wait('@postPerfil').then(({response}) => {
            expect(response.statusCode).to.be.eq(200);
        });
    });

    it('Crear nuevo perfil con permisos de diferentes niveles', () => {
        cy.plexButton('NUEVO').click();
        cy.plexText('name="nombre"', 'test perfil');
        cy.buscarPermisos('Citas').as('citasAccordion');
        cy.get('@citasAccordion').plexBool('type="slide"', true);
        cy.buscarPermisos('MPI').as('mpiAccordion');
        cy.get('@mpiAccordion').plexBool('type="slide"', true);
        cy.buscarPermisos('RUP').as('rupAccordion');
        cy.get('@rupAccordion').click()
        cy.get('@rupAccordion').get('#collapseOne > div > div').first().plexSelectAsync('name="plexSelect"', 'Consulta de medicina general{downArrow}{enter}', '@conceptoTurneables', 0);
        cy.get('plex-layout-sidebar plex-title').contains(' Crear agrupación ').click()
        cy.buscarPermisos('Internación').as('internacionAccordion');
        cy.get('@internacionAccordion').click();
        cy.get('@internacionAccordion').get('#collapseOne > div > div:nth-child(2)').contains('Acciones sobre una cama').plexBool('type="slide"', true);
        [5,6,7,8].forEach((childNumber, i) => {
            cy.get('@internacionAccordion').get(`#collapseOne > div > div:nth-child(${childNumber})`).plexBool('type="slide"', true);
        });
        cy.plexButton('Guardar').click();
        cy.contains('El perfil se ha guardado satisfactoriamente!');
        cy.wait('@postPerfil').then(({response}) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.permisos).to.have.length.greaterThan(4);   // ya que se dieron 4 permisos y al menos uno contenía subniveles
        });
    });

    it('Agregar permisos a un perfil existente', () => {
        cy.get('table tbody tr').first().click();
        cy.buscarPermisos('Internación').as('internacionAccordion2');
        cy.get('@internacionAccordion2').click();
        [7,8,9].forEach((childNumber, i) => {
            cy.get('@internacionAccordion2').get(`#collapseOne > div > div:nth-child(${childNumber})`).plexBool('type="slide"', true);
        });
        cy.plexButton('Guardar').click();
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
        cy.wait('@savePerfil').then(({response}) => {
            const permisosInternacion = response.body.permisos.filter(p => p.slice(0, 11) === 'internacion');
            expect(response.statusCode).to.be.eq(200);
            expect(permisosInternacion).to.have.length(3)
        });
    });

    it('Inactivar un perfil activo y verificar la modificación', () => {
        cy.get('table tbody tr').find('.badge-success').first().click();
        cy.get('gestor-usarios-perfiles-detail').plexBool('name="activo"', false);
        cy.plexButton('Guardar').click();
        cy.wait('@savePerfil').then(({response}) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.activo).to.be.eq(false);
        });
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
        cy.wait('@getPerfiles');
    });

    it('Editar prestaciones de RUP en un perfil existente', () => {
        cy.get('table tbody tr').first().click();

        cy.buscarPermisos('RUP').as('rupAccordion');

        cy.get('@rupAccordion').click();
        
        cy.get('@rupAccordion').get('#collapseOne > div > div:nth-child(1) > arbol-permisos-item > div > div plex-wrapper > section > plex-select > div > div.selectize-control.multi.plugin-remove_button_plex > div.selectize-input.items.not-full.has-options.has-items').type('colonoscopia').wait(500).type('{downArrow}{enter}')
        
        cy.plexButton('Guardar').click();
        cy.wait('@savePerfil').then(({response}) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.permisos).to.include('rup:tipoPrestacion:5a26e113291f463c1b982d98');
        });
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
    });

    it('Editar prestaciones de RUP en un perfil existente y cancelar, verificar que no se realicen cambios', () => {
        cy.get('table tbody tr').first().click();

        cy.buscarPermisos('RUP').as('rupAccordion');
        cy.get('@rupAccordion').click();

        cy.get('@rupAccordion').get('#collapseOne > div > div:nth-child(1) > arbol-permisos-item > div > div plex-wrapper > section > plex-select > div > div.selectize-control.multi.plugin-remove_button_plex > div.selectize-input.items.not-full.has-options.has-items').type('consulta de nutricion').wait(500).type('{downArrow}{enter}');

        cy.plexButton('Cancelar').click();
        cy.shouldBeCalled('savePerfil', 0);
    });
});
