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

    if (dto.cantidadBloque) {
        cy.plexInt('name="cantidadBloque"', dto.cantidadBloque);
    }

    if (dto.cupoMaximo) {
        cy.plexInt('name="cupoMaximo"', dto.cupoMaximo);
    }
}

context('Planificacion Agendas', () => {
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
        cy.intercept('GET', '**/api/modules/rup/prestaciones**', req => { delete req.headers['if-none-match'] }).as('prestacionesRup');
        cy.intercept('GET', '**/api/modules/turnos/agenda**', req => { delete req.headers['if-none-match'] }).as('agendas');
        cy.intercept('GET', '**/api/modules/turnero/pantalla**', req => { delete req.headers['if-none-match'] }).as('pantallas');
        cy.intercept('PATCH', '**/api/modules/turnos/agenda/**', req => { delete req.headers['if-none-match'] }).as('edicionAgenda');
        cy.intercept('POST', '**/api/modules/turnos/agenda/clonar/**', req => { delete req.headers['if-none-match'] }).as('clonar');
        cy.intercept('GET', '/api/core/term/snomed/expression?expression=**', []).as('snomed');
    });

    it('Guardar agenda dinámica', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        cy.plexBool('label="Dinámica"', true);

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda dinámica con cupo máximo', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        cy.plexBool('label="Dinámica"', true);

        cy.plexBool('label="Cupo máximo"', true);

        complete({
            cupoMaximo: 9,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Crear agenda dinamica en una institucion', () => {
        cy.intercept('GET', '**/api/modules/turnos/institucion**', req => {
            delete req.headers['if-none-match']
        }).as('institucion');
        complete({
            fecha: cy.today(),
            horaInicio: "08:00",
            horaFin: "16:00",
        });
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.plexBool('label="Dinámica"', true);
        cy.plexBool('name="espacioFisicoPropios"', false);
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.contains('La agenda se guardó correctamente');
    });

    it('Guardar agenda del día citando por segmento un valor negativo de pacientes', () => {
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
            cantidadBloque: -9,
        });

        cy.contains('El valor debe ser mayor a 1');
    });

    it('Guardar, clonar y verificar botón iniciar prestación en agenda no nominalizada', () => {
        let ayer = Cypress.moment().add('days', -1);
        let hoy = Cypress.moment();
        complete({
            fecha: ayer.format('DD/MM/YYYY'),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.plexSelectType('label="Tipos de prestación"', 'actividades con la comunidad');
        cy.plexButton("Guardar").click();
        cy.wait('@create');
        cy.contains('La agenda se guardó correctamente').click();
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + ayer.format('DD/MM/YYYY'));
        cy.wait('@agendas');
        cy.get('table tbody td').contains('actividades con la comunidad');
        cy.plexBadge('En planificación').click();
        cy.plexButtonIcon('arrow-up-bold-circle-outline').click();
        cy.wait('@edicionAgenda');
        cy.toast('success', 'La agenda cambió el estado a disponible');
        cy.wait('@agendas');
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + ayer.format('DD/MM/YYYY'));
        cy.get('table tbody tr').plexButtonIcon('content-copy').first().click();

        cy.wait('@agendas');

        if (ayer.format('DD/MM/YYYY') === ayer.endOf('month').format('DD/MM/YYYY')) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@agendas');
        }
        cy.wait(500);
        cy.get('table').contains(hoy.format('D')).click({ force: true });
        cy.plexButtonIcon("check").click();
        cy.swal('confirm');
        cy.wait('@clonar').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });
        cy.contains('La Agenda se clonó correctamente');
        cy.swal('confirm');
        cy.wait('@agendas');
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + Cypress.moment().date());
        cy.wait('@agendas');
        cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + Cypress.moment().date());
        cy.wait('@agendas');
        cy.plexSelectType('name="prestaciones"', 'actividades con la comunidad');
        cy.wait('@agendas');
        cy.get('table tbody td').contains('En planificación').click();

        cy.wait('@agendas');

        cy.plexButtonIcon('arrow-up-bold-circle-outline').click();
        cy.wait('@edicionAgenda');
        cy.toast('success', 'La agenda cambió el estado a disponible');
        cy.wait('@agendas');
        cy.goto('/rup', token);
        cy.wait('@pantallas');
        cy.wait('@agendas');
        cy.wait('@prestacionesRup');
        cy.wait('@agendas');
        cy.get('plex-radio[name="agendas"] input').eq(1).click({
            force: true
        });
        cy.get('plex-item').contains('actividades con la comunidad').first().click();
        cy.plexButtonIcon('notas-check').click();
        cy.swal('confirm');
    });

    it('Cancelar carga de agenda', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.intercept('GET', '**/api/modules/turnos/agenda**', req => {
            delete req.headers['if-none-match']
        }).as('getAgendas');

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoDelDia: 7,
        });

        cy.plexButton("Cancelar").click();

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200)
        });
    });

});
