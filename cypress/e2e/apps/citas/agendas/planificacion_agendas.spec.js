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

    if (dto.cupoMaximo) {
        cy.plexInt('name="cupoMaximo"', dto.cupoMaximo);
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

context('Planificacion Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/citas/gestor_agendas', token);
        cy.plexButton("Crear agenda").click();
        cy.route('POST', '**/api/modules/turnos/agenda**').as('create');
        cy.route('GET', '**/api/modules/turnos/espacioFisico**').as('espacios');
        cy.route('GET', '**/api/core/tm/profesionales**').as('profesionales');
        cy.route('GET', '**/api/modules/rup/prestaciones**').as('prestacionesRup');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('agendas');
        cy.route('GET', '**/api/modules/turnero/pantalla**').as('pantallas');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('edicionAgenda');
        cy.route('POST', '**/api/modules/turnos/agenda/clonar/**').as('clonar');
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

        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.plexSelectAsync('name="espacioFisico"', 'consultorio 1', '@espacios', 0);

        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        complete({
            descripcion: 'Consulta de medicina general',
            cantidadTurnos: 7,
            accesoDirectoDelDia: 7,
        });

        cy.plexButton("Guardar").click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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
        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('planificacion');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(7);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(7);
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].term).to.be.eq('consulta de medicina general');
            fecha = xhr.response.body.horaInicio;
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.wait('@agendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        if (cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@agendas').then((xhr) => {
                expect(xhr.status).to.be.eq(200)
            });
        }
        cy.get('table tr td').contains(Cypress.moment().add(1, 'days').format('D')).click({ force: true });
        cy.plexButton("Clonar Agenda").click();
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


        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');

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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.contains('La agenda se guardó correctamente');
    });

    it('Cancelar carga de agenda', () => {
        complete({
            fecha: cy.today(),
            horaInicio: "10:00",
            horaFin: "12:00"
        });
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');

        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');

        complete({
            cantidadTurnos: 7,
            accesoDirectoDelDia: 7,
        });

        cy.plexButton("Cancelar").click();

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
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

    it('Crear agenda dinamica en una institucion', () => {
        cy.route('GET', '**/api/modules/turnos/institucion**').as('institucion');
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

        cy.get('table').contains(hoy.format('D')).click({ force: true });
        cy.plexButton("Clonar Agenda").click();
        cy.swal('confirm');
        cy.wait('@clonar');
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
        cy.get('table tr').contains('actividades con la comunidad').first().click();
        cy.plexButton('INICIAR PRESTACIÓN').click();
        cy.get('button').contains('CONFIRMAR').click();
    });

});
