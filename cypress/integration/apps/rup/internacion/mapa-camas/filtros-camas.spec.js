const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Filtros de Mapa Camas', () => {
    const filtros = {
        unidadesOrganizativas: [
            { conceptId: '225747005', term: 'departamento de rayos X' },
            { conceptId: '309915006', term: 'servicio de cardiología' }
        ],
        sectores: [
            { id: '5c769884cfefcd5e80f7396e', term: 'ala izquierda' },
            { id: '5c769884cfefcd5e80f7396d', term: 'ala derecha' }
        ],
        tipoCama: { conceptId: '463742000', term: 'cama bariátrica' },
        esCensable: false
    };
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { permisos: [...permisosUsuario, 'internacion:rol:estadistica'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;

                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({
                        configCamas: [
                            { estado: 'ocupada', pacientes: [pacientes[0]], sector: filtros.sectores[0] },
                            { estado: 'disponible', count: 2, unidadOrganizativa: filtros.unidadesOrganizativas[0].conceptId, sector: filtros.sectores[0].id, esCensable: filtros.esCensable },
                            { estado: 'disponible', count: 5, unidadOrganizativa: filtros.unidadesOrganizativas[1].conceptId, sector: filtros.sectores[1].id, tipoCama: filtros.tipoCama.conceptId }
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
        cy.plexSelectType('label="Unidad Organizativa"', filtros.unidadesOrganizativas[0].nombre)
        cy.get('table tr').should('length', 4);
        cy.plexSelect('label="Unidad Organizativa"').clearSelect();
    });

    it('Filtrar por Sector', () => {
        // FILTRAR SECTOR.
        cy.plexSelectType('label="Sector"', filtros.sectores[1].nombre)
        cy.get('table tr').should('length', 6);
        cy.plexSelect('label="Sector"').clearSelect();
    });

    it('Filtrar por Tipo Cama', () => {
        // FILTRAR TIPO CAMA.
        cy.plexSelectType('label="Tipo de Cama"', filtros.tipoCama.nombre);
        cy.get('table tr').should('length', 6);
        cy.plexSelect('label="Tipo de Cama"').clearSelect();
    });

    it('Filtrar por Censable', () => {
        // FILTRAR ES CENSABLE.
        const censable = (filtros.tipoCama) ? 'Censable' : 'No censable';
        cy.plexSelectType('label="Censable"', censable).click();
        cy.get('table tr').should('length', 3);
        cy.plexSelect('label="Censable"').clearSelect();
    });
});