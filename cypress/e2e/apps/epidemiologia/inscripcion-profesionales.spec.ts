/// <reference types="Cypress" />

context('Creacion de usuarios para profesionales', () => {
    let token;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/inscripcion/profesionales', token);
        cy.route('POST', '**api/modules/gestor-usuarios/usuarios/create').as('createUser');
        cy.route('GET', '**/api/modules/gestor-usuarios/usuarios?**').as('getUsuario');
        cy.route('PUT', '**/api/modules/gestor-usuarios/usuarios**').as('updateUsuario');
        cy.route('PUT', '**/api/core/tm/profesionales/actualizar').as('updateProfesional');
    })

    it('Crear usuario para profesional', () => {
        cy.task('database:create:services', {
            "name": "renaper",
            "type": "static-client",
            "configuration": {
                "idTramite": 562207580
            }
        });
        cy.route('POST', '**/api/core/tm/profesionales/validar').as('pacienteValidado');
        cy.plexText('name="nombre"', 'MARIA');
        cy.plexText('name="apellido"', 'PEREZ');
        cy.plexText('name="documento"', '4466777');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexDatetime('name="fechaNacimiento"', "01/01/1990");
        cy.plexButton("VALIDAR").click();
        cy.wait('@pacienteValidado').then((xhr) => {
            expect(xhr.response.body.profesional.documento).to.be.eq('4466777');
            expect(xhr.response.body.profesional.apellido).to.be.eq('PEREZ');
            expect(xhr.response.body.profesional.sexo).to.be.eq('femenino');
        });
        cy.plexText('name="email"', 'prueba@gmail.com');

        cy.plexButton(" Nuevo Usuario ").click();
        cy.wait('@createUser').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('4466777');
            expect(xhr.response.body.organizaciones[0].id).to.be.eq('59380153db8e90fe4602ec02');
        })
        cy.wait('@updateProfesional').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('4466777');
        })
    })
})