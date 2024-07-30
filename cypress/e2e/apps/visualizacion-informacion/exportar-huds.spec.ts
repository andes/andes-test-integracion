/// <reference types="Cypress" />

context('Exportar HUDS', () => {
    let token;
    let pacienteValidado;
    let pacienteHudsCompleta;
    let pacienteConPrestacion;
    before(() => {
        cy.seed();

        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacienteValidado = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacienteHudsCompleta = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacienteConPrestacion = p;
        });

    })

    beforeEach(() => {
        cy.intercept('GET', '/api/modules/huds/motivosHuds/motivosHuds**', { fixture: 'huds/modalHuds.json' }).as('motivosHuds');

        cy.server();
        cy.goto('/visualizacion-informacion/exportar-huds', token);
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**api/modules/huds/export').as('peticionExport');
        cy.route('GET', '**api/modules/huds/export?**').as('pendientes');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('prestaciones');


    })

    it('Seleccionar un paciente y solicitar exportar huds entre dos fechas', () => {
        let ayer = Cypress.moment().add('days', -1).format('DD/MM/YYYY');
        let hoy = Cypress.moment().format('DD/MM/YYYY');
        cy.plexText('name="buscador"', pacienteValidado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(pacienteValidado.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(pacienteValidado.nombre);
            expect(xhr.response.body[0].documento).to.be.eq(pacienteValidado.documento);
        });
        cy.get('paciente-listado plex-item').contains(pacienteValidado.nombre).click();
        cy.modalPrivacidad('Procesos de Auditoría');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexDatetime('label="Desde"', ayer);
        cy.plexDatetime('label="Hasta"', { text: hoy, skipEnter: true });
        cy.plexButton(' Generar ').click();

        cy.wait('@peticionExport').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@pendientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].user.usuario.apellido).to.be.eq("Huenchuman");
            expect(xhr.response.body[0].user.usuario.nombre).to.be.eq("Natalia");
            expect(xhr.response.body[0].user.usuario.username).to.be.eq(30643636);
        })
        cy.get('plex-table').find('td').contains(pacienteValidado.nombre);
    });

    it('Seleccionar un paciente y solicitar exportar huds completa', () => {
        cy.plexText('name="buscador"', pacienteHudsCompleta.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(pacienteHudsCompleta.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(pacienteHudsCompleta.nombre);
            expect(xhr.response.body[0].documento).to.be.eq(pacienteHudsCompleta.documento);
        });
        cy.get('paciente-listado plex-item').contains(pacienteHudsCompleta.nombre).click();
        cy.modalPrivacidad('Procesos de Auditoría');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexBool("label='HUDS Completa'", true);
        cy.plexButton(' Generar ').click();
        cy.wait('@peticionExport').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@pendientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].user.usuario.apellido).to.be.eq("Huenchuman");
            expect(xhr.response.body[0].user.usuario.nombre).to.be.eq("Natalia");
            expect(xhr.response.body[0].user.usuario.username).to.be.eq(30643636);
        })
        cy.get('plex-table').find('td').contains(pacienteHudsCompleta.nombre);
    });

    it('Seleccionar un paciente y solicitar exportar huds entre dos fechas y con una prestación', () => {
        let ayer = Cypress.moment().add('days', -1).format('DD/MM/YYYY');
        let hoy = Cypress.moment().format('DD/MM/YYYY');
        cy.plexText('name="buscador"', pacienteConPrestacion.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(pacienteConPrestacion.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(pacienteConPrestacion.nombre);
            expect(xhr.response.body[0].documento).to.be.eq(pacienteConPrestacion.documento);
        });
        cy.get('paciente-listado plex-item').contains(pacienteConPrestacion.nombre).click();
        cy.modalPrivacidad('Procesos de Auditoría');
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexDatetime('label="Desde"', ayer);
        cy.plexDatetime('label="Hasta"', { text: hoy, skipEnter: true });
        cy.plexSelectType('label="Prestaciones"', 'consulta de clinica medica');
        cy.plexButton(' Generar ').click();
        cy.wait('@peticionExport').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@pendientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].user.usuario.apellido).to.be.eq("Huenchuman");
            expect(xhr.response.body[0].user.usuario.nombre).to.be.eq("Natalia");
            expect(xhr.response.body[0].user.usuario.username).to.be.eq(30643636);
        })
        cy.get('plex-table').find('td').contains(pacienteConPrestacion.nombre);
    });
})