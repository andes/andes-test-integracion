const moment = require('moment')
const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Mapa Camas - Detalle de Cama', () => {
    let token;
    let paciente;
    let cama;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { permisos: [...permisosUsuario, 'internacion:rol:estadistica'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    paciente = pacientesCreados[0];

                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({
                        configCamas: [{ estado: 'ocupada', pacientes: [paciente], sector: '5c769884cfefcd5e80f7396e' }]
                    }).then(camasCreadas => {
                        cama = camasCreadas[0];
                        return cy.goto('/internacion/mapa-camas', token);
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.viewport(1920, 1080);
        cy.route('GET', '**/api/auth/organizaciones**', true).as('getOrganizaciones');
    });

    it('Verificar datos de cama', () => {
        cy.wait(500);

        cy.get('table tr').contains(paciente.apellido).first().click();
        cy.wait(500);

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
            esp = especialidad.term + ', ';
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

        // VERIF. ESTADO
        cy.get('plex-detail').eq(1).find('section').find('div').find('plex-badge').eq(0).find('span').should(($span) => {
            expect($span.text().trim()).to.equal(paciente.estado);
        });

        // VERIF. NOMBRE - APELLIDO PACIENTE
        cy.get('plex-detail').eq(1).find('section').find('div').eq(1).find('div').should(($div) => {
            expect($div.get(0).innerText).to.equal(`${paciente.apellido}, ${paciente.nombre}`);
        });

        // VERIF. DOCUMENTO
        cy.get('plex-detail').eq(1).find('section').find('div').eq(1).find('div').eq(1).should(($div) => {
            expect($div.get(0).innerText).to.equal(paciente.documento);
        });

        // VERIF. FECHA NACIMIENTO
        cy.get('plex-detail').eq(1).find('section').find('div').eq(4).find('small').should(($span) => {
            expect($span.text()).to.equal(moment(paciente.fechaNacimiento).format('DD/MM/YYYY'));
        });
    });
});


