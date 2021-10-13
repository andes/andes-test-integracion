/// <reference types="Cypress" />
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
                _id: '5a2fe52ac439d943662d0a4c',
                template: 'validado',
                nombre: 'Prueba',
                apellido: 'Seguimiento',
                documento: 2006892
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
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.route('GET', '**/api/core/tm/organizaciones?**').as('getOrganizaciones');
        cy.route('GET', '/api/core-v2/mpi/pacientes/**').as('paciente');


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
        cy.wait('@paciente');
        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);
        })
        cy.toast('success');
        cy.wait('@paciente');
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
        cy.plexText('name="documento"', validado.documento);
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento');
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq(validado.documento);
            expect(xhr.response.body[0].paciente.apellido).to.be.eq(validado.apellido);
        });

        cy.plexButtonIcon('pencil').click();
    });

    it('Asignar seguimiento y organización a un profesional', () => {
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexBool('name="all"', true);
        cy.plexButton('Asignar').click();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA USUARIO', '@getProfesionales', 0);
        cy.plexButton('Guardar').click();
        cy.toast('success').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].ultimaAsignacion.profesional.documento).to.be.eq('38906735');
        });
        cy.plexButtonIcon('pencil').click();
        cy.plexSelectType('label="Organización"').clearSelect();
        cy.plexSelectAsync('label="Organización"', 'HOSPITAL DE AREA PLOTTIER', '@getOrganizaciones', 0);
        cy.plexButton('Guardar').click();
        cy.login('38906735', 'asd', '57f67a7ad86d9f64130a138d').then(t => {
            token = t;
            cy.goto('/epidemiologia/seguimiento', token);
        });
        cy.plexText('label="Documento"', '2006892');
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.apellido).to.be.eq('Seguimiento');
            expect(xhr.response.body[0].paciente.documento).to.be.eq('2006892');

        });
    });
})