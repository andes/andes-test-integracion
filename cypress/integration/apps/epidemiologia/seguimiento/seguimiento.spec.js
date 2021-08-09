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
        cy.goto('/epidemiologia/ficha-epidemiologica', token);
        cy.route('GET', '**/api/core/tm/organizaciones?**').as('organizaciones');
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**api/modules/forms/forms-epidemiologia/formEpidemiologia').as('registroFicha');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('postPrestacion');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestacion');
        cy.route('GET', '**/api/modules/rup/prestaciones/**').as('getPrestacion');
        cy.route('GET', '**/api/modules/seguimiento-paciente/seguimientoPaciente?**').as('buscarSeguimiento');
    })

    it('crear nueva ficha covid19 caso confirmado - iniciar seguimiento', () => {
        cy.plexText('name="buscador"', validado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado.apellido).click();
        cy.plexDropdown('label="NUEVA FICHA"').click().get('a').contains('covid19').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}22');
        cy.plexSelectTypeDinamico('Clasificacion', 'Caso sospechoso{enter}');
        cy.plexSelectTypeDinamico('tipo de busqueda', 'Activa{enter}');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'LAMP{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('LAMP (NeoKit)', 'Se detecta genoma de SARS-CoV-2{enter}');
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Su ficha fue registrada correctamente');

        cy.goto('/epidemiologia/seguimiento', token);
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(0);

        });
        cy.plexSelectType('label="Organización"').clearSelect();
        cy.plexSelectAsync('label="Organización"', 'CENTRO DE SALUD NUEVA ESPERANZA', '@organizaciones', 0);
        cy.plexText('name="documento"', validado.documento);
        cy.plexButton('Buscar').click();
        cy.wait('@buscarSeguimiento');
        cy.wait('@buscarSeguimiento').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton('Iniciar Seguimiento').click();
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
        cy.toast('success').click();
        cy.plexButton('Validar consulta de seguimiento de paciente asociado a infección por COVID-19').click({ force: true });
        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })

        cy.plexButton('SEGUIMIENTO').click();

        cy.plexSelectType('label="Organización"').clearSelect();
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
    })
})