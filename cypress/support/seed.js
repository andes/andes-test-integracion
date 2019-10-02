Cypress.Commands.add('seed', () => {
    const develop = Cypress.env('ENVIRONMENT') === 'develop';
    if (develop) {
        cy.exec('npm run prod:reset');
    }
});

Cypress.Commands.add('createPaciente', (name, token) => {
    return cy.fixture(name).then((paciente) => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/mpi/pacientes',
            body: {
                paciente
            },
            headers: {
                Authorization: `JWT ${token}`
            }
        });
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

            if (agenda.bloques && agenda.bloques.length && agenda.bloques[0].turnos && agenda.bloques[0].turnos.length) {
                agenda.bloques[0].turnos[0].horaInicio = newFechaInicio;
            }
            if (agenda.sobreturnos && agenda.sobreturnos.length) {
                agenda.sobreturnos[0].horaInicio = newFechaInicio;
            }
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
        })
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

