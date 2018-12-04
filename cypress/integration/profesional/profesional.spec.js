/// <reference types="Cypress" />

context('Aliasing', () => {
    let token
    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
        })
    })

    // beforeEach(() => {
    //     cy.viewport(1280, 720)

    //     cy.visit(Cypress.env('BASE_URL') + '/tm/profesional', {
    //         onBeforeLoad: (win) => {
    //             win.sessionStorage.setItem('jwt', token);
    //         }
    //     });
    // })

    // it('búsqueda de profesional matriculado', () => {
    // cy.server();
    //     // ingreso los valores en cada uno de los filtros
    //     cy.get('plex-int[label="Documento"] input').type('41f6a3asd78f2').should('have.value', '4163782'); // verifico que no se pueda ingresar letras
    //     cy.get('plex-text[label="Apellido"] input').first().type('judzik');
    //     cy.get('plex-text[label="Nombre"] input').first().type('nilda bet');
    //     cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
    //     // selecciono a Nilda Bethy Judzik de la tabla de resultados (primer resultado)
    //     cy.get('tbody').find('tr').first().click();

    //     // valido que el sidebar haya traído todos los datos
    //     cy.get('plex-layout-sidebar strong').should('contain', 'JUDZIK, NILDA BETHY');
    //     cy.get('plex-layout-sidebar').should('contain', '4.163.782');
    //     cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-info"]').should('have.text', 'Matriculado');
    //     cy.get('plex-layout-sidebar').should('contain', '11/01/1941 | ' + Cypress.moment().diff('11/01/1941', 'years') + ' años');
    //     cy.get('plex-layout-sidebar').should('contain', 'Femenino');
    //     cy.get('plex-layout-sidebar').should('contain', '27041637825');
    //     cy.get('plex-layout-sidebar').should('contain', 'FARMACEUTICO - Matrícula: 681');
    // });

    // it('búsqueda de profesional no matriculado', () => {
    //     cy.server();
    //     // ingreso los valores en cada uno de los filtros
    //     cy.get('plex-int[label="Documento"] input').type('17f4s"29as39').should('have.value', '1742939'); // verifico que no se pueda ingresar letras
    //     cy.get('plex-text[label="Apellido"] input').first().type('ESpoSito');
    //     cy.get('plex-text[label="Nombre"] input').first().type('alicia beatriz');
    //     cy.wait(2000); // espero 2s para que se carguen los resultados en la tabla
    //     // selecciono a Alicia Beatriz Esposito de la tabla de resultados (primer resultado)
    //     cy.get('tbody').find('tr').first().click();

    //     // valido que el sidebar haya traído todos los datos
    //     cy.get('plex-layout-sidebar strong').should('contain', 'ESPOSITO, ALICIA BEATRIZ');
    //     cy.get('plex-layout-sidebar').should('contain', '1.742.939');
    //     cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-warning"]').should('have.text', 'No Matriculado');
    //     cy.get('plex-layout-sidebar').should('contain', '12/12/1995 | ' + Cypress.moment().diff('12/12/1995', 'years') + ' años');
    //     cy.get('plex-layout-sidebar').should('contain', 'Femenino');
    //     cy.get('plex-layout-sidebar').should('contain', '1217429393');
    //     cy.get('plex-layout-sidebar').should('contain', 'Médico - Matrícula: 2');
    //     cy.get('plex-layout-sidebar').should('contain', 'Citogenética (R) - Matrícula: 412');
    //     cy.get('plex-layout-sidebar').should('contain', 'Bioquímica y Nutrición (R) - Matrícula: 533');

    // });

    it('crear profesional no matriculado, sin validar', () => {
        cy.server();

        cy.visit(Cypress.env('BASE_URL') + '/tm/profesional/create', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.get('plex-text[label="Nombre"] input').first().type('Pedro');
        cy.get('plex-text[label="Apellido"] input').first().type('Ramirez');
        cy.get('plex-int[label="Número de Documento"] input').type('11111fd111').should('have.value', '11111111'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('05/11/1991{enter}');

        cy.get('plex-phone[label="Número"] input').type('29945876as12').should('have.value', '2994587612');
        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional no matriculado existente en renaper', () => {
        cy.server();
        cy.visit(Cypress.env('BASE_URL') + '/tm/profesional/create', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });

        cy.get('plex-int[label="Número de Documento"] input').type('3588fs799af8').should('have.value', '35887998'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');

        cy.get('plex-layout-sidebar plex-button[label="Validar con servicios de Renaper"]').click();
        cy.wait(10000);

        // cy.get('plex-text[label="Nombre"] input').should('have.attr', 'readonly', true); // cypress no da soporte todavia a readonly
        cy.get('plex-text[label="Nombre"] input').should('have.value', 'Daniel Ivan');
        cy.get('plex-text[label="Apellido"] input').should('have.value', 'SZUBAN MANFREDI');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').should('have.value', '05/03/1991');

        cy.get('plex-phone[label="Número"] input').type('29945576as12').should('have.value', '2994557612');
        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional no matriculado no existente en renaper', () => {
        cy.server();
        cy.visit(Cypress.env('BASE_URL') + '/tm/profesional/create', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });

        cy.get('plex-int[label="Número de Documento"] input').type('15e654f898').should('have.value', '15654898'); // verifico que no se pueda ingresar letras
        // cy.should('not', 'plex-layout-sidebar plex-button[label="Validar con servicios de Renaper"]');
        // cy.get('plex-layout-sidebar').not.find();
        cy.get('plex-layout-sidebar').should('not.contain', 'plex-button[label="Validar con servicios de Renaper"]');
        cy.get('plex-select[label="Sexo"] input').type('femenino{enter}');
        cy.get('plex-layout-sidebar').find('plex-button[label="Validar con servicios de Renaper"]'); // aparece el boton despues de ingresar documento y sexo

        cy.get('plex-layout-sidebar plex-button[label="Validar con servicios de Renaper"]').click();
        cy.wait(10000);
        cy.contains('El profesional no se encontró en RENAPER');
        cy.get('button[class="swal2-confirm btn btn-warning"]').click();

        cy.get('plex-text[label="Nombre"] input').first().type('Julieta');
        cy.get('plex-text[label="Apellido"] input').first().type('Rodriguez');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('05/12/1987{enter}');
        cy.get('plex-bool[label="No posee ningún tipo de contacto"] input[type="checkbox"]').check({
            force: true
        }).should('be.checked');
        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional duplicado', () => {
        cy.server();

        cy.visit(Cypress.env('BASE_URL') + '/tm/profesional/create', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }
        });
        cy.get('plex-text[label="Nombre"] input').first().type('Pedro');
        cy.get('plex-text[label="Apellido"] input').first().type('Ramirez');
        cy.get('plex-int[label="Número de Documento"] input').type('11111fd111').should('have.value', '11111111'); // verifico que no se pueda ingresar letras
        cy.get('plex-select[label="Sexo"] input').type('masculino{enter}');
        cy.get('plex-datetime[label="Fecha de nacimiento"] input').type('05/11/1991{enter}');

        cy.get('plex-phone[label="Número"] input').type('29945876as12').should('have.value', '2994587612');

        cy.get('plex-button[label="Guardar"]').click();
        cy.contains('El profesional que está intentando guardar ya se encuentra cargado');
        cy.get('button[class="swal2-confirm btn btn-warning"]').click();
        cy.contains('El profesional que está intentando guardar ya se encuentra cargado');
    });

})