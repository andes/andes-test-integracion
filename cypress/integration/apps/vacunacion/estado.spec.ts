/// <reference types="Cypress" />

context('Estado de vacunacion COVID-19', () => {
    let token;
    let pacienteSinVacuna;
    let pacienteConVacuna;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacienteSinVacuna = p;
        });
        cy.task('database:create:paciente',
            {
                _id: '5a2fe52ac439d943662d0a6f',
                template: 'validado',
                nombre: 'Paciente',
                apellido: 'Vacuna',
                documento: 10522442
            }).then(p => {
                pacienteConVacuna = p;
            });
    });

    beforeEach(() => {
        cy.goto('/vacunacion/estado', token);
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.intercept('GET', '**/api/modules/vacunas/vacunas-pacientes?**').as('getVacunas');
    })

    it('Verificar estado de vacunación de un paciente sin vacunas', () => {
        cy.plexText('name="buscador"', pacienteSinVacuna.documento);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body[0].documento).to.be.eq(pacienteSinVacuna.documento);
        });
        cy.get('paciente-listado').contains(pacienteSinVacuna.apellido).click();
        cy.wait('@getVacunas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.length).to.be.eq(0);
        });
    })

    it('Verificar estado de vacunación de un paciente con vacunas', () => {
        cy.fixture('mpi/paciente-validado2').as('paciente_validado2');
        cy.plexText('name="buscador"', pacienteConVacuna.documento);
        cy.wait('@busquedaPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body[0].documento).to.be.eq(pacienteConVacuna.documento);
        });
        cy.get('paciente-listado').contains(pacienteConVacuna.apellido).click();
        cy.wait('@getVacunas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body[0].aplicaciones.length).to.be.eq(2);
        })
    })
})