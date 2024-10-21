/// <reference types="Cypress" />

const complete = (dto) => {
    if (dto.fecha) {
        cy.plexDatetime('label="Fecha"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha"', { text: dto.fecha, skipEnter: true });
    }

    if (dto.horaInicio) {
        cy.plexDatetime('label="Inicio"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Inicio"', { text: dto.horaInicio, skipEnter: true });
    }

    if (dto.horaFin) {
        cy.plexDatetime('label="Fin"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fin"', { text: dto.horaFin, skipEnter: true });
    }

    if (dto.descripcion) {
        cy.plexText('label="Descripción"', dto.descripcion);
    }

    if (dto.cantidadTurnos) {
        cy.plexInt('label="Cantidad de Turnos"', dto.cantidadTurnos);
    }

    if (dto.accesoDirectoDelDia) {
        cy.plexInt('name="accesoDirectoDelDia"', dto.accesoDirectoDelDia);
    }

    if (dto.bloque) {
        if (dto.bloque.horaInicio) {
            cy.plexDatetime('label="Hora Inicio"', dto.bloque.horaInicio);
        }

        if (dto.bloque.horaFin) {
            cy.plexDatetime('label="Hora Fin"', dto.bloque.horaFin);
        }

        if (dto.bloque.cantidadTurnos) {
            cy.plexInt('label="Cantidad de Turnos"', dto.bloque.cantidadTurnos);
        }

        if (dto.bloque.accesoDirectoDelDia) {
            cy.plexInt('name="accesoDirectoDelDia"', dto.bloque.accesoDirectoDelDia);
        }
    }
}

context('Planificar Agendas con Turnos', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.goto('/citas/gestor_agendas', token);
        cy.plexButton("Crear agenda").click();
        cy.intercept('POST', '**/api/modules/turnos/agenda**', req => { delete req.headers['if-none-match'] }).as('create');
        cy.intercept('GET', '**/api/modules/turnos/espacioFisico**', req => { delete req.headers['if-none-match'] }).as('espacios');
        cy.intercept('GET', '**/api/core/tm/profesionales**', req => { delete req.headers['if-none-match'] }).as('profesionales');
        cy.intercept('GET', '**/api/modules/turnos/agenda**', req => { delete req.headers['if-none-match'] }).as('agendas');
        cy.intercept('POST', '**/api/modules/turnos/agenda/clonar/**', req => { delete req.headers['if-none-match'] }).as('clonar');
    });

    it('Guardar agenda del día con un solo bloque', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00",
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.plexSelect('name="modelo.profesionales"').type('{backspace}');
        cy.plexSelectAsync('name="modelo.profesionales"', 'JAZMIN', '@profesionales', 0);

        cy.wait('@agendas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.plexSelectAsync('name="espacioFisico"', 'consultorio 1', '@espacios', 0);

        cy.wait('@agendas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        complete({
            descripcion: 'Consulta de medicina general',
            cantidadTurnos: 7,
            accesoDirectoDelDia: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.toast('success', 'La agenda se guardó correctamente');
    });

    it('Guardar y Clonar agenda del día con un solo bloque', () => {

        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        complete({
            cantidadTurnos: 7,
            accesoDirectoDelDia: 7,
        });
        cy.plexButton("Guardar y clonar").click();
        let fecha;
        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq('planificacion');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(7);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(7);
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(response.body.bloques[0].tipoPrestaciones[0].term).to.be.eq('consulta de medicina general');
            fecha = response.body.horaInicio;
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.wait('@agendas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });
        if (cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@agendas').then(({ response }) => {
                expect(response.statusCode).to.be.eq(200)
            });
        }
        cy.get('table tr td').contains(Cypress.moment().add(1, 'days').format('D')).click({ force: true });
        cy.plexButtonIcon("check").click();
        cy.swal('confirm');
        cy.wait('@clonar');
        cy.contains('La Agenda se clonó correctamente');
        cy.swal('confirm');
        cy.wait('@agendas');
    });

    it('Guardar agenda con más de un bloque', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        cy.plexDatetime('label="Hora Inicio"', { clear: true });
        cy.plexDatetime('label="Hora Fin"', { clear: true });

        complete({
            bloque: {
                horaInicio: "10:00",
                horaFin: "11:00",
                cantidadTurnos: 7,
                accesoDirectoDelDia: 7,
            },
        });

        cy.wait(1000);

        cy.plexButtonIcon('plus').click();

        complete({
            bloque: {
                horaInicio: "11:00",
                horaFin: "12:00",
                cantidadTurnos: 7,
                accesoDirectoDelDia: 7,
            }
        });

        cy.plexButton("Guardar").click();


        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');

    });

    it('Guardar agenda con dos bloques con distintas prestaciones', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de clinica médica');

        cy.plexDatetime('label="Hora Inicio"', { clear: true });
        cy.plexDatetime('label="Hora Fin"', { clear: true });

        complete({
            bloque: {
                horaInicio: "10:00",
                horaFin: "11:00",
                cantidadTurnos: 7,
                accesoDirectoDelDia: 7,
            },
        });

        cy.get('plex-layout-main').plexButtonIcon('plus').click();
        cy.get('plex-layout-main plex-list').find('plex-item').contains('10:00')

        complete({
            bloque: {
                horaInicio: "11:00",
                horaFin: "12:00",
                cantidadTurnos: 7,
                accesoDirectoDelDia: 7,
            }
        });

        cy.get('plex-layout-sidebar').find('plex-grid').find('plex-bool').eq(1).click();

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda del día con un bloque fuera de horario', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00",
        });

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        cy.plexDatetime('label="Hora Inicio"', { clear: true });
        cy.plexDatetime('label="Hora Fin"', { clear: true });

        complete({
            bloque: {
                horaInicio: "10:00",
                horaFin: "14:00",
                cantidadTurnos: 7,
                accesoDirectoDelDia: 7,
            },
        });

        cy.contains('Está fuera de los límites de la agenda');
    });
})