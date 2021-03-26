/// <reference types="Cypress" />

context('Ficha Epidemiológica', () => {
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente',
            {
                _id: '605ddc37b2f5356afea60a05',
                template: 'validado',
                nombre: 'PRUEBA',
                apellido: 'EPIDEMIO',
                documento: 33650500
            });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/epidemiologia/buscador-ficha-epidemiologica', token);
        cy.route('GET', '**api/modules/forms/forms-epidemiologia/formEpidemiologia?**').as('getFicha');
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
    })

    it('Buscar ficha entre dos fechas', () => {
        cy.plexDatetime('name="fechaDesde"', '25/03/2021');
        cy.plexDatetime('name="fechaHasta"', '26/03/2021');
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });

    it('Buscar ficha por tipo', () => {
        cy.plexSelectType('label="Tipo de ficha"', 'covid19').click()
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });

    it('Buscar ficha por paciente', () => {
        cy.plexText('name="buscador"', '33650500');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq('EPIDEMIO');
            expect(xhr.response.body[0].nombre).to.be.eq('PRUEBA');
        });
        cy.get('paciente-listado plex-item').contains("33.650.500").click();
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });
})