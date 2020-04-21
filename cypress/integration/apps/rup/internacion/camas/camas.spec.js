const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

function getStubs() {
    cy.route('GET', '/api/core/term/snomed/expression?expression=^2051000013106**', [{
        "conceptId": "12345",
        "term": "Cama",
    }]).as('expTipoDeCama');

    cy.route('GET', '/api/core/term/snomed/expression?expression=<<394733009&words=**', [{
        "conceptId": "1234",
        "term": "Enfermeria en Rehabilitación",
    }]).as('expEspecialidad');

    cy.route('GET', '/api/core/term/snomed/expression?expression=70311**', [{
        "conceptId": "5555",
        "term": "Masculina",
    }, {
        "conceptId": "888",
        "term": "Femenina",
    }]).as('expGenero');

    cy.route('GET', '/api/core/term/snomed/expression?expression=^2061000013108**', [ {
        "conceptId" : "470361",
        "term" : "sistema de aspiración para uso general, al vacío",
        "fsn" : "sistema de aspiración para uso general, al vacío (objeto físico)",
        "semanticTag" : "objeto físico"
    }, {
        "conceptId" : "470391",
        "term" : "aporte central de oxigeno",
        "fsn" : "aporte central de oxigeno",
        "semanticTag" : "objeto físico"
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

        // CREA USUARIO
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964', permisos: [...permisosUsuario, 'internacion:rol:estadistica'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;
                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;
                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({ configCamas: [{estado: 'disponible', count: 2}] }).then(camasCreadas => {
                        camas = camasCreadas;
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

    it('Alta Cama', () => {
        cy.goto('/internacion/cama', token);
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

        cy.contains('La cama fue guardada');
        cy.get('button').contains('Aceptar').click();
    });
    
    it('Editar Cama', () => {
        cy.goto(`/internacion/cama/${camas[0].idCama}`, token);
        cy.plexText('label="Nombre"').clear();
        cy.plexText('label="Nombre"', 'Cama 888');
        cy.plexSelectAsync('label="Tipo de cama"', 'Cam', '@expTipoDeCama', 0);
        cy.plexSelectAsync('label="Especialidad/es"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectAsync('label="Equipamiento"', 'ap', '@expEquipamiento', 0);
        cy.plexSelectType('label="Genero"').clearSelect();
        cy.plexSelectAsync('label="Genero"', 'Fem', '@expGenero', 0);
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

        cy.contains('La cama fue guardada');
        cy.get('button').contains('Aceptar').click();
    });

    it('Baja Cama', () => {
        cy.goto(`/internacion/cama/${camas[camas.length - 1].idCama}`, token);
        cy.wait(100)
        cy.plexButton('INACTIVAR CAMA').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@editCama').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });;

        cy.contains('La cama fue dada de baja');
        cy.get('button').contains('Aceptar').click();
    });
});