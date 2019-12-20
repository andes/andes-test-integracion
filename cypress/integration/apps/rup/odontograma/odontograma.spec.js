describe('RUP - Odontograma', () => {
    let token;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente', {documento: 123456789});
        });
    })

    beforeEach(() => {
        cy.server();
        const fixtures = [];
        cy.fixture('odontograma-piezas-dentales.json').then(json => {
            json.forEach(e => fixtures.push(e));
        });
        // Stub

        cy.route('**/api/core/term/snomed/expression?expression=**', fixtures).as('snomedExpression');
        cy.route('GET', '**/api/modules/rup/frecuentesProfesional?tipoPrestacion**').as('frecuentesProfesional');
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');

        cy.goto('/rup/crear/fueraAgenda', token);
    })

    it('Seleccion simple de caras de diente', () => {
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'Consulta de odontología').click({ force: true });
        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', 123456789);
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('123456789').click();
        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@frecuentesProfesional').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });


        cy.wait('@snomedExpression').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.plexButton('Limpiar selección').click();
    })

    it('Seleccion multiple de caras de diente', () => {
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'Consulta de odontología').click({ force: true });
        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', 123456789);
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('123456789').click();

        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@frecuentesProfesional').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });


        cy.wait('@snomedExpression').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);
        
        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click( { force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });
        cy.plexButton('Limpiar selección').click();
    })

    it('Guardar odontograma', () => {
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'Consulta de odontología').click({ force: true });
        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', 123456789);
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('123456789').click();

        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@frecuentesProfesional').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });


        cy.wait('@snomedExpression').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);
        
        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click( { force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });
        cy.plexButton('Guardar consulta de odontología').click({ force: true });
    })

    it('Registrar Tratamiento de conducto', () => {
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'Consulta de odontología').click({ force: true });
        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', 123456789);
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('123456789').click();

        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@frecuentesProfesional').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });


        cy.wait('@snomedExpression').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);
        
        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click( { force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });


        cy.get('.mdi-plus').eq(1).click();

        cy.get('.badge').contains('diente 18');
        cy.get('.badge').contains('diente 14');
        cy.get('.badge').contains('diente 11');
        cy.get('.badge').contains('diente 26');


        cy.plexButton('Guardar consulta de odontología').click({ force: true });
    })

  
    it('Desvincular Caras', () => {
        cy.plexSelectType('label="Seleccione el tipo de prestación"', 'Consulta de odontología').click({ force: true });
        cy.plexButton('SELECCIONAR PACIENTE').click();
        cy.plexText('name="buscador"', 123456789);
        cy.wait('@searchPaciente');
        cy.get('paciente-listado').find('td').contains('123456789').click();

        cy.plexButton('INICIAR PRESTACIÓN').click();

        cy.wait('@frecuentesProfesional').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });


        cy.wait('@snomedExpression').then((xhr) => {
            cy.get('.mdi-plus').first().click();
        });

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click( { force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });

        cy.get('.mdi-plus').eq(1).click();

        cy.get('.badge').contains('diente 14').next().click({ force: true });
        cy.plexButton('Quitar relación').click();
        cy.get('.badge').contains('diente 14').should('not.exist');
    })
})