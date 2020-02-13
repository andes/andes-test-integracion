
context('Crear/editar agendas', () => {
    let token;

    before(() => {
        cy.seed();
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/api/auth/login**').as('loginMatriculaciones');
        cy.route('POST', '**/api/auth/organizaciones**').as('organizaciones');
        cy.route('GET', '**/api/auth/organizaciones**').as('getOrganizaciones');
        cy.route('POST', '**api/modules/matriculaciones/agendaMatriculaciones**').as('nuevaAgenda');
        cy.goto('/matriculaciones/');
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Acceso fiscalización').click();
        cy.plexInt('name="usuario"').type('30643636');
        cy.plexText('name="password"').type('asd');
        cy.plexButton('Iniciar sesión').click();
        cy.wait('@loginMatriculaciones');
        cy.wait('@getOrganizaciones');
        cy.contains(' HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON ').click();
        cy.wait('@organizaciones');
    });

    it('Crear agenda', () => {
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Agenda').click();
        cy.plexSelectType('name="diasHabilitados"', 'Lunes');
        cy.plexSelectType('name="diasHabilitados"', 'Martes');
        cy.plexSelectType('name="diasHabilitados"', 'Miercoles');
        cy.plexSelectType('name="diasHabilitados"', 'Jueves');
        cy.plexSelectType('name="diasHabilitados"', 'Viernes');
        cy.plexDatetime('name="horarioInicioTurnos"', '08:00');
        cy.plexDatetime('name="horarioFinTurnos"', '10:00');
        cy.plexInt('name="duracionTurno"', '30');
        cy.plexButton('Guardar').click();
        cy.wait('@nuevaAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.duracionTurno).to.be.eq(30);
        });
        cy.toast('success', 'Realizado con exito');
    });

    it('Crear agenda y editarla', () => {
        cy.get('.mdi.mdi-menu').click();
        cy.contains(' Agenda').click();
        cy.plexSelectType('name="diasHabilitados"', 'Lunes');
        cy.plexSelectType('name="diasHabilitados"', 'Martes');
        cy.plexSelectType('name="diasHabilitados"', 'Miercoles');
        cy.plexSelectType('name="diasHabilitados"', 'Jueves');
        cy.plexSelectType('name="diasHabilitados"', 'Viernes');
        cy.plexDatetime('name="horarioInicioTurnos"', '08:00');
        cy.plexDatetime('name="horarioFinTurnos"', '10:00');
        cy.plexInt('name="duracionTurno"', '30');
        cy.plexButton('Guardar').click();
        cy.wait('@nuevaAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.duracionTurno).to.be.eq(30);
        });
        cy.toast('success', 'Realizado con exito');
        cy.plexButton('Agendas').click();
        cy.plexButtonIcon('pencil').click();
        cy.plexInt('name="duracionTurno"').clear();
        cy.plexInt('name="duracionTurno"', '40');
        cy.plexButton('Guardar').click();
        cy.wait('@nuevaAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(201);
            expect(xhr.response.body.duracionTurno).to.be.eq(40);
        });
        cy.toast('success', 'Realizado con exito');
    });
});
