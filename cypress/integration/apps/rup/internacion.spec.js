context('Internacion - Mapa de Camas', () => {
    let prefix = 'http://localhost:4200'
    let token
    before(() => {
        cy.seed();
        cy.server();
        cy.task('database:create:usuario', { template: 'internacion-estadistica' }).then(user => {
            cy.login(user.usuario, user.password, user.organizaciones[0]._id).then(t => {
                token = t;
                cy.createPaciente('paciente-rup', token);
            });
        });
    });

    beforeEach(() => {
        cy.visit(prefix + '/internacion/mapa-camas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }

        });
        cy.url().should('match', /internacion[./]mapa-camas/);

        cy.route('GET', '**/api/modules/rup/internacion/camas**').as('getCamas')
        cy.wait('@getCamas');

        cy.route('GET', '**/api/core/tm/organizaciones/**').as('getOrganizacion')

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
        }]).as('expGenero');

        cy.route('GET', '/api/core/term/snomed/expression?expression=^2061000013108**', [{
            "conceptId": "77777",
            "term": "Equipamiento 1",
        }]).as('expEquipamiento');

        cy.route('POST', '**/api/modules/rup/internacion/camas**').as('createCama')
    })

    it('Agregar cama', () => {
        cy.contains('Aceptar').click();

        cy.wait(3000)
        cy.plexButton('AGREGAR CAMA').click();

        cy.wait('@getOrganizacion');
        cy.url().should('match', /internacion[./]cama/);

        cy.plexText('label="Nombre"', 'Cama 666');
        cy.plexSelectType('label="Unidad organizativa"', 'morgue')
        cy.plexSelectAsync('label="Tipo de cama"', 'Cam', '@expTipoDeCama', 0);
        cy.plexSelectAsync('label="Equipamiento"', 'Equi', '@expEquipamiento', 0);
        cy.plexSelectAsync('label="Especialidad/es"', 'Enf', '@expEspecialidad', 0);
        cy.plexSelectAsync('label="Genero"', 'Masc', '@expGenero', 0);
        cy.plexSelectType('label="Ubicación"', 'ala')

        cy.plexButton('GUARDAR').click();
        cy.wait('@createCama');

    });
});
