context('TM organizacion', () => {
    let token
    before(() => {
        cy.seed();

        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {

        cy.server();
        cy.route('GET', '**/core/tm/organizaciones**').as('getEmails');
        cy.route('GET', '**/core/tm/organizaciones?**').as('getOrganizaciones');
        cy.route('PUT', '**/core/tm/organizaciones**').as('createEmail');
        cy.goto('/tm/organizacion', token);

    })

    it('crear email y guardar', () => {
        cy.plexText('label="Nombre"', 'castro');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton('Configuracion').click();

        cy.plexText('name="nombre"', 'walter');
        cy.plexText('name="email"', 'walter@gmail.com');
        cy.plexButton('Guardar').click();
        cy.contains('Aceptar').click();


    });

    it.only('crear dos emails y guardar', () => {
        cy.plexText('label="Nombre"', 'castro');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton('Configuracion').click();
        cy.plexText('name="nombre"', 'walter');
        cy.plexText('name="email"', 'walter@gmail.com');

        cy.plexButtonIcon('plus').click();

        cy.plexText('name="nombre"', 'rafael');
        cy.plexText('name="email"', 'rafael@gmail.com');
        cy.plexButton('Guardar').click();
        cy.contains('Aceptar').click();
    })

    it('crear email incompleto', () => {
        cy.plexText('label="Nombre"', 'castro');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton('Configuracion').click();
        cy.plexText('name="nombre"', 'walter');
        cy.plexText('name="email"', '');
        cy.plexButton('Guardar').click();

    })


})
