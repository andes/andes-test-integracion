const moment = require('moment');

function getStubs() {
    cy.route('**/internacion**/**').as('backToMapa');

    cy.route('GET', '/api/core/term/snomed/expression?expression=^2051000013106**', [{
        "conceptId": "12345",
        "term": "Cama",
    }]).as('expTipoDeCama');

    cy.route('GET', '/api/core/term/snomed/expression?expression=<<394658006&words=**', [{
        "conceptId": "1234",
        "term": "Enfermeria en Rehabilitación",
    }]).as('expEspecialidad');

    cy.route('GET', '/api/core/term/snomed/expression?expression=70311**', [{
        "conceptId": "5555",
        "term": "género masculino",
    }, {
        "conceptId": "888",
        "term": "género femenino",
    }]).as('expGenero');

    cy.route('GET', '/api/core/term/snomed/expression?expression=^2061000013108**', [{
        "conceptId": "470361",
        "term": "sistema de aspiración para uso general, al vacío",
        "fsn": "sistema de aspiración para uso general, al vacío (objeto físico)",
        "semanticTag": "objeto físico"
    }, {
        "conceptId": "470391",
        "term": "aporte central de oxigeno",
        "fsn": "aporte central de oxigeno",
        "semanticTag": "objeto físico"
    }]).as('expEquipamiento');

    cy.route('POST', '**/api/modules/rup/internacion/camas**').as('createCama')
    cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('editCama')
}

describe('ABM Camas', () => {
    let token;
    let pacientes;
    let camas;
    before(() => {
        cy.seed();
        cy.loginCapa('estadistica').then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({ configCamas: [{ estado: 'disponible', count: 2 }] }).then(camasCreadas => {
                camas = camasCreadas;
            });
        });
    });

    beforeEach(() => {
        cy.server();

        getStubs();

        cy.viewport(1920, 1080);

        cy.goto('/mapa-camas', token);
    });

    it('Alta Cama', () => {
        cy.plexDropdown('label="NUEVO RECURSO"', "CAMA");

        cy.plexText('label="Nombre"', 'Cama 666');
        cy.plexSelectAsync('label="Tipo de cama"', 'Cam', '@expTipoDeCama', 0);
        cy.plexSelectAsync('label="Equipamiento"', 'sis', '@expEquipamiento', 0);
        cy.plexSelectAsync('label="Especialidad/es"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectAsync('label="Genero"', 'Masc', '@expGenero', 0);
        cy.plexSelectType('label="Unidad organizativa"', 'servicio');
        cy.plexSelectType('label="Ubicación"', 'habi1');

        cy.plexButton('GUARDAR').click();
        cy.wait('@createCama').then((xhr) => {
            const cama = xhr.response.body;
            expect(xhr.status).to.be.eq(200);
            expect(cama.nombre).to.be.eq('Cama 666');
            expect(cama.unidadOrganizativaOriginal.term).to.be.eq('servicio médico');
            expect(cama.sectores[0].nombre).to.be.eq('habi1');
            expect(cama.tipoCama.term).to.be.eq('Cama');
        });

        cy.swal('confirm', 'La cama fue guardada');
    });

    it('Editar Cama', () => {
        cy.getCama(camas[0].cama.nombre).click();
        cy.get('[label="CAMA"] > plex-title > .plex-title > .title-content').plexButtonIcon('pencil').click();

        cy.plexText('label="Nombre"').clear();
        cy.plexText('label="Nombre"', 'Cama 888');
        cy.plexSelectAsync('label="Tipo de cama"', 'Cam', '@expTipoDeCama', 0);
        cy.plexSelectAsync('label="Especialidad/es"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectAsync('label="Equipamiento"', 'ap', '@expEquipamiento', 0);
        cy.plexSelectType('label="Genero"').clearSelect();
        cy.plexSelectAsync('label="Genero"', 'Fem', '@expGenero', 0);
        cy.plexSelectType('label="Ubicación"').clearSelect();
        cy.plexSelectType('label="Ubicación"', 'edific');
        cy.plexSelectType('label="Unidad organizativa"').clearSelect();
        cy.plexSelectType('label="Unidad organizativa"', 'servicio');

        cy.plexButton('GUARDAR').click();
        cy.wait('@editCama').then((xhr) => {
            const cama = xhr.response.body;
            expect(xhr.status).to.be.eq(200);
            expect(cama.nombre).to.be.eq('Cama 888');
            expect(cama.sectores[0].nombre).to.be.eq('edificio este');
            expect(cama.tipoCama.term).to.be.eq('Cama');
        });;

        cy.swal('confirm', 'La cama fue guardada');
    });

    it('Baja Cama', () => {
        cy.getCama(camas[camas.length - 1].cama.nombre).click();
        cy.get('[label="CAMA"] > plex-title > .plex-title > .title-content').plexButtonIcon('pencil').click();
        cy.contains('INACTIVAR CAMA');
        cy.plexButton('INACTIVAR CAMA').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@editCama').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });;

        cy.wait(200)

        cy.swal('confirm', 'La cama fue dada de baja');
    });
});