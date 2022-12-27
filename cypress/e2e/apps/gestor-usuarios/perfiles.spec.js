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
        cy.task('database:create:perfil', { permisos: ['rup:tipoPrestacion:391000013108'] }).then(p => {
            perfil1 = p;
        });
        cy.goto('/gestor-usuarios/usuarios', token);
        cy.server();
        cy.route('GET', '**/api/modules/gestor-usuarios/perfiles').as('perfil');
        cy.route('PATCH', '**/api/modules/gestor-usuarios/perfiles/**').as('savePerfil');
        cy.route('POST', '**/api/modules/gestor-usuarios/perfiles').as('postPerfil');
        cy.route('GET', '**/api/core/tm/conceptos-turneables?term=**').as('conceptoTurneables');
        cy.plexButton("PERFILES").click();
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
        cy.buscarPermisos(0, 0).as('citasAccordion');
        cy.get('@citasAccordion').plexBool('type="slide"', true);
        cy.buscarPermisos(1, 0).as('mpiAccordion');
        cy.get('@mpiAccordion').plexBool('type="slide"', true);
        cy.buscarPermisos(2, 0).as('rupAccordion');
        cy.get('@rupAccordion').plexPanel(0).click();
        cy.get('@rupAccordion').find('arbol-permisos-item').eq(0).plexSelectAsync('name="plexSelect"', 'Consulta de medicina general', '@conceptoTurneables', 0);
        cy.buscarPermisos(8, 0).as('internacionAccordion');
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
        cy.buscarPermisos(0, 0).as('rupAccordion');

        cy.get('@rupAccordion').plexBool('type="slide"', true)
        cy.plexButton('Guardar').click();
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.permisos).to.include('turnos:*');
        });
    });

    it('Inactivar un perfil activo y verificar la modificación', () => {
        cy.get('table tbody tr').find('.badge-success').first().click();
        cy.get('gestor-usarios-perfiles-detail >div').plexBool('name="activo"', false);
        cy.plexButton('Guardar').click();
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activo).to.be.eq(false);
        });
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');

        cy.wait('@perfil');
        cy.get('table tbody tr').find('.badge').contains('activo').should('not.exist');
    });

    it('Editar prestaciones de RUP en un perfil existente', () => {
        cy.get('table tbody tr').first().click();

        cy.buscarPermisos(2, 0).as('rupAccordion');

        cy.get('@rupAccordion').plexPanel(0).click();

        cy.get('@rupAccordion').find('arbol-permisos-item').eq(0).plexSelectAsync('name="plexSelect"', 'colonoscopia', '@conceptoTurneables', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@savePerfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.permisos).to.include('rup:tipoPrestacion:73761001');
        });
        cy.toast('success', 'El perfil se ha guardado satisfactoriamente!');
    });

    it('Editar prestaciones de RUP en un perfil existente y cancelar, verificar que no se realicen cambios', () => {
        cy.get('table tbody tr').first().click();

        cy.buscarPermisos(2, 0).as('rupAccordion');
        cy.get('@rupAccordion').plexPanel(0).click();

        cy.get('@rupAccordion').find('arbol-permisos-item').eq(0).plexSelectType('name="plexSelect"', 'consulta de nutrición');

        cy.plexButton('Cancelar').click();
        cy.wait('@perfil').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].permisos).not.include('rup:tipoPrestacion:751000013101');
        });
    });
});