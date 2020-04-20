/// <reference types="Cypress" />

context('Registro novedades', () => {
    let token;
    let nombreModulo = 'CITAS';
    let modulo = {
        nombre: nombreModulo,
        descripcion: 'mejora la accesibilidad de pacientes a las prestaciones',
        subtitulo: 'centro inteligente de agendas & turnos',
        linkAcceso: '/citas/gestor_agendas',
        color: '#982f98',
        icono: 'mdi-calendar',
        permisos: [
            'turnos:planificarAgenda:?'
        ]
    }

    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        // se crea módulo un definido para test
        cy.task('database:create:modulo', modulo).then(m => {
            modulo = m;
            cy.log(modulo);
        });
        //se crean otros módulos aleatorios
        cy.task('database:create:modulo', null).then(m => {
            cy.log(m);
        });
        cy.task('database:create:modulo', null).then(m => {
            cy.log(m);
        });
        cy.task('database:create:modulo', null).then(m => {
            cy.log(m);
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/novedades', token);
        cy.route('GET', '**/api/modules/registro-novedades/novedades?**').as('novedades');
        cy.route('GET', '**/api/core/tm/modulos**').as('modulos');
    });



    it('Registrar una Novedad y verificar que este en la lista', () => {
        cy.route('POST', '**/api/modules/registro-novedades/novedades').as('postNovedades');
        let titulo = 'Cambio en registro de camas';
        let text = 'alguna descripcion';
        cy.plexButton('Registrar Novedad').click();
        cy.plexBool('name="activo"', false); // `Inactiva`
        cy.plexSelectType('name="select"', modulo.nombre);
        cy.plexText('label="titulo"', titulo);
        cy.plexDatetime('label="fecha"', '07/02/2020');

        let elem = cy.get(`plex-text[label="descripcion"] quill-editor div[class="ql-container ql-snow"] div p`);
        elem.type(text, {
            force: true
        });

        cy.plexButtonIcon('image-plus');

        cy.plexButton('Guardar').click();
        cy.wait('@postNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');

        //verificamos que la lista se cargue nuevamente en el listado
        cy.wait('@novedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody td').contains(titulo);
        cy.get('table tbody td').contains('Inactiva');
    });

    it('Se busca la primer novedad cargada como INACTIVA y se activa', () => {
        cy.route('PATCH', '**/api/modules/registro-novedades/novedades/**').as('patchNovedades');
        cy.get('table tbody td').find('span').should('have.class', 'badge badge-success badge-md').contains('Inactiva').first().click();
        cy.plexBool('label="Activa"', true);
        cy.plexButton('Guardar').click();

        cy.wait('@patchNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody td').find('span').should('have.class', 'badge badge-success badge-md').first().contains(' Activa ');
    });

    it('Buscar una novedad por titulo: ', () => {
        cy.plexSelectType('name="modulo"', nombreModulo);
        cy.wait('@novedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.log(xhr);
            expect(xhr.response.body[0].modulo.nombre).to.be.eq(nombreModulo);
        });
        //verificamos que la lista contenga el primer elemeto del modulo elegido
        cy.get('table tbody td').contains(nombreModulo);
    });
});