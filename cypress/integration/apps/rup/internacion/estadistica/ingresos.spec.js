const { permisosUsuario, factoryInternacion } = require('../utiles');

describe('Capa Estadistica - Ingresos', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();

        // CREA USUARIO
        cy.task('database:create:usuario', { permisos: [...permisosUsuario, 'internacion:rol:estadistica', 'internacion:ingreso'] }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;

                // CREA PACIENTES
                cy.task('database:seed:paciente').then(pacientesCreados => {
                    pacientes = pacientesCreados;

                    // CREA UN MUNDO IDEAL DE INTERNACION
                    factoryInternacion({ configCamas: [{ estado: 'disponible' }, { estado: 'ocupada', pacientes: [pacientes[0]] }] }).then(camasCreadas => {
                        return cy.goto('/internacion/mapa-camas', token);
                    });
                });
            });
        });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.route('GET', '**/api/auth/organizaciones**', true).as('getOrganizaciones');
        cy.route('GET', '/api/core/term/snomed/expression?expression=<<394733009&words=**', [{
            "conceptId": "1234",
            "term": "Enfermeria en Rehabilitación",
        }, {
            "conceptId": "666",
            "term": "Dolor",
        }]).as('expEspecialidad');
        cy.route('GET', '**/api/core/tm/ocupacion?nombre=**', [{
            "_id": "5c793679af78f1fa5d0a8e1e",
            "id": "5c793679af78f1fa5d0a8e1e",
            "nombre": "Abogado",
            "codigo": "131"
        }, {
            "_id": "5c793679af78f1fa5d0a8e1a",
            "id": "5c793679af78f1fa5d0a8e1a",
            "nombre": "Medico",
            "codigo": "132"
        }]).as('getOcupacion')
        cy.viewport(1920, 1080);
    });

    it('Ingreso completo cambiando paciente', () => {
        cy.plexButtonIcon('plus').click();

        cy.plexText('name="buscador"', pacientes[0].nombre);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody tr').first().click();

        cy.plexButtonIcon('arrow-left').click();

        cy.plexText('name="buscador"').clear();
        cy.plexText('name="buscador"', pacientes[1].nombre);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody tr').first().click();

        cy.plexSelectType('name="origen"', 'Emergencia');
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexText('name="motivo"', 'Estornudo');
        cy.plexSelectAsync('name="especialidad"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectType('label="Cobertura"', 'Ninguno');
        cy.plexSelectType('name="situacionLaboral"', 'No trabaja y no busca trabajo');
        cy.plexSelectAsync('name="ocupacionHabitual"', 'Abog', '@getOcupacion', 0);
        cy.plexSelectType('name="nivelInstruccion"', 'Ninguno');

        cy.plexButtonIcon('check').click();
        cy.wait(200);

        cy.contains('Paciente internado')
        cy.contains('Aceptar').click();
        cy.wait(200);
        cy.get('table tr').eq(1).find('td').find('plex-badge').find('span').should(($span) => {
            expect($span.text().trim()).to.equal('Ocupada');
        });
    });

    it('Editar ingreso', () => {
        cy.get('table tr').contains(pacientes[0].apellido).first().click();
        cy.wait(500);

        cy.get('plex-tabs ul li').eq(1).click();
        cy.get('plex-title[titulo="INGRESO"] div').eq(2).plexButtonIcon('pencil').click();

        cy.plexSelect('name="origen"').clearSelect();
        cy.plexSelectType('name="origen"', 'Emergencia');

        cy.plexSelect('name="profesional"').clearSelect();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexText('name="motivo"', 'Estornudo');
        cy.plexSelectAsync('name="especialidad"', 'Dol', '@expEspecialidad', 0);
        cy.plexSelectType('label="Cobertura"', 'Plan o Seguro publico');
        cy.plexSelectType('name="situacionLaboral"', 'Trabaja o está de licencia');
        cy.plexSelect('name="ocupacionHabitual"').clearSelect();
        cy.plexSelectAsync('name="ocupacionHabitual"', 'Med', '@getOcupacion', 0);
        cy.plexSelectType('name="nivelInstruccion"', 'Ninguno');

        cy.plexButtonIcon('check').click();
        cy.wait(200);
        cy.contains('Los datos se actualizaron correctamente')
        cy.contains('Aceptar').click();
    });
});