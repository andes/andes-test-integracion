Cypress.Commands.add('seed', () => {
    const develop = Cypress.env('ENVIRONMENT') === 'develop';
    if (develop) {
        cy.exec('npm run prod:reset');
    } else {
        cy.cleanDB();
    }
});

const collectionList = ['paciente', 'agenda', 'prestaciones'];

Cypress.Commands.add('cleanDB', (collection) => {
    if (!collection) {
        collection = collectionList;
    } else if (!Array.isArray(collection)) {
        collection = [collection];
    }
    collection.forEach((item) => {
        cy.task('database:drop', item);
    });
    return cy.wait(1000);
});

Cypress.Commands.add('createPaciente', (name, token) => {
    return cy.fixture(name).then((paciente) => {
        return cy.request({
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

Cypress.Commands.add('createPrestacion', (name, token, options = {}) => {
    return cy.fixture(name).then((prestacion) => {
        const { fecha } = options;
        if (fecha) {
            prestacion.solicitud.fecha = fecha.format();
            prestacion.ejecucion.fecha = fecha.format();
            prestacion.estados.forEach(e => {
                e.createdAt = fecha.format();
            })
        }
        return cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/rup/prestaciones',
            body: prestacion,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('createProfesional', (name, token) => {
    return cy.fixture(name).then((profesional) => {
        return cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/core/tm/profesionales',
            body: {
                profesional
            },
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('createAgenda', (fixtureName, daysOffset, horaInicioOffset, horaFinOffset, token) => {
    return cy.fixture(fixtureName).then((agenda) => {
        if (horaInicioOffset !== null) {
            let newDate = Cypress.moment().add(daysOffset, 'days'); //.format('YYYY-MM-DD');
            let newFechaInicio = Cypress.moment().set({
                'year': newDate.year(),
                'month': newDate.month(),
                'date': newDate.date(),
                'hour': Cypress.moment().add(horaInicioOffset, 'hours').format('HH'),
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
            if (daysOffset !== null) {
                let newDate = Cypress.moment().add(daysOffset, 'days').format('YYYY-MM-DD');
                agenda.bloques[0].horaInicio = agenda.bloques[0].horaInicio.replace('2019-07-01', newDate);
                agenda.bloques[0].horaFin = agenda.bloques[0].horaFin.replace('2019-07-01', newDate);
                if (!agenda.dinamica) {
                    agenda.bloques[0].turnos[0].horaInicio = agenda.bloques[0].turnos[0].horaInicio.replace('2019-07-01', newDate);
                }
                // agenda.fecha = agenda.fecha.replace('2019-07-01', newDate);
                agenda.horaInicio = agenda.horaInicio.replace('2019-07-01', newDate);
                agenda.horaFin = agenda.horaFin.replace('2019-07-01', newDate);
            }
        }
        return cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/turnos/agenda',
            body: agenda,
            failOnStatusCode: false,
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

Cypress.Commands.add('createAgendaPaciente', (name, daysOffset, horaInicioOffset, horaFinOffset, paciente, token) => {
    return cy.fixture(name).then((agenda) => {
        agenda.bloques[0].turnos[0].paciente = paciente;
        if (horaInicioOffset !== null) {
            let newDate = Cypress.moment().add(daysOffset, 'days'); //.format('YYYY-MM-DD');
            let newFechaInicio = Cypress.moment().set({
                'year': newDate.year(),
                'month': newDate.month(),
                'date': newDate.date(),
                'hour': Cypress.moment().add(horaInicioOffset, 'hours').format('HH'),
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
            agenda.horaInicio = agenda.horaInicio.replace('2019-07-01', newDate);
            agenda.horaFin = agenda.horaFin.replace('2019-07-01', newDate);
        }
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + '/api/modules/turnos/agenda',
            body: agenda,
            failOnStatusCode: false,
            headers: {
                Authorization: `JWT ${token}`
            }
        })
    });
});

Cypress.Commands.add('createSolicitud', (name, token) => {
    return cy.fixture(name).then((solicitud) => {
        let newDate = Cypress.moment().toDate();
        solicitud.solicitud.fecha = newDate;
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


Cypress.Commands.add('createTurno', (fixtureName, idTurno, idBloque, idAgenda, paciente, token) => {
    return cy.fixture(fixtureName).then((turno) => {
        if (paciente.id) {
            turno.paciente = paciente;
        }
        cy.request({
            method: 'PATCH',
            url: Cypress.env('API_SERVER') + `/api/modules/turnos/turno/${idTurno}/${idBloque}/${idAgenda}`,
            body: turno,
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});

Cypress.Commands.add('createReglaTOP', (fixtureName, token) => {
    return cy.fixture(fixtureName).then((reglas) => {
        cy.request({
            method: 'POST',
            url: Cypress.env('API_SERVER') + `/api/modules/top/reglas`,
            body: { reglas },
            headers: {
                Authorization: `JWT ${token}`
            }
        });
    });
});