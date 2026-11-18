context("TM - Farmacia", () => {
    let token
    before(() => {
        cy.seed();

        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {

    })

    it('Visualizar farmacia en el listado junto con sus datos en sidebar.', () => {
        cy.goto('/tm/farmacia', token);
        cy.get('tbody tr').first().click();

        // DETALLE DE FARMACIA
        cy.get('plex-layout-sidebar').contains('CEC');
        cy.get('plex-layout-sidebar').contains('30-58049510-5');
        cy.get('plex-layout-sidebar').contains('CENTRO DE EMPLEADOS DE COMERCIO DE NEUQUEN');
        cy.get('plex-layout-sidebar').contains('VALERIA BENITA DIAZ');
        cy.get('plex-layout-sidebar').contains('715');
        cy.get('plex-layout-sidebar').contains('535/17');
        cy.get('plex-layout-sidebar').contains('Farmacias Sociales');
        cy.get('plex-layout-sidebar').contains('1115/21');
        cy.get('plex-layout-sidebar').contains('4420-107633/12');
        cy.get('plex-layout-sidebar').contains('2021-01041817/21');
        cy.get('plex-layout-sidebar').contains('CAJA N° 16');

        //FECHAS DE HABILITACIÓN
        cy.get('plex-layout-sidebar').contains('21/08/2021');
        cy.get('plex-layout-sidebar').contains('03/09/2023');
        cy.get('plex-layout-sidebar').contains('03/09/2025');

        //FARMACÉUTICOS AUXILIARES
        cy.get('plex-layout-sidebar').contains('SARA PATRICIA IVANA');
        cy.get('plex-layout-sidebar').contains('570');
        cy.get('plex-layout-sidebar').contains('793/10');

        // HORARIOS
        cy.get('plex-layout-sidebar').contains('LUNES A VIERNES DE 8: 00 A 16:00');

        // CONTACTOS
        cy.get('plex-layout-sidebar').contains('4493552');
        cy.get('plex-layout-sidebar').contains('valebdiaz@hotmail.com');
    })

    it('Filtros de farmacias.', () => {
        cy.goto('/tm/farmacia', token);
        cy.plexText('label="Denominación"', 'CEC');
        cy.plexText('label="Razon Social"', 'CENTRO DE EMPLEADOS DE COMERCIO');
        cy.plexText('label="CUIT"', '30-58049510-5');
        cy.plexText('label="D.T Responsable"', 'VALERIA BENITA DIAZ');
        cy.plexSelectType('label="Asociado"', 'Farmacias Sociales').click({ force: true });
        cy.get('tbody tr').eq(0).contains('CEC');
        cy.get('tbody tr').eq(0).contains('30-58049510-5');
        cy.get('tbody tr').eq(0).contains('CENTRO DE EMPLEADOS DE COMERCIO DE NEUQUEN');
        cy.get('tbody tr').eq(0).contains('VALERIA BENITA DIAZ');
        cy.get('tbody tr').eq(0).contains('715');
        cy.get('tbody tr').eq(0).contains('535/17');
        cy.get('tbody tr').eq(0).contains('Farmacias Sociales');
    })
});
