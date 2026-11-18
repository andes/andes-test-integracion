const expresionesSnomed = ['^2051000013106', '^2061000013108', '<<394658006', '703118005 OR 703117000'];

function stubSnomed(expression, body, alias) {
    cy.intercept({
        method: 'GET',
        pathname: '/api/core/term/snomed/expression',
        query: { expression }
    }, body).as(alias);
}

function getStubs() {
    cy.intercept('**/internacion**/**').as('backToMapa');

    stubSnomed('^2051000013106', [{
        "conceptId": "12345",
        "term": "Cama",
    }], 'expTipoDeCama');

    stubSnomed('<<394658006', [{
        "conceptId": "1234",
        "term": "Enfermeria en Rehabilitación",
    }], 'expEspecialidad');

    stubSnomed('703118005 OR 703117000', [{
        "conceptId": "5555",
        "term": "género masculino",
    }, {
        "conceptId": "888",
        "term": "género femenino",
    }], 'expGenero');

    stubSnomed('^2061000013108', [{
        "conceptId": "470361",
        "term": "sistema de aspiración para uso general, al vacío",
        "fsn": "sistema de aspiración para uso general, al vacío (objeto físico)",
        "semanticTag": "objeto físico"
    }, {
        "conceptId": "470391",
        "term": "aporte central de oxigeno",
        "fsn": "aporte central de oxigeno",
        "semanticTag": "objeto físico"
    }], 'expEquipamiento');

    cy.intercept('POST', '**/api/modules/rup/internacion/camas**').as('createCama')
    cy.intercept('PATCH', '**/api/modules/rup/internacion/camas/**').as('editCama')
    cy.intercept('PATCH', '**/api/modules/rup/internacion/camaEstados/**').as('editCamaEstados')
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
        getStubs();

        cy.viewport(1920, 1080);
        cy.window().then((win) => {
            expresionesSnomed.forEach((key) => win.localStorage.removeItem(key));
        });

        cy.goto('/mapa-camas/internacion', token);
    });

    it('Alta Cama', () => {
        cy.plexDropdown('label="NUEVO RECURSO"', "CAMA");
        cy.wait(['@expTipoDeCama', '@expEquipamiento', '@expEspecialidad', '@expGenero']);
        cy.plexText('label="Nombre"', 'Cama 666');
        cy.plexDatetime('name="fechaDisponible"', { text: cy.today(), skipEnter: true });
        cy.plexSelectType('label="Tipo de cama"', 'Cam');
        cy.plexSelectType('label="Equipamiento"', 'sis');
        cy.plexSelectType('label="Especialidad/es"', 'Enf');
        cy.plexSelectType('label="Genero"', 'Masc');
        cy.plexSelectType('label="Unidad organizativa"', 'servicio');
        cy.plexSelectType('label="Ubicación"', 'habi1');

        cy.plexButton('GUARDAR').click();
        cy.wait('@createCama').then(({response}) => {
            const cama = response.body;
            expect(response.statusCode).to.be.eq(200);
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
        cy.wait(['@expTipoDeCama', '@expEquipamiento', '@expEspecialidad', '@expGenero']);

        cy.plexText('label="Nombre"').clear();
        cy.plexText('label="Nombre"', '{selectall}{backspace}' + 'Cama 888');
        cy.plexSelectType('label="Tipo de cama"', 'Cam');
        cy.plexSelectType('label="Equipamiento"', 'ap');
        cy.plexSelectType('label="Genero"').clearSelect();
        cy.plexSelectType('label="Genero"', 'Fem');
        cy.plexSelectType('label="Ubicación"').clearSelect();
        cy.plexSelectType('label="Ubicación"', 'edific');
        cy.plexSelectType('label="Unidad organizativa"').clearSelect();
        cy.plexSelectType('label="Unidad organizativa"', 'servicio');

        cy.plexButton('GUARDAR').click();
        cy.wait('@editCama').then(({response}) => {
            const cama = response.body;
            expect(response.statusCode).to.be.eq(200);
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

        cy.wait('@editCamaEstados').then(({response}) => {
            expect(response.statusCode).to.be.eq(200);
        });;

        cy.wait(200)

        cy.swal('confirm', 'La cama fue dada de baja');
    });
});