/// <reference types="Cypress" />

context('Creacion de usuarios para profesionales', () => {
    let token;
    const documento = '325877758';
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.goto('/inscripcion/profesionales', token);
        cy.intercept('POST', '**api/modules/gestor-usuarios/usuarios/create').as('createUser');
        cy.intercept('GET', '**/api/modules/gestor-usuarios/usuarios?**').as('getUsuario');
        cy.intercept('PUT', '**/api/modules/gestor-usuarios/usuarios**').as('updateUsuario');
        cy.intercept('PUT', '**/api/core/tm/profesionales/actualizar').as('updateProfesional');
    })

    it('Crear usuario para profesional', () => {
        cy.task('database:create:services', {
            "name": "renaper",
            "type": "static-client",
            "configuration": {
                "idTramite": 562207580
            }
        });
        cy.intercept('POST', '**/api/core/tm/profesionales/validar').as('pacienteValidado');
        cy.plexText('name="nombre"', 'TEST');
        cy.plexText('name="apellido"', 'PRUEBA');
        cy.plexInt('name="documento"', documento);
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexDatetime('name="fechaNacimiento"', "01/05/2019");
        cy.plexButton("VALIDAR").click({ force: true });
        cy.wait('@pacienteValidado').then((xhr) => {
            expect(xhr.response.body.profesional.documento).to.be.eq(documento);
            expect(xhr.response.body.profesional.apellido).to.be.eq('PRUEBA');
            expect(xhr.response.body.profesional.sexo).to.be.eq('masculino');
        });
        cy.plexText('name="email"', 'prueba@gmail.com');

        cy.plexButton(" Nuevo Usuario ").click();
        cy.wait('@createUser').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.documento).to.be.eq(documento);
            expect(response.body.organizaciones[0].id).to.be.eq('59380153db8e90fe4602ec02');
        })
        cy.wait('@updateProfesional').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.documento).to.be.eq(documento);
        })
    })
})