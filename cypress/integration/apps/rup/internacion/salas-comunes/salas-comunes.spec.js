const moment = require('moment')

function getStubs() {
    cy.route('POST', '**/api/modules/rup/internacion/sala-comun**').as('createSala')
    cy.route('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('editSala')
}

describe('ABM Salas', () => {
    let token;
    let pacientes;
    let salas;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964', permisos: [cy.permisosUsuario, 'internacion:rol:medica', 'internacion:sala:create', 'internacion:sala:edit'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;
                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;
                    // CREA UN MUNDO IDEAL DE INTERNACION
                    cy.factoryInternacion({ sala: true, config: [{ estado: 'disponible', count: 1 }] }).then(salasCreadas => {
                        salas = salasCreadas;
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();

        getStubs();

        cy.viewport(1920, 1080);
    });

    it('Alta Sala', () => {
        cy.goto('/internacion/sala-comun', token);
        cy.plexText('label="Nombre"', 'Sala 666');
        cy.plexFloat('label="Capacidad"', 9999);
        cy.plexSelectType('label="Unidades Organizativas"', 'servicio');
        cy.plexSelectType('label="Sectores"', 'H');

        cy.plexButton('GUARDAR').click();
        cy.wait('@createSala').then((xhr) => {
            const cama = xhr.response.body;
            expect(xhr.status).to.be.eq(200);
            expect(cama.nombre).to.be.eq('Sala 666');
            expect(cama.unidadOrganizativas[0].term).to.be.eq('servicio médico');
            expect(cama.sectores[0].nombre).to.be.eq('habi1');
        });

        cy.contains('La sala fue guardada');
        cy.get('button').contains('Aceptar').click();
    });

    it('Modificación Sala', () => {
        cy.goto(`/internacion/sala-comun/${salas[0]._id}`, token);
        cy.plexText('label="Nombre"').clear();
        cy.plexText('label="Nombre"', 'Sala 666');
        cy.plexFloat('label="Capacidad"').clear();
        cy.plexFloat('label="Capacidad"', 9999);
        cy.plexSelectType('label="Unidades Organizativas"').clearSelect();
        cy.plexSelectType('label="Unidades Organizativas"', 'servicio');
        cy.plexSelectType('label="Sectores"').clearSelect();
        cy.plexSelectType('label="Sectores"', 'H');

        cy.plexButton('GUARDAR').click();
        cy.wait('@editSala').then((xhr) => {
            const sala = xhr.response.body;
            expect(xhr.status).to.be.eq(200);
            expect(sala.nombre).to.be.eq('Sala 666');
            expect(sala.unidadOrganizativas[0].term).to.be.eq('servicio médico');
            expect(sala.sectores[0].nombre).to.be.eq('habi1');
        });

        cy.contains('La sala fue guardada');
        cy.get('button').contains('Aceptar').click();
    });
});