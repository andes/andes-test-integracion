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

    if (dto.cantidadTurnos) {
        cy.plexInt('label="Cantidad de Turnos"', dto.cantidadTurnos);
    }

    if (dto.accesoDirectoDelDia) {
        cy.plexInt('name="accesoDirectoDelDia"', dto.accesoDirectoDelDia);
    }

    if (dto.accesoDirectoProgramado) {
        cy.plexInt('name="accesoDirectoProgramado"', dto.accesoDirectoProgramado);
    }

    if (dto.reservadoGestion) {
        cy.plexInt('name="reservadoGestion"', dto.reservadoGestion);
    }

    if (dto.reservadoProfesional) {
        cy.plexInt('name="reservadoProfesional"', dto.reservadoProfesional);
    }

    if (dto.cupoMobile) {
        cy.plexInt('name="cupoMobile"', dto.cupoMobile);
    }

    if (dto.cantidadSimultaneos) {
        cy.plexInt('name="cantidadSimultaneos"', dto.cantidadSimultaneos);
    }

    if (dto.cantidadBloque) {
        cy.plexInt('name="cantidadBloque"', dto.cantidadBloque);
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
    });

    it('Guardar agenda con turnos programados', () => {
        complete({
            fecha: Cypress.moment().add(1, 'days').format('DD/MM/YYYY'),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoProgramado: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Crear agenda con turnos programados y turnos mobile', () => {

        complete({
            fecha: Cypress.moment().add(1, 'days').format('DD/MM/YYYY'),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoProgramado: 7,
        });

        cy.plexBool('label="Ventanilla virtual"', true);

        complete({
            cupoMobile: 4,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda con turnos del dia y pacientes simultáneos', () => {
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

        cy.plexBool('label="Pacientes simultáneos"', true);

        complete({
            cantidadSimultaneos: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda con turnos del dia y citas por segmento', () => {
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

        cy.plexBool('label="Citar por segmento"', true);

        complete({
            cantidadBloque: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda con turnos reservados con llave', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            reservadoGestion: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda con turnos reservados para profesional', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            reservadoProfesional: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda del día con menos turnos de los asignados', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00",
        });

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoDelDia: 2,
        });

        cy.contains('Falta clasificar');
    });

    it('Guardar agenda del día con más turnos de los asignados', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00",
        });

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoDelDia: 90,
        });

        cy.contains('La cantidad de turnos asignados es mayor a la cantidad disponible');
    });
});
