/// <reference types="Cypress" />
context('Seguimiento Epidemiológico', () => {
    let validado;
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente', {
            template: 'validado', direccion: 'Irigoyen 1200'
        }).then(p => {
            validado = p;
        });

    })


    beforeEach(() => {
        cy.server();
        cy.goto('/epidemiologia/seguimiento', token);
        cy.route('GET', '**/api/core/tm/organizaciones?**').as('organizaciones');
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**api/modules/forms/forms-epidemiologia/formEpidemiologia').as('registroFicha');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('postPrestacion');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestacion');
        cy.route('GET', '**/api/modules/rup/prestaciones/**').as('getPrestacion');
        cy.route('GET', '**/api/modules/seguimiento-paciente/seguimientoPaciente?**').as('buscarSeguimiento');
    })

    it('Iniciar seguimiento epidemiologico', () => {
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton('Iniciar').click();
        cy.wait('@postPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.RupBuscarConceptos('Seguimiento telefónico', 'SUGERIDOS');
        cy.seleccionarConcepto(0);
        cy.plexButton('Guardar consulta de seguimiento de paciente asociado a infección por COVID-19').click();

        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        })
        cy.toast('success');
        cy.plexButton('Validar consulta de seguimiento de paciente asociado a infección por COVID-19').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })

        cy.plexButton('SEGUIMIENTO').click();

        cy.plexSelectType('label="Estado"', 'Pendiente');
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectType('label="Estado"').clearSelect();
        cy.plexSelectType('label="Estado"', 'Seguimiento');
        cy.plexText('name="documento"', '35900029');
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento');
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('35900029');
            expect(xhr.response.body[0].paciente.apellido).to.be.eq('ROGER');
        });

        cy.plexButtonIcon('pencil').click();
    })
})