context('PUCO', () => {
    let pacientes = [];
    let token;
    before(() => {
        cy.seed();
        cy.task('database:create:paciente', { template: 'validado', nombre: 'andes', apellido: 'paciente', documento: 123456789 }).then(p => { pacientes.push(p) });
        cy.task('database:create:paciente', { template: 'temporal', nombre: 'andes', apellido: 'temporal', documento: 987654321 }).then(p => { pacientes.push(p) });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.server();
        cy.goto('/puco', token);
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
        cy.route('GET', '**/api/modules/obraSocial/puco/?dni=45687&periodo=**', respuesta).as('consulta');

        cy.plexInt('name="searchTerm"', '45687');

        cy.wait('@consulta').then(xhr => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    ['validado', 'temporal'].forEach((type, i) => {
        it('verificar datos de un paciente ' + type, () => {
            cy.route('GET', '**/api/modules/obraSocial/puco/**').as('buscadorPuco');
            cy.plexInt('name="searchTerm"', pacientes[i].documento);
            cy.wait('@buscadorPuco').then(xhr => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('table tbody tr td').contains('MUTUAL DE LOS MEDICOS MUNICIPALES DE LA CIUDAD DE BUENOS AIRES');
        });
    });

})