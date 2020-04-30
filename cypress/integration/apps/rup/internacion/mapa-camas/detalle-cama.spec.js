const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Mapa Camas - Detalle de Cama', () => {
    let token;
    let paciente;
    let cama;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { organizacion: '57e9670e52df311059bc8964', permisos: [...permisosUsuario, 'internacion:rol:estadistica'], organizacion: '57e9670e52df311059bc8964' }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    paciente = pacientesCreados[1];
                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({
                        configCamas: [{ estado: 'ocupada', pacientes: [paciente], unidadOrganizativa: '309901009', 
                        sector: {
                            "tipoSector" : {
                                "refsetIds" : [],
                                "fsn" : "edificio (medio ambiente)",
                                "term" : "edificio",
                                "conceptId" : "2421000013105",
                                "semanticTag" : "medio ambiente"
                            },
                            "_id" : "5b0586800d3951652da7daa1",
                            "nombre" : "edificio este"
                        }}]
                    }).then(camasCreadas => {
                        cama = camasCreadas[0];
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.viewport(1920, 1080);
        cy.route('GET', '**/api/auth/organizaciones**', true).as('getOrganizaciones');
        cy.route('GET', '**/api/modules/rup/internacion/camas/**', true).as('getCama');
        cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.route('GET', '**/api/core/mpi/pacientes/**', paciente).as('getPaciente');
    });

    it('Verificar datos de cama', () => {
        cy.goto('/internacion/mapa-camas', token);
        cy.wait('@getCamas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tr').eq(1).find('td').eq(1).contains('ANDES').click();

        cy.wait('@getCama').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });



        // VERIF. NOMBRE
        cy.get('plex-detail section div').eq(1).find('div').should(($div) => {
            expect($div.get(0).innerText).to.equal(cama.cama.nombre);
        });

        // VERIF. ESTADO
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(0).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(cama.estados[0].estado.toLowerCase());
        });

        // VERIF. CENSABLE
        const censable = (cama.estados[0].esCensable) ? 'censable' : 'no censable'
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(1).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(censable);
        });

        // VERIF. GENERO
        const genero = (cama.estados[0].genero.term === 'género masculino') ? 'cama masculina' : 'cama femenina';
        cy.get('plex-detail section div').eq(1).find('plex-badge').eq(2).find('span').should(($span) => {
            expect($span.text().trim().toLowerCase()).to.equal(genero);
        });

        // VERIF. UNIDAD ORGANIZATIVA
        cy.get('plex-detail section div').eq(3).find('small').should(($span) => {
            expect($span.text()).to.equal(cama.estados[0].unidadOrganizativa.term);
        });

        // VERIF. ESPECIALIDADES
        let esp = '';
        for (const especialidad of cama.estados[0].especialidades) {
            esp = esp + especialidad.term;
        }

        cy.get('plex-detail section div').eq(4).find('small').should(($span) => {
            expect($span.text()).to.equal(esp);
        });

        // VERIF. TIPO CAMA
        cy.get('plex-detail section div').eq(5).find('small').should(($span) => {
            expect($span.text()).to.equal(cama.cama.tipoCama.term);
        });

        // VERIF. SECTOR
        cy.get('plex-detail section div').eq(6).find('small').should(($span) => {
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
        cy.get('plex-detail').eq(1).find('section').find('div').eq(1).find('div').should(($div) => {
            expect($div.get(0).innerText).to.equal(`${paciente.apellido}, ${paciente.nombre}`);
        });

        // VERIF. DOCUMENTO
        cy.get('plex-detail').eq(1).find('section').find('div').eq(1).find('div').eq(1).should(($div) => {
            expect($div.get(0).innerText.split('.').join("").trim()).to.equal(paciente.documento);
        });

        // VERIF. SEXO
        cy.get('plex-detail').eq(1).find('section').find('div').eq(4).find('small').should(($span) => {
            expect($span.text().toLowerCase()).to.equal(paciente.genero);
        });

        // VERIF. FECHA NACIMIENTO
        cy.get('plex-detail').eq(1).find('section').find('div').eq(5).find('small').should(($span) => {
            expect($span.text()).to.equal(moment(paciente.fechaNacimiento).format('DD/MM/YYYY'));
        });
    });
});


