/// <reference types="Cypress" />

context('BUSCADOR - Buscador de turnos y Prestaciones', function () {
    let token;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente');
        cy.task('database:seed:agenda', {
            pacientes: '586e6e8627d3107fde116cdb',
            tipoPrestaciones: '598ca8375adc68e2a0c121bc',
            estado: 'publicada',
            organizacion: '57f67d090166fa6aedb2f9fb',
            inicio: '3',
            fin: '4'
        });
        cy.task('database:seed:agenda', {
            pacientes: '586e6e8627d3107fde116cdb',
            tipoPrestaciones: '598ca8375adc68e2a0c121b8',
            estado: 'publicada',
            organizacion: '57f67d090166fa6aedb2f9fb',
            inicio: '5',
            fin: '6'
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            cy.task('database:seed:agenda', {
                pacientes: p._id,
                tipoPrestaciones: '598ca8375adc68e2a0c121b8',
                profesionales: '5c82a5a53c524e4c57f08cf3',
                estado: 'publicada',
                organizacion: '57f67d090166fa6aedb2f9fb',
                inicio: '5',
                fin: '6'
            });
        });
        cy.login('30643636', 'asd', '57f67d090166fa6aedb2f9fb').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/estadistica/turnos_prestaciones**').as('turnosPrestaciones');
        cy.route('GET', '**/api/core/tm/profesionales**').as('profesionales');
        cy.route('POST', '**/api/modules/huds/export').as('exportHuds');
        cy.route('GET', '**/api/modules/huds/export?**').as('pendientes');
        cy.goto('/buscador', token);
    });
    it('Listar turnos con filtros de fechas', () => {
        if (cy.esFinDeMes()) {
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(3);
            });

        } else {
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(3);
            });
        }
    });
    it('Listar turnos con filtros de fechas y tipo de prestacion', () => {
        cy.wait('@turnosPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexSelectType('label="Prestación"', 'consulta de medicina general');
        if (cy.esFinDeMes()) {
            cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + Cypress.moment().add(1, 'days').format('DD/MM/YYYY'));
            cy.plexButton("Buscar").click();
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        } else {
            cy.plexButton("Buscar").click();
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(2);
            });
        }
    });
    it('Listar turnos con filtros de fechas y equipo de salud logueado', () => {
        cy.plexButton("Buscar").click();
        cy.wait('@turnosPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        if (cy.esFinDeMes()) {
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(3);
                expect(xhr.response.body[0].profesionales0).to.be.eq('HUENCHUMAN');
                expect(xhr.response.body[1].profesionales0).to.be.eq('HUENCHUMAN');
            });
        } else {
            cy.wait('@turnosPrestaciones').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
                expect(xhr.response.body).to.have.length(3);
                expect(xhr.response.body[0].profesionales0).to.be.eq('HUENCHUMAN');
                expect(xhr.response.body[1].profesionales0).to.be.eq('HUENCHUMAN');
            });
        }
    });
    it('Exportar todas las prestaciones filtradas entre dos fechas', () => {
        let hoy = Cypress.moment().format('DD/MM/YYYY');
        cy.wait('@turnosPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexBool('name="all"', true);
        cy.plexButton("Exportar").click();
        cy.wait('@exportHuds').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.request.body.arrayPrestaciones).to.have.length(3);
        });
        cy.plexButton("Descargas pendientes").click();
        cy.wait('@pendientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].user.usuario.apellido).to.be.eq('Huenchuman');
            expect(xhr.response.body[0].user.usuario.nombre).to.be.eq('Natalia');
            expect(xhr.response.body[0].user.usuario.username).to.be.eq(30643636);
        });
        cy.get('plex-list').find('plex-item').contains(hoy);
    });
    it('Exportar una prestacion de las filtradas entre dos fechas', () => {
        let hoy = Cypress.moment().format('DD/MM/YYYY');
        cy.wait('@turnosPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody tr td plex-bool').first().click();
        cy.plexButton("Exportar").click();
        cy.wait('@exportHuds').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.request.body.arrayPrestaciones).to.have.length(1);
        });
        cy.plexButton("Descargas pendientes").click();
        cy.wait('@pendientes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].user.usuario.apellido).to.be.eq('Huenchuman');
            expect(xhr.response.body[0].user.usuario.nombre).to.be.eq('Natalia');
            expect(xhr.response.body[0].user.usuario.username).to.be.eq(30643636);
        });
        cy.get('plex-list').find('plex-item').contains(hoy);
    });
});