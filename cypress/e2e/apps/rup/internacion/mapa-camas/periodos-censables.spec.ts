const moment = require('moment');

describe('Mapa Camas - Periodos censables', () => {
    let token;
    let paciente;
    let cama;
    before(() => {
        cy.seed();

        cy.loginCapa('estadistica').then(([user, t, pacientesCreados]) => {
            token = t;
            paciente = pacientesCreados[1];
            // CREA UN MUNDO IDEAL DE INTERNACION
            cy.factoryInternacion({
                configCamas: [{
                    estado: 'ocupada', pacientes: [paciente],
                    extras: { ingreso: true },
                    fechaIngreso: moment().subtract(1, 'd').toDate(),
                    unidadOrganizativa: '309901009',
                    sector: {
                        "tipoSector": {
                            "refsetIds": [],
                            "fsn": "edificio (medio ambiente)",
                            "term": "edificio",
                            "conceptId": "2421000013105",
                            "semanticTag": "medio ambiente"
                        },
                        "_id": "5b0586800d3951652da7daa1",
                        "nombre": "edificio este"
                    }
                }]
            }).then(camasCreadas => {
                cama = camasCreadas[0];
            });
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas/**').as('getCama');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**', paciente).as('getPaciente');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/deshacer').as('deshacer');
        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**').as('anularPrestacion');

        cy.goto('/mapa-camas', token);
        cy.wait('@getCamas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.get('table tr').eq(1).find('td').eq(1).contains('ANDES').click();
        cy.plexTab("INTERNACION").click();
        cy.get('plex-layout-sidebar plex-button[tooltip="Editar periodos"]').first().click({ force: true });
    });

    it('Agregar nuevo periodo válido', () => {
        let hoy = moment().format('DD/MM/YYYY');
        let mañana = moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Fin de censo"', mañana);
        cy.plexButtonIcon("check").click();
        cy.get('plex-label[titulo="Desde"]').should('contain', hoy);
        cy.get('plex-label[titulo="Hasta"]').should('contain', mañana);
        cy.toast('success', 'Periodos guardados exitosamente');
    });

    it('Seleccionar periodo duplicado', () => {
        let hoy = moment().format('DD/MM/YYYY');
        let mañana = moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Fin de censo"', mañana);
        cy.plexButtonIcon("check").click();

        cy.get('plex-label[titulo="Desde"]').should('contain', hoy);
        cy.get('plex-label[titulo="Hasta"]').should('contain', mañana);

        cy.get("span").contains("El periodo ingresado ya existe");
    });

    it('Eliminar un periodo y dejar listado vacío', () => {
        cy.get('plex-layout-sidebar plex-button[tooltip="Eliminar periodo"]').first().click({ force: true });
        cy.get('plex-layout-sidebar plex-button[tooltip="Cerrar"]').first().click({ force: true });

        let hoy = moment().format('DD/MM/YYYY');

        cy.get('plex-label[titulo="Desde"]').should('not.exist', hoy)
        cy.get('plex-label[titulo="No hay periodos censables cargados"]').should('exist')
    });
});


