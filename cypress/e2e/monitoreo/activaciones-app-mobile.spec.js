/// <reference types="Cypress" />

context('Monitoreo de Activaciones app-mobile', () => {
    let token;
    let pacienteApp;
    let sendMessage = [
        {
            status: "success",
            _id: "5e564977fc9e408a8954ae5a",
            message: "Estimado RAMOS, MARA AZUL, Su código de activación para ANDES Mobile es: 041643",
            phone: null,
            email: "mail@mail.com",
            template: "emails/active-app-code.html",
            extras: {
                username: "RAMOS, MARA AZUL",
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
        id: "5e546977fc9e410a8954ad58",
        nombre: "MARA AZUL",
        apellido: "RAMOS",
        email: "mail@mail.com",
        telefono: "2994069933",
        nacionalidad: "Argentina",
        documento: "22247537",
        fechaNacimiento: "1956-08-28T04:00:00.000Z",
        sexo: "femenino",
        genero: "femenino",
        devices: [
            {
                _id: "5e564c45c285ab00b0d65b10",
                device_id: null,
                device_type: "Android 9",
                app_version: 344,
                session_id: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNmY1ZmQyNzJhNGI5OGFjNGJmNjJlZCIsInVzdWFyaW8iOnsibm9tYnJlIjoiTUFSw41BIENFTEVTVEUgUkFNT1MiLCJlbWFpbCI6ImNlbGVucW5AaG90bWFpbC5jb20ifSwicGVybWlzb3MiOltdLCJwYWNpZW50ZXMiOlt7InJlbGFjaW9uIjoicHJpbmNpcGFsIiwiX2lkIjoiNWU1NjQ5NzdmYzllNDA4YTg5NTRhZTU5IiwiaWQiOiI1ZGI4M2FjZTVlMzUxNTBlNGIwOTRkZmYiLCJhZGRlZEF0IjoiMjAyMC0wMi0yNlQxMDozMzoyNy40ODVaIn1dLCJvcmdhbml6YWNpb24iOm51bGwsImFjY291bnRfaWQiOiI1ZTU2NDk3N2ZjOWU0MDhhODk1NGFlNTgiLCJ0eXBlIjoicGFjaWVudGUtdG9rZW4iLCJpYXQiOjE1ODQzNTczMzAsImV4cCI6MTU4NTIyMTMzMH0.LHZq7-5bwhKw3ubYGuMfgiIDzYJtUDwW5IN4rqHosMg",
                createdAt: "2020-02-26T10:45:25.307Z",
                updatedAt: "2020-03-16T11:15:31.187Z"
            }
        ],
        sendMessageCache: sendMessage
    }
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.task('database:create:paciente-app', pacienteAppAux).then(pacienteapp => {
                pacienteApp = pacienteapp;
                cy.log(pacienteApp);
            });
        });

    });

    beforeEach(() => {
        cy.server();
        cy.goto('/monitoreo/monitor-activaciones', token);
        cy.route('GET', '**api/modules/mobileApp/pacienteApp**').as('busqueda');
    });

    it('buscar paciente por documento y verificar que no existe', () => {
        cy.plexText('name="buscador"', '11111111');
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.contains(' No hay resultados que coincidan con los filtros de búsqueda ');
    });

    it('buscar paciente por documento que exista y verificar que devuelva datos', () => {
        cy.plexText('name="buscador"', pacienteApp.documento);

        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table').find('tbody tr').should('have.length', 1);
        cy.get('tbody').find('td').contains(pacienteApp.documento);
        cy.get('tbody').find('td').contains(pacienteApp.nombre);
        cy.get('tbody').find('td').contains(pacienteApp.sexo);
    });

    it('buscar paciente por documento que exista, seleccionarlo del listado y verificar que cargue sus datos en el panel lateral', () => {
        cy.plexText('name="buscador"', pacienteApp.documento);
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);

        });
        cy.get('tbody').find('td').contains(pacienteApp.documento);
        cy.get('tbody').find('tr').first().click();
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.documento);
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.nombre);
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.apellido);
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.sexo);
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.devices[0].device_type);
    });


    it('buscar paciente por documento que exista, seleccionarlo del listado y verificar que cargue su historial ', () => {
        cy.route('GET', '**api/modules/mobileApp/sendMessageCache?email**', sendMessage).as('sendMessage');

        cy.plexText('name="buscador"', pacienteApp.documento);
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('tbody').find('td').contains(pacienteApp.documento);
        cy.get('tbody').find('tr').first().click();
        cy.get('plex-layout-sidebar').should('contain', pacienteApp.documento);
        cy.wait('@sendMessage').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar').find('td').contains(sendMessage[0].email);
        cy.get('plex-layout-sidebar').find('td').contains(sendMessage[0].status);
        cy.get('plex-layout-sidebar').find('td').contains(sendMessage[0].extras.codigo);
    });


})