const moment = require('moment');

describe('Mapa Camas - Detalle de Cama', () => {
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
        cy.viewport(1600, 900);
        cy.intercept('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas/**').as('getCama');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**', paciente).as('getPaciente');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/deshacer').as('deshacer');
        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**').as('anularPrestacion');
    });

    it('Verificar datos de cama', () => {
        cy.goto('/mapa-camas', token);
        cy.wait('@getCamas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.get('table tr').eq(1).find('td').eq(1).contains('ANDES').click();

        // VERIF. NOMBRE
        cy.get('plex-detail section div.contenedor-textos > div').eq(1).find('div').should(($div) => {
            expect($div.contents().eq(cama.cama.nombre));
        });

        // VERIF. ESTADO
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(0).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(cama.estados[1].estado.toLowerCase());
        });

        // VERIF. CENSABLE
        const censable = (cama.estados[1].esCensable) ? 'censable' : 'no censable'
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(1).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(censable);
        });

        // VERIF. GENERO
        const genero = (cama.estados[1].genero.term === 'género masculino') ? 'cama masculina' : 'cama femenina';
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(2).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(genero);
        });

        // VERIF. UNIDAD ORGANIZATIVA
        cy.get('plex-detail plex-grid plex-label').eq(0).find('small').should(($span) => {
            expect($span.text()).to.equal(cama.estados[1].unidadOrganizativa.term);
        });

        // VERIF. ESPECIALIDADES
        let esp = '';
        for (const especialidad of cama.estados[1].especialidades) {
            esp = esp + especialidad.term;
        }

        cy.get('plex-detail plex-grid plex-label').eq(1).find('small').should(($span) => {
            expect($span.text()).to.equal(esp);
        });

        // VERIF. TIPO CAMA
        cy.get('plex-detail plex-grid plex-label').eq(2).find('small').should(($span) => {
            expect($span.text()).to.equal(cama.cama.tipoCama.term);
        });

        // VERIF. SECTOR
        cy.get('plex-detail plex-grid plex-label').eq(3).find('small').should(($span) => {
            expect($span.text()).to.equal(cama.cama.sectores[0].nombre);
        });

        let equipamiento = ''
        if (cama.cama.equipamiento) {
            for (const equip of cama.cama.equipamiento) {
                equipamiento = equipamiento + equip.term;
            }

            // VERIF. EQUIPAMIENTO
            cy.get('plex-detail section div').eq(7).find('small').should(($span) => {
                expect($span.text().split(',').join("")).to.equal(equipamiento.split(',').join(""));
            });
        }

        // VERIF. ESTADO
        cy.get('plex-detail').eq(1).find('section').find('div').find('plex-badge').eq(0).find('span').should(($span) => {
            expect($span.text().trim()).to.equal(paciente.estado.toUpperCase());
        });

        // VERIF. NOMBRE - APELLIDO PACIENTE
        cy.get('plex-detail section div.contenedor-textos > div').eq(0).find('div').should(($div) => {
            expect($div.contents().eq(`${paciente.apellido}, ${paciente.nombre}`));
        });

        // VERIF. DOCUMENTO
        cy.get('plex-detail section div.contenedor-textos > div').eq(1).find('div').should(($div) => {
            expect($div.contents().eq(paciente.documento));
        });

        // VERIF. SEXO
        cy.get('plex-detail').eq(1).find('plex-grid').find('div').eq(0).find('small').should(($span) => {
            expect($span.text().toLowerCase()).to.equal(paciente.genero);
        });

        // VERIF. FECHA NACIMIENTO
        cy.get('plex-detail').eq(1).find('plex-grid').find('plex-label').eq(2).find('small').should(($span) => {
            expect($span.text()).to.equal(moment(paciente.fechaNacimiento).format('DD/MM/YYYY'));
        });
    });

    it('Deshacer internacion', () => {
        cy.goto('/mapa-camas', token);
        cy.wait('@getCamas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.getCama(cama.cama.nombre).click();

        cy.deshacerInternacion();

        cy.wait('@deshacer').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.wait('@anularPrestacion').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        })

        cy.swal('confirm');
    });
});


