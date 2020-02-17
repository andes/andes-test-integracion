const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Capa Médica - Ingresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { permisos: [...permisosUsuario, 'internacion:rol:medica'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;

                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({ maquinaEstados: { capa: 'medica' }, configCamas: [{ estado: 'disponible', pacientes: [pacientes[0]] }] }).then(camasCreadas => {
                        return cy.goto('/internacion/mapa-camas', token);
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/auth/organizaciones**', true).as('getOrganizaciones');
        cy.viewport(1920, 1080);
    });

    it('Ingreso simplificado cambiando paciente', () => {
        cy.plexButtonIcon('plus').click();

        cy.plexText('name="buscador"', pacientes[0].nombre);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody tr').first().click();

        cy.plexButtonIcon('arrow-left').click();

        cy.plexText('name="buscador"').clear();
        cy.plexText('name="buscador"', pacientes[1].nombre);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody tr').first().click();

        cy.plexButtonIcon('check').click();
        cy.wait(200);

        cy.contains('Paciente internado')
        cy.contains('Aceptar').click();
        cy.wait(200);
        cy.get('table tr').eq(1).find('td').find('plex-badge').find('span').should(($span) => {
            expect($span.text().trim()).to.equal('Ocupada');
        });
    });
});