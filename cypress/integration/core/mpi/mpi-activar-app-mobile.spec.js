context('MPI-Registro App Mobile', () => {
    let token;
    let pacValidado, pacValidado2, pacValidado3;
    let pacienteApp;
    let sendMessage = [
        {
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
        }
    ];
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
        devices: [
        ],
        sendMessageCache: sendMessage
    }
    before(() => {
        cy.seed();
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
            pacValidado = p;
        });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
            pacValidado2 = p;
        });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => {
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
        cy.server();
    });

    it('activar app mobile en un paciente, sin guardar el paciente(click en cancelar) y verificar que los datos persistan', () => {
        let correo = 'prueba1@prueba.com';
        let celular = '2995290357';
        cy.plexText('name="buscador"', pacValidado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(pacValidado.documento).click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton('Gestión de App Mobile').click();
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}' + correo);
        cy.plexPhone('placeholder="Celular"', '{selectall}{backspace}' + celular);
        cy.plexButton('Activar App Mobile').click();
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('Se ha enviado el código de activación al paciente');
        cy.get('button').contains('Aceptar').click();
        cy.contains('Cuenta pendiente de activación por el usuario');
        cy.toast('info', 'Datos del paciente actualizados');
        cy.plexButton('Cancelar').click();
        // verificamos datos
        cy.plexText('name="buscador"', pacValidado.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(pacValidado.documento).click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nombre).to.be.eq(pacValidado.nombre);
            expect(xhr.response.body.apellido).to.be.eq(pacValidado.apellido);
            expect(xhr.response.body.documento).to.be.eq(pacValidado.documento);
        });
        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@findPacienteByID');
        cy.wait('@findPacienteByID');
        cy.plexButton('Gestión de App Mobile').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('Cuenta pendiente de activación por el usuario');
    });

    it('activar app mobile en un paciente validado', () => {
        let correo = 'activandoAppMobile@mail.com';
        let celular = '2995290357';
        cy.plexText('name="buscador"', pacValidado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').find('td').contains(pacValidado2.documento).click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexPhone('label="Número"', '{selectall}{backspace}2990000000');
        cy.plexButton('Gestión de App Mobile').click();
        cy.wait('@clickGestionApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}' + correo);
        cy.plexPhone('placeholder="Celular"', '{selectall}{backspace}' + celular);
        cy.plexButton('Activar App Mobile').click();
        // se envía código de activación al paciente y se lo actualliza en la BD
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.responseBody.message).to.be.eq("OK");
        });
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('Se ha enviado el código de activación al paciente');
        cy.get('button').contains('Aceptar').click();
        cy.contains('Cuenta pendiente de activación por el usuario');
        cy.toast('info', 'Datos del paciente actualizados');
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
        cy.get('paciente-listado').find('td').contains(pacValidado3.documento).click();

        cy.wait('@findPacienteByID').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton('Gestión de App Mobile').click();
        cy.plexText('placeholder="e-mail"', '{selectall}{backspace}' + correo);
        cy.plexPhone('placeholder="Celular"', '{selectall}{backspace}' + celular);
        cy.plexButton('Activar App Mobile').click();
        cy.wait('@clickActivarApp').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains('El mail ingresado ya existe, ingrese otro email');
        cy.get('button').contains('Aceptar').click();

    });
});
