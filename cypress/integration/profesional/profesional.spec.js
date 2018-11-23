/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    beforeEach(() => {
        cy.viewport(1280, 720)

        cy.visit(Cypress.env('BASE_URL') + '/tm/profesional', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
    })

    it('búsqueda de profesional matriculado', () => {
        cy.server();
        // ingreso los valores en cada uno de los filtros
        cy.get('plex-int[label="Documento"] input').type('41f6a3asd78f2').should('have.value', '4163782'); // verifico que no se pueda ingresar letras
        cy.get('plex-text[label="Apellido"] input').first().type('judzik');
        cy.get('plex-text[label="Nombre"] input').first().type('nilda bet');
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        // selecciono a Nilda Bethy Judzik de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'JUDZIK, NILDA BETHY');
        cy.get('plex-layout-sidebar').should('contain', '4.163.782');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-info"]').should('have.text', 'Matriculado');
        cy.get('plex-layout-sidebar').should('contain', '11/01/1941 | ' + Cypress.moment().diff('11/01/1941', 'years') + ' años');
        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '27041637825');
        cy.get('plex-layout-sidebar').should('contain', 'FARMACEUTICO - Matrícula: 681');
    });

    it('búsqueda de profesional no matriculado', () => {
        cy.server();
        // ingreso los valores en cada uno de los filtros
        cy.get('plex-int[label="Documento"] input').type('17f4s"29as39').should('have.value', '1742939'); // verifico que no se pueda ingresar letras
        cy.get('plex-text[label="Apellido"] input').first().type('ESpoSito');
        cy.get('plex-text[label="Nombre"] input').first().type('alicia beatriz');
        cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
        // selecciono a Alicia Beatriz Esposito de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'ESPOSITO, ALICIA BEATRIZ');
        cy.get('plex-layout-sidebar').should('contain', '1.742.939');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-warning"]').should('have.text', 'No Matriculado');
        cy.get('plex-layout-sidebar').should('contain', '12/12/1995 | ' + Cypress.moment().diff('12/12/1995', 'years') + ' años');
        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '1217429393');
        cy.get('plex-layout-sidebar').should('contain', 'Médico - Matrícula: 2');
        cy.get('plex-layout-sidebar').should('contain', 'Citogenética (R) - Matrícula: 412');
        cy.get('plex-layout-sidebar').should('contain', 'Bioquímica y Nutrición (R) - Matrícula: 533');

    });
})