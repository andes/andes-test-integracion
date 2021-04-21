/// <reference types="Cypress" />

context('Inscripción profesionales COVID 19', () => {
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

    it('Actualizar permisos para profesional con matricula vigente', () => {

        cy.task('database:create:services', {
            "name": "renaper",
            "type": "static-client",
            "configuration": {
                "idTramite": 562207580
            }
        });


        // cy.fixture('profesionales/profesional-validado-renaper').as('paciente_validado');
        cy.route('POST', '**/api/core/tm/profesionales/validar').as('pacienteValidado');


        cy.plexText('name="documento"', '30643636');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexInt('name="nroTramite"', '562207580');
        cy.plexButton("VALIDAR").click();
        cy.wait('@pacienteValidado').then((xhr) => {
            expect(xhr.response.body.profesional.documento).to.be.eq('30643636');
            expect(xhr.response.body.profesional.apellido).to.be.eq('Huenchuman');
            expect(xhr.response.body.profesional.sexo).to.be.eq('femenino');
        });
        cy.plexBool('name="aceptaPermisos"', true);
        cy.wait('@getUsuario').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].usuario).to.be.eq(30643636);
        });
        cy.plexButton("Certificado de vacuna COVID19 ").click();
        cy.wait('@updateProfesional').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.documento).to.be.eq('30643636');
        })
    })

    it('Crear usuario para profesional con matricula vigente', () => {

        // cy.fixture('profesionales/profesional-validado-renaper2').as('paciente_validado2');
        cy.route('POST', '**/api/core/tm/profesionales/validar').as('pacienteValidado2');
        cy.plexText('name="documento"', '4466777');
        cy.plexSelectType('label="Seleccione sexo"', 'femenino');
        cy.plexInt('name="nroTramite"', '562207580');
        cy.plexButton("VALIDAR").click();
        cy.wait('@pacienteValidado2').then((xhr) => {
            expect(xhr.response.body.profesional.documento).to.be.eq('4466777');
            expect(xhr.response.body.profesional.apellido).to.be.eq('PEREZ');
            expect(xhr.response.body.profesional.sexo).to.be.eq('Femenino');
        });
        cy.plexText('name="email"', 'prueba@gmail.com');
        cy.plexBool('name="aceptaPermisos"', true);
        cy.wait('@getUsuario').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        });
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

    it('Validar profesional con matricula vencida', () => {
        // cy.fixture('profesionales/profesional-validado-renaper3').as('paciente_validado3');
        cy.route('POST', '**/api/core/tm/profesionales/validar').as('pacienteValidado3');
        cy.plexText('name="documento"', '34934522');
        cy.plexSelectType('label="Seleccione sexo"', 'masculino');
        cy.plexInt('name="nroTramite"', '562207580');
        cy.plexButton("VALIDAR").click();
        cy.wait('@pacienteValidado3').then((xhr) => {
            expect(xhr.response.body.profesional.documento).to.be.eq('34934522');
            expect(xhr.response.body.profesional.apellido).to.be.eq('BOTTA');
            expect(xhr.response.body.profesional.sexo).to.be.eq('masculino');
        });
        cy.get('plex-badge').contains(' Su matrícula no se encuentra vigente');
        cy.plexButton("Renovar matrícula ");
    })

})