context('PUCO', () => {
    before(() => {
        cy.seed();
        cy.task('database:create:paciente', { template: 'validado', nombre: 'paciente', apellido: 'andes', documento: 123456789 });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/puco');
    });

    it('should llamar a la api', () => {
        let respuesta = [{
            "tipoDocumento": "DNI",
            "dni": 45687,
            "transmite": "S",
            "nombre": "PERSONA OSECAC",
            "codigoFinanciador": 126205,
            "idFinanciador": "5a7c837274342a1a5221dd06",
            "financiador": "OBRA SOCIAL DE LOS EMPLEADOS DE COMERCIO Y ACTIVIDADES CIVILES",
            "version": "2019-06-01T00:00:00.000Z"
        }];
        cy.route('GET', '**/api/modules/obraSocial/profe/?dni=45687&periodo=**', respuesta).as('consulta');

        cy.get('div[class="buscador"] input').first().type('45687');

        cy.wait('@consulta').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('verificar datos de un paciente', () => {
        cy.plexText('placeholder="Ingrese DNI"', 123456789);
        cy.get('table tbody tr td').contains(' MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES ');
        cy.get('table tbody tr td').contains('ANDES PACIENTE');

    });
})