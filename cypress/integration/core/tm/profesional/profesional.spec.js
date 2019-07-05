/// <reference types="Cypress" />

context('TM Profesional', () => {
    let token
    before(() => {
        cy.viewport(1280, 720);
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {

    })

    it.skip('crear profesional no matriculado, sin validar', () => { // TODO: se queda esperando el @create
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.route('POST', '**/core/tm/profesionales**').as('create');

        cy.get('plex-text[label="Nombre"] input').first().type('Pedro');
        cy.get('plex-text[label="Apellido"] input').first().type('Ramirez');
        cy.get('plex-int[label="Número de Documento"] input').type('11111fd111').should('have.value', '11111111'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('05/11/1991{enter}');

        cy.get('plex-phone[label="Número"] input').type('29945876as12').should('have.value', '2994587612');
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        // cy.contains('¡El profesional se creó con éxito!');
    });

    it.skip('crear profesional no matriculado existente en renaper', () => { // TODO: se queda esperando el @create
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.route('POST', '**/core/tm/profesionales**').as('create');
        cy.fixture('renaper-1').as('fxRenaper')
        cy.route('GET', '**/api/modules/fuentesAutenticas/renaper?documento=35887998&sexo=M', '@fxRenaper').as('renaper');


        cy.get('plex-int[label="Número de Documento"] input').type('3588fs799af8').should('have.value', '35887998'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');

        cy.get('plex-layout-sidebar plex-button[label="Validar con servicios de Renaper"]').click();
        cy.wait('@renaper');

        cy.get('plex-text[label="Nombre"] input').should('have.value', 'PRUEBA');
        cy.get('plex-text[label="Apellido"] input').should('have.value', 'PRUEBA');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').should('have.value', '09/03/1990');

        cy.get('plex-phone[label="Número"] input').type('29945576as12').should('have.value', '2994557612');
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.contains('¡El profesional se creó con éxito!');
    });

    it.skip('crear profesional no matriculado no existente en renaper', () => { // TODO: se queda esperando el @create
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.fixture('renaper-error').as('fxRenaper')
        cy.route('GET', '**/api/modules/fuentesAutenticas/renaper?documento=15654898&sexo=F', '@fxRenaper').as('renaper');
        cy.route('POST', '**/core/tm/profesionales**').as('create');

        cy.get('plex-int[label="Número de Documento"] input').type('15e654f898').should('have.value', '15654898');
        cy.get('plex-layout-sidebar').should('not.contain', 'plex-button[label="Validar con servicios de Renaper"]');

        cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');
        cy.get('plex-layout-sidebar').find('plex-button[label="Validar con servicios de Renaper"]');

        cy.get('plex-layout-sidebar plex-button[label="Validar con servicios de Renaper"]').click();
        cy.wait('@renaper');

        cy.contains('El profesional no se encontró en RENAPER');
        cy.swal('confirm')

        cy.get('plex-text[label="Nombre"] input').first().type('Julieta');
        cy.get('plex-text[label="Apellido"] input').first().type('Rodriguez');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('05/12/1987{enter}');
        cy.get('plex-bool[label="No posee ningún tipo de contacto"] input[type="checkbox"]').check({
            force: true
        }).should('be.checked');
        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.contains('¡El profesional se creó con éxito!');
    });

    it.skip('crear profesional duplicado', () => { // TODO: se queda esperando el @get
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.route('POST', '**/api/core/tm/profesionales?documento=4163782').as('get');

        cy.get('plex-text[label="Nombre"] input').first().type('ALICIA BEATRIZ');
        cy.get('plex-text[label="Apellido"] input').first().type('ESPOSITO');
        cy.get('plex-int[label="Número de Documento"] input').type('4163782').should('have.value', '4163782'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('12/12/1995{enter}');

        cy.get('plex-phone[label="Número"] input').type('29945876as12').should('have.value', '2994587612');

        cy.get('plex-button[label="Guardar"]').click();
        cy.wait('@get').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.body).to.have.length(1);
        });
        cy.contains('El profesional que está intentando guardar ya se encuentra cargado');
    });

    it('búsqueda de profesional matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales**').as('get');

        // ingreso los valores en cada uno de los filtros
        cy.get('plex-int[label="Documento"] input').type('44f6a6asd77f7').should('have.value', '4466777'); // verifico que no se pueda ingresar letras
        cy.get('plex-text[label="Apellido"] input').first().type('PEREZ');
        cy.get('plex-text[label="Nombre"] input').first().type('MARIA');
        cy.wait('@get');

        // selecciono a Nilda Bethy Judzik de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'PEREZ, MARIA');
        cy.get('plex-layout-sidebar').should('contain', '4.466.777');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-info"]').should('contain', 'Matriculado');

        // TEST INVIABLE cambia el valor con el paso del tiempo
        // cy.get('plex-layout-sidebar').should('contain', '11/01/1941 | ' + Cypress.moment().diff('11/01/1941', 'years') + ' años');

        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '27041637825');
        // cy.get('plex-layout-sidebar').should('contain', 'FARMACEUTICO - Matrícula: 681');
    });

    it('búsqueda de profesional no matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales**').as('get');
        cy.get('plex-text[label="Apellido"] input').first().type('PRUEBA');
        cy.get('plex-text[label="Nombre"] input').first().type('ALICIA');
        cy.wait('@get');

        // seleccionó a Usuario Prueba de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'PRUEBA, ALICIA');
        cy.get('plex-layout-sidebar').should('contain', '1.711.999');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-warning"]').should('contain', 'No Matriculado');
        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '1217429393');
        // cy.get('plex-layout-sidebar').should('contain', 'Médico - Matrícula: 2');
        // cy.get('plex-layout-sidebar').should('contain', 'Citogenética (R) - Matrícula: 412');
        // cy.get('plex-layout-sidebar').should('contain', 'Bioquímica y Nutrición (R) - Matrícula: 533');

    });

})