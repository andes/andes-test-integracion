/// <reference types="Cypress" />

context('Ficha Epidemiológica', () => {
    let validado;
    let validado2;
    let validado3;
    let validado4;
    let validado5;

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
        cy.task('database:create:paciente', {
            template: 'validado', direccion: 'Brown 1200'
        }).then(p => {
            validado2 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado', direccion: 'Luna de cuarzo 1674'
        }).then(p => {
            validado3 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado', direccion: 'Juan B justo 1234'
        }).then(p => {
            validado4 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado', direccion: 'calle falsa 123'
        }).then(p => {
            validado5 = p;
        });

    })

    beforeEach(() => {
        cy.server();
        cy.goto('/epidemiologia/ficha-epidemiologica', token);
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**api/modules/forms/forms-epidemiologia/formEpidemiologia').as('registroFicha');
        cy.route('PATCH', '**api/modules/forms/forms-epidemiologia/formEpidemiologia/?**').as('actualizarFicha');
        cy.route('GET', '**/api/modules/rup/prestaciones/**').as('getPrestacion');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestacion');
        cy.route('GET', '**/api/modules/cda/paciente/**').as('getCDA');
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**api/modules/forms/forms-epidemiologia/formEpidemiologia?**').as('getFicha');
        cy.route('GET', '**/api/modules/forms/forms-epidemiologia/formsHistory?**').as('getHistory')
    })

    it('crear nueva ficha covid19', () => {
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
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'LAMP{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('LAMP (NeoKit)', 'Se detecta genoma de SARS-CoV-2{enter}');
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.toast('success', 'Su ficha fue registrada correctamente');
    });

    it('crear nueva ficha covid19, registrar concepto covid positivo y editarla', () => {
        let semanaPasada = Cypress.moment().add('days', -7).format('DD/MM/YYYY');
        cy.plexText('name="buscador"', validado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado2.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado2.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado2.apellido).click();
        cy.plexDropdown('label="NUEVA FICHA"').click().get('a').contains('covid19').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}299');
        cy.plexSelectTypeDinamico('Clasificacion', 'Caso sospechoso{enter}');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'LAMP{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('LAMP (NeoKit)', 'Se detecta genoma de SARS-CoV-2{enter}');
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Su ficha fue registrada correctamente');
        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexButton(' Guardar consulta de seguimiento de paciente asociado a infección por COVID-19 ').click();

        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getCDA').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.toast('success', 'Prestación guardada correctamente');
        cy.plexButton(' Validar consulta de seguimiento de paciente asociado a infección por COVID-19 ').click();

        cy.get('button').contains('CONFIRMAR').click();

        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('button').contains(' EPIDEMIOLOGÍA ').click();

        cy.plexText('name="buscador"', validado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado2.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado2.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado2.apellido).click();
        cy.plexButtonIcon('pencil').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}200');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', '{selectall}{backspace}' + semanaPasada);
        cy.plexButton('Registrar ficha').click();
        cy.wait('@actualizarFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.toast('success', 'Su ficha fue actualizada correctamente');

    });

    it('crear nueva ficha covid19 con contactos estrechos', () => {
        cy.plexText('name="buscador"', validado4.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado4.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado4.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado4.apellido).click();
        cy.plexDropdown('label="NUEVA FICHA"').click().get('a').contains('covid19').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}22');
        cy.plexSelectTypeDinamico('Clasificacion', 'Caso sospechoso{enter}');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'antigeno{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('antígeno', 'Reactivo{enter}');
        cy.plexButton('Agregar contacto').click();
        cy.plexText('name="apellidoNombre"', 'nuevo contacto');
        cy.plexText('name="dni"', '22222222');
        cy.plexPhone('name="telefono"', '4444444');
        cy.plexText('name="domicilio"', 'irigoyen 1200');
        cy.plexDatetime('name="fechaContacto"', cy.today());
        cy.plexSelectType('name="tipoContacto"', 'Social{enter}');
        cy.plexIcon('mas').click();
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.toast('success', 'Su ficha fue registrada correctamente');
    });

    it('crear nueva ficha covid19 y verificar historial', () => {
        cy.plexText('name="buscador"', validado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado3.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado3.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado3.apellido).click();
        cy.plexDropdown('label="NUEVA FICHA"').click().get('a').contains('covid19').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}22');
        cy.plexSelectTypeDinamico('Clasificacion', 'Caso sospechoso{enter}');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'LAMP{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('LAMP (NeoKit)', 'Se detecta genoma de SARS-CoV-2{enter}');
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.toast('success', 'Su ficha fue registrada correctamente');
        cy.goto('/epidemiologia/buscador-ficha-epidemiologica', token);
        cy.plexText('name="buscador"', validado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado3.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado3.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado3.apellido).click();
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('history').click();
        cy.wait('@getHistory').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq(validado3.documento);
            expect(xhr.response.body[0].paciente.id).to.be.eq(validado3._id);
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
        })
    });

    it('carga parcial ficha covid19', () => {
        cy.plexText('name="buscador"', validado5.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq(validado5.apellido);
            expect(xhr.response.body[0].nombre).to.be.eq(validado5.nombre);
        });
        cy.get('paciente-listado plex-item').contains(validado5.apellido).click();
        cy.plexDropdown('label="NUEVA FICHA"').click().get('a').contains('covid19').click();
        cy.plexInputDinamico('phone', 'telefono', '{selectall}{backspace}22');
        cy.plexSelectTypeDinamico('Clasificacion', 'Caso sospechoso{enter}');
        cy.plexDateTimeDinamico('fecha de inicio de 1º síntoma', cy.today());
        cy.plexSelectTypeDinamico('segunda clasificación', 'LAMP{enter}');
        cy.plexSelectTypeDinamico('tipo de muestra', 'Aspirado{enter}');
        cy.plexSelectTypeDinamico('LAMP (NeoKit)').should('exist');
        cy.plexBool('label="Cargar ficha parcial"', true);
        cy.get('plex-label').contains('La seccion no se encuentra disponible');
        cy.get('label').contains('LAMP (NeoKit)').should('not.exist');
        cy.plexButton('Registrar ficha').click();
        cy.wait('@registroFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        })
        cy.toast('success', 'Su ficha fue registrada correctamente');
    });
})