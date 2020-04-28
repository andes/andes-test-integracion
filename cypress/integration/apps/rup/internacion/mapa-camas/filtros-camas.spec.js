const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Filtros de Mapa Camas', () => {
    const filtros = {
        unidadesOrganizativas: [
            {
                "_id" : "5b294d1008357438f45b5974",
                "term" : "departamento de anestesia",
                "conceptId" : "309901009",
            }, 
            {
                "_id" : "5b294d1008357438f45b5973",
                "term" : "departamento de oftalmología",
                "conceptId" : "309988001",
            }, 
        ],
        sectores: [
            {
                "_id" : "5b0586800d3951652da7daa1",
                "nombre" : "edificio este"
            },
            { 
                "_id" : "5b0703952483bc2afa04e73c",
                "nombre" : "habi1" 
            }
        ],
        tipoCama: { 
            conceptId: '229772003', term: 'cama' 
        },
        esCensable: false
    };
    let token;
    let pacientes;
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
                    factoryInternacion({
                        configCamas: [
                            { estado: 'ocupada', pacientes: [pacientes[0]], sector: filtros.sectores[0] },
                            { estado: 'disponible', count: 2, unidadOrganizativa: filtros.unidadesOrganizativas[0].conceptId, sector: filtros.sectores[0]._id, esCensable: filtros.esCensable },
                            { estado: 'disponible', count: 5, unidadOrganizativa: filtros.unidadesOrganizativas[1].conceptId, sector: filtros.sectores[1]._id, tipoCama: filtros.tipoCama.conceptId }
                        ]
                    }).then(camasCreadas => {
                        return cy.goto('/internacion/mapa-camas', token);
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.viewport(1920, 1080);
    });

    it('Filtrar por paciente', () => {
        // FILTRAR PACIENTE
        cy.plexText('label="Paciente"', pacientes[0].nombre);
        cy.get('table tr').should('length', 2);
        cy.plexText('label="Paciente"').clear();
    });

    it('Filtrar por unidad organizativa', () => {
        // FILTRAR UNIDAD ORG.
        cy.plexSelectType('label="Unidad Organizativa"', filtros.unidadesOrganizativas[0].term)
        cy.get('table tr').should('length', 3);
        cy.plexSelect('label="Unidad Organizativa"').clearSelect();
    });

    it('Filtrar por Sector', () => {
        // FILTRAR SECTOR.
        cy.plexSelectType('label="Sector"', filtros.sectores[1].nombre)
        cy.get('table tr').should('length', 6);
        cy.plexSelect('label="Sector"').clearSelect();
    });

    it('Filtrar por Estado', () => {
        // FILTRAR ESTADO.
        cy.plexSelectType('label="Estado"', 'ocupada')
        cy.get('table tr').should('length', 2);
        cy.plexSelect('label="Estado"').clearSelect();
    });

    it('Filtrar por Tipo Cama', () => {
        // FILTRAR TIPO CAMA.
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Tipo de Cama"', filtros.tipoCama.term);
        cy.get('table tr').should('length', 6);
        cy.plexSelect('label="Tipo de Cama"').clearSelect();
        cy.plexButtonIcon('chevron-up').click();
    });

    it('Filtrar por Censable', () => {
        // FILTRAR ES CENSABLE.
        cy.plexButtonIcon('chevron-down').click();
        const censable = (filtros.tipoCama) ? 'Censable' : 'No censable';
        cy.plexSelectType('label="Censable"', censable).click();
        cy.get('table tr').should('length', 3);
        cy.plexSelect('label="Censable"').clearSelect();
        cy.plexButtonIcon('chevron-up').click();
    });
});