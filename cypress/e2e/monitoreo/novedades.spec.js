/// <reference types="Cypress" />

const retryableBefore4 = (fn) => {
    let shouldRun = true;
    beforeEach(() => {
      if (!shouldRun) return;
      shouldRun = false;
      fn();
    });

    Cypress.on('test:after:run', (result) => {
      if (result.state === 'failed') {
        if (result.currentRetry < result.retries) {
          shouldRun = true;
        }
      }
    });
  };

context('Registro novedades', () => {
    let token;
    let modulo = {
        nombre: 'CITAS',
        descripcion: 'mejora la accesibilidad de pacientes a las prestaciones',
        subtitulo: 'centro inteligente de agendas & turnos',
        linkAcceso: '/citas/gestor_agendas',
        color: '#982f98',
        icono: 'mdi mdi-calendar',
        permisos: [
            'turnos:planificarAgenda:?'
        ]
    }

    retryableBefore4(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
        // se crea un módulo especifico definido para test
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
        let text = 'alguna descripcion';
        cy.plexButton('Registrar Novedad').click();
        cy.plexBool('name="activo"', true); // `Activa`
        cy.plexSelectType('name="select"', modulo.nombre);
        cy.plexText('label="titulo"', 'Novedad activa');
        cy.plexDatetime('label="fecha"', '07/02/2020');

        cy.plexHtml('label="descripcion"', text);

        cy.plexButtonIcon('image'); //revisamos que el boton exista

        cy.plexButton('Guardar').click();
        cy.wait('@postNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');

        //verificamos que la lista se cargue nuevamente en el listado
        cy.wait('@novedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-item').contains('Novedad activa');
        cy.get('plex-item').contains('Activa');
    });

    it('Se carga una novedad como inactiva y luego se activa', () => {
        cy.route('POST', '**/api/modules/registro-novedades/novedades').as('postNovedades');
        let text = 'Descripción novedad inactiva';
        cy.plexButton('Registrar Novedad').click();
        cy.plexBool('name="activo"', false); // `Inactiva`
        cy.plexSelectType('name="select"', modulo.nombre);
        cy.plexText('label="titulo"', "Novedad inactiva");
        cy.plexDatetime('label="fecha"', '08/02/2020');

        cy.plexHtml('label="descripcion"', text);

        cy.plexButtonIcon('image'); //revisamos que el boton exista

        cy.plexButton('Guardar').click();
        cy.wait('@postNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        cy.route('PATCH', '**/api/modules/registro-novedades/novedades/**').as('patchNovedades');
        cy.get('plex-item').plexBadge('Inactiva').first().click();
        cy.plexBool('label="Activa"', true);
        cy.plexButton('Guardar').click();

        cy.wait('@patchNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.activa).to.be.eq(true);
        });

    });

    it('Buscar una novedad por modulo ', () => {
        cy.route('POST', '**/api/modules/registro-novedades/novedades').as('postNovedades');
        let text = 'Descripción novedad';
        cy.plexButton('Registrar Novedad').click();
        cy.plexBool('name="activo"', true); // `Inactiva`
        cy.plexSelectType('name="select"', modulo.nombre);
        cy.plexText('label="titulo"', "Novedad búsqueda por módulo");
        cy.plexDatetime('label="fecha"', '10/02/2020');

        cy.plexHtml('label="descripcion"', text);

        cy.plexButtonIcon('image'); //revisamos que el boton exista

        cy.plexButton('Guardar').click();
        cy.wait('@postNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        // buscmos por el módulo creado con task
        cy.plexSelectType('name="modulo"', modulo.nombre);
        cy.wait('@novedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.log(xhr);
            expect(xhr.response.body[0].modulo.nombre).to.be.eq(modulo.nombre);
        });
        //verificamos que la lista contenga el primer elemeto del modulo elegido
        cy.get('plex-item').contains(modulo.nombre);
    });

    it('Buscar una novedad por título ', () => {
        cy.route('POST', '**/api/modules/registro-novedades/novedades').as('postNovedades');
        let text = 'Novedad para búsqueda por título';
        cy.plexButton('Registrar Novedad').click();
        cy.plexBool('name="activo"', true); // `Inactiva`
        cy.plexSelectType('name="select"', modulo.nombre);
        cy.plexText('label="titulo"', 'Novedad búsqueda por título');
        cy.plexDatetime('label="fecha"', '10/02/2020');

        cy.plexHtml('label="descripcion"', text);

        cy.plexButtonIcon('image'); //revisamos que el boton exista

        cy.plexButton('Guardar').click();
        cy.wait('@postNovedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Los datos se guardaron correctamente');
        // buscamos por el titulo ya definido inicialmente
        cy.plexText('label="Título"', 'Novedad búsqueda por título');
        cy.wait('@novedades').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length.gt(0);
        });
        //verificamos que la lista contenga en el primer elemento el titulo elegido
        cy.get('plex-item').last().contains('Novedad búsqueda por título');
    });
});