context('MPI-Registro App Mobile', () => {
    let token;
    let pacValidado, pacValidado2, pacValidado3;
    let pacienteApp;
    let sendMessage = [{
        status: "success",
        _id: "5e564977fc9e408a8954ae5b",
        message: "Estimado FLORES, MARA AZUL, Su código de activación para ANDES Mobile es: 041643",
        phone: null,
        email: "probando_mail@mail.com",
        template: "emails/active-app-code.html",
        extras: {
            username: "FLORES, MARA AZUL",
            codigo: "041643"
        },
        subject: "ANDES :: Código de activación",
        from: "undefined",
        createdAt: "2020-02-26T10:33:27.503Z",
        updatedAt: "2020-02-26T10:33:33.580Z",
        scheduledAt: "2020-02-26T10:33:27.503Z"
    }];
    let pacienteAppAux = {
        activacionApp: true,
        nombre: "MARA AZUL",
        apellido: "FLORES",
        email: "probando_mail@mail.com",
        telefono: "2994069933",
        nacionalidad: "Argentina",
        documento: "22243525",
        fechaNacimiento: "1976-08-28T04:00:00.000Z",
        sexo: "femenino",
        genero: "femenino",
        devices: [],
        sendMessageCache: sendMessage
    }
    before(() => {
        cy.seed();
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacValidado = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacValidado2 = p;
        });
        cy.task('database:create:paciente', {
            template: 'validado'
        }).then(p => {
            pacValidado3 = p;
        });
        cy.task('database:create:paciente-app', pacienteAppAux).then(pacienteapp => {
            pacienteApp = pacienteapp;
        });
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    });

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.route('GET', '**/api/core/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('POST', '**api/modules/mobileApp/create/**').as('clickActivarApp');
        cy.route('GET', '**api/core/mpi/pacientes/**').as('findPacienteByID');
        cy.route('PUT', '**api/core/mpi/pacientes/**').as('putPaciente');
        cy.route('PATCH', '**api/core/mpi/pacientes/**').as('patchPaciente');
        cy.route('GET', '**api/modules/mobileApp/check/**').as('clickGestionApp');
        cy.route('GET', '**api/modules/mobileApp/email/**').as('verificarEmail');
        cy.server();
    });

    it('activar app mobile en un paciente, sin guardar el paciente(click en volver) y verificar que los datos persistan', () => {
        let correo = 'prueba1@prueba.com';
        let celular = '2995290357';
        cy.plexText('name="buscador"', pacValidado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').plexButtonIcon('pencil').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexTab(' datos de contacto ').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexPhone('label="Número"', '{selectall}{backspace}' + celular);
        cy.plexText('name="email"', '{selectall}{backspace}' + correo);

        // esperamos repuesta de verificación de mail válido (no repetido)
        cy.wait('@verificarEmail').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.length).to.be.eq(0);
        });

        cy.plexBadge('Su dirección ha sido validada, puede iniciar el proceso de activación');

        cy.plexButton(' Activar app ').click();
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Se ha enviado el código de activación al paciente');
        cy.toast('info', 'Datos del paciente actualizados');
        cy.plexButton(' Reenviar Código ');

        cy.plexBadge('Cuenta pendiente de activación por el usuario');
        cy.plexButton(' Volver ').click();

        // verificamos datos
        cy.plexText('name="buscador"', pacValidado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').plexButtonIcon('pencil').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq(pacValidado.nombre);
            expect(xhr.response.body.apellido).to.be.eq(pacValidado.apellido);
            expect(xhr.response.body.documento).to.be.eq(pacValidado.documento);
        });
        cy.plexTab(' datos de contacto ').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.log(xhr);
        });

        cy.plexButton('Reenviar Código');

        // cy.plexBadge('Cuenta pendiente de activación por el usuario');
    });

    it('activar app mobile en un paciente validado', () => {
        let correo = 'activandoAppMobile@mail.com';
        let celular = '2995290357';
        cy.plexText('name="buscador"', pacValidado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').plexButtonIcon('pencil').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTab(' datos de contacto ').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexPhone('label="Número"', '{selectall}{backspace}' + celular);
        cy.plexText('name="email"', '{selectall}{backspace}' + correo);

        // esperamos repuesta de verificación de mail válido (no repetido)
        cy.wait('@verificarEmail').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.length).to.be.eq(0);
        });
        cy.plexBadge('Su dirección ha sido validada, puede iniciar el proceso de activación');

        cy.plexButton(' Activar app ').click();
        // se envía código de activación al paciente y se lo actualiza en la BD
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.message).to.be.eq("OK");
        });
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.toast('success', 'Se ha enviado el código de activación al paciente');

        cy.toast('info', 'Datos del paciente actualizados');
        cy.plexButton('Reenviar Código');

        cy.plexBadge('Cuenta pendiente de activación por el usuario');
        cy.plexButton('Guardar').click();

        cy.wait('@putPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq(pacValidado2.estado);
            expect(xhr.response.body.nombre).to.be.eq(pacValidado2.nombre);
            expect(xhr.response.body.apellido).to.be.eq(pacValidado2.apellido);
        });
        cy.contains('Los datos se actualizaron correctamente');
        cy.get('button').contains('Aceptar').click();
    });

    it('activar app mobile en un paciente de un correo que ya exista cargado a otro paciente', () => {
        let correo = pacienteApp.email; // usamos el correo de un paciente ya creado en la BD
        let celular = '2995290357';
        cy.plexText('name="buscador"', pacValidado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado plex-item').plexButtonIcon('pencil').click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTab(' datos de contacto ').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexPhone('label="Número"', '{selectall}{backspace}' + celular);
        cy.plexText('name="email"', '{selectall}{backspace}' + correo);

        // esperamos repuesta de verificación de mail válido (no repetido)
        cy.wait('@verificarEmail').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            //al menos un pacienteApp con ese mail debe traer
            expect(xhr.responseBody.length).to.be.gt(0);
        });
        cy.plexButton(' Activar app ');
        //  cy.plexBadge('Su dirección no ha podido ser validada, dirección ya utilizada');


    });
});