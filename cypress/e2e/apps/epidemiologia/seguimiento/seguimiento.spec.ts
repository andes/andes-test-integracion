context('Seguimiento Epidemiológico', () => {
    let validado;
    let token;

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
            }).then(p => {
                validado = p;
            });
    })

    beforeEach(() => {
        cy.goto('/epidemiologia/seguimiento', token);
        cy.intercept('GET', '**/api/core/tm/organizaciones?**').as('organizaciones');
        cy.intercept('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.intercept('POST', '**api/modules/forms/forms-epidemiologia/formEpidemiologia').as('registroFicha');
        cy.intercept('POST', '**/api/modules/rup/prestaciones').as('postPrestacion');
        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**', req => {
            delete req.headers['if-none-match']
        }).as('patchPrestacion');
        cy.intercept('GET', '**/api/modules/rup/prestaciones/**', req => {
            delete req.headers['if-none-match']
        }).as('getPrestacion');
        cy.intercept('GET', '**/api/modules/seguimiento-paciente/seguimientoPaciente?**', req => {
            delete req.headers['if-none-match']
        }).as('buscarSeguimiento');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.intercept('GET', '**/api/core/tm/organizaciones?**').as('getOrganizaciones');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('paciente');


    })

    it('Iniciar seguimiento epidemiologico', () => {
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.wait(500)    // porque el listado tarda mil horas en cargarse

        cy.plexButton('Iniciar').click();
        cy.wait('@postPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.wait('@getPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
        cy.get('plex-tabs').contains('Buscador').click({ force: true });
        cy.RupBuscarConceptos('Seguimiento telefónico', 'SUGERIDOS');
        cy.seleccionarConcepto(0);
        cy.plexButton('Guardar consulta de seguimiento de paciente asociado a infección por COVID-19').click();

        cy.wait('@patchPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.wait('@paciente');
        cy.wait('@getPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.length).to.be.eq(0);
        });
        cy.toast('success');

        cy.url().should('include', 'validacion');
        cy.wait(1000)
        cy.plexButton(' Validar consulta de seguimiento de paciente asociado a infección por COVID-19 ').click();
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patchPrestacion').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        })

        cy.plexButton('SEGUIMIENTO').click({ force: true });

        cy.plexSelectType('label="Estado"', 'Pendiente');
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.plexSelectType('label="Estado"').clearSelect();
        cy.plexSelectType('label="Estado"', 'Seguimiento');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexText('name="documento"', validado.documento);
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.data[0].paciente.documento).to.be.eq(validado.documento);
            expect(response.body.data[0].paciente.apellido).to.be.eq(validado.apellido);
        });

        cy.plexButtonIcon('pencil').click();
    });

    it('Asignar seguimiento y organización a un profesional', () => {
        cy.plexSelectType('label="Prioridad"', 'MODERADO');
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento');
        cy.plexBool('name="all"', true);
        cy.plexButton('Asignar').click();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexButton('Guardar').click();
        cy.toast('success').click({ force: true });
        cy.wait('@buscarSeguimiento').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            cy.plexButtonIcon('pencil').click();
        });
        cy.plexSelectType('label="Organización"').clearSelect();
        cy.plexSelectAsync('label="Organización"', 'HOSPITAL DE AREA PLOTTIER', '@getOrganizaciones', 0);
        cy.plexButton('Guardar').click();
        cy.login('38906735', 'asd', '57f67a7ad86d9f64130a138d').then(t => {
            token = t;
            cy.goto('/epidemiologia/seguimiento', token);
        });
        cy.wait('@buscarSeguimiento').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.data[0].paciente.apellido).to.be.eq('EPIDEMIO');
            expect(response.body.data[0].paciente.documento).to.be.eq('33650500');
        });
    });
})