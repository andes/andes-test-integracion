// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (usuario, password) => {
    let token;
    return cy.request('POST', Cypress.env('API_SERVER') + '/api/auth/login', { usuario, password }).then((response) => {
        token = response.body.token;
        return response = cy.request({
            url: Cypress.env('API_SERVER') + '/api/auth/organizaciones',
            method: 'GET',
            headers: {
                Authorization: 'JWT ' + token
            },
        }).then((response) => {
            let org = response.body[0];
            return response = cy.request({
                url: Cypress.env('API_SERVER') + '/api/auth/organizaciones',
                method: 'POST',
                headers: {
                    Authorization: 'JWT ' + token
                },
                body: { organizacion: org.id }
            }).then((response) => {
                return response.body.token;
            });
        });
    });
});

Cypress.Commands.add('createPaciente', (name, token) => {
    return cy.fixture(name).then((paciente) => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/mpi/pacientes',
            body: { paciente },
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('swal', (acction) => {
    return cy.get('div').then(($body) => {
        if ($body.hasClass('swal2-container')) {
            cy.get(`.swal2-${acction}`).click({ force: true })
        }
    });
})

Cypress.Commands.add('goto', (url, token) => {
    return cy.visit(Cypress.env('BASE_URL') + url, {
        onBeforeLoad: (win) => {
            win.sessionStorage.setItem('jwt', token);
        }
    });
});

Cypress.Commands.add('createAgenda', (name, daysOffset, horaInicioOffset, horaFinOffset, token) => {
    return cy.fixture(name).then((agenda) => {
        if (horaInicioOffset !== null) {
            let newDate = Cypress.moment().add(daysOffset, 'days'); //.format('YYYY-MM-DD');
            let newFechaInicio = Cypress.moment().set({
                'year': newDate.year(),
                'month': newDate.month(),
                'date': newDate.date(),
                'hour': Cypress.moment().add(daysOffset, 'hours').format('HH'),
                'minute': 0,
                'second': 0,
                'millisecond': 0
            });

            let newFechaFin = Cypress.moment().set({
                'year': newDate.year(),
                'month': newDate.month(),
                'date': newDate.date(),
                'hour': Cypress.moment().add(horaFinOffset, 'hours').format('HH'),
                'minute': 0,
                'second': 0,
                'millisecond': 0
            });
            agenda.bloques[0].horaInicio = newFechaInicio;
            agenda.bloques[0].horaFin = newFechaFin;
            if (!agenda.dinamica) {
                agenda.bloques[0].turnos[0].horaInicio = newFechaInicio;
            }
            agenda.fecha = newDate;
            agenda.horaInicio = newFechaInicio;
            agenda.horaFin = newFechaFin;
        } else { // no modifica la hora del json de la agenda, solo las fechas
            let newDate = Cypress.moment().add(daysOffset, 'days').format('YYYY-MM-DD');
            agenda.bloques[0].horaInicio = agenda.bloques[0].horaInicio.replace('2019-07-01', newDate);
            agenda.bloques[0].horaFin = agenda.bloques[0].horaFin.replace('2019-07-01', newDate);
            if (!agenda.dinamica) {
                agenda.bloques[0].turnos[0].horaInicio = agenda.bloques[0].turnos[0].horaInicio.replace('2019-07-01', newDate);
            }
            agenda.fecha = agenda.fecha.replace('2019-07-01', newDate);
            agenda.horaInicio = agenda.horaInicio.replace('2019-07-01', newDate);
            agenda.horaFin = agenda.horaFin.replace('2019-07-01', newDate);
        }
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/turnos/agenda',
            body: agenda,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('createAgenda48hs', (name, token) => {
    return cy.fixture(name).then((agenda) => {
        let newDate = Cypress.moment().add(2, 'days').format('YYYY-MM-DD');
        agenda.bloques[0].horaInicio = agenda.bloques[0].horaInicio.replace('2019-07-01', newDate);
        agenda.bloques[0].horaFin = agenda.bloques[0].horaFin.replace('2019-07-01', newDate);
        agenda.bloques[0].turnos[0].horaInicio = agenda.bloques[0].turnos[0].horaInicio.replace('2019-07-01', newDate);
        // agenda.fecha = agenda.fecha.replace('2019-07-01', newDate);
        agenda.horaInicio = agenda.horaInicio.replace('2019-07-01', newDate);
        agenda.horaFin = agenda.horaFin.replace('2019-07-01', newDate);

        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/turnos/agenda',
            body: agenda,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});
Cypress.Commands.add('createSolicitud', (name, token) => {
    return cy.fixture(name).then((solicitud) => {
        let newDate = Cypress.moment().format('YYYY-MM-DD');
        solicitud.solicitud.fecha = solicitud.solicitud.fecha.replace('2019-08-01', newDate);
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/rup/prestaciones',
            body: solicitud,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});