describe('CITAS - Planificar Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente');
        cy.task('database:seed:agenda', { inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { estado: 'planificacion', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5062f69fe79a598faf261', estado: 'disponible', inicio: '2', fin: '4' });
        cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', tipoPrestaciones: '57f5063f69fe79a598fcf99d', estado: 'publicada', inicio: '1', fin: '3' });
        cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', inicio: '3', fin: '5' });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', profesionales: '58f74fd3d03019f919e9fff2', inicio: '21', fin: '23' });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', profesionales: '5d49fa8bb6834a1d95e277b8', inicio: '5', fin: '7' });
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda?**').as('getAgendas');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('findAgenda');
        cy.route('GET', '**/api/modules/turnos/agenda/candidatas?**').as('getCandidatas');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('patchAgenda');
        cy.route('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda2');
        cy.route('PUT', '**/api/modules/turnos/turno/**').as('putAgenda');
        cy.route('PUT', '**/api/modules/turnos/agenda/**').as('putAgenda2');

        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.goto('/citas/gestor_agendas', token);
    })

    it('editar agenda publicada', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/espacioFisico**').as('getEspacioFisico');

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].estado).to.be.eq('publicada');
            expect(xhr.response.body[0].organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body[0].profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body[0].bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');
        });

        cy.get('table tbody div').contains('HUENCHUMAN').click();

        cy.plexButtonIcon('pencil').click();
        cy.get('.remove-button').click();

        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);
        cy.plexSelectAsync('label="Espacio Físico"', 'Huemul Consultorio 3 PB', '@getEspacioFisico', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@patchAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5c82a5a53c524e4c57f08cf2');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');
            expect(xhr.response.body.espacioFisico.id).to.be.eq('5b645a2a69e8da0899074164');
        });
        cy.toast('success', 'La agenda se guardó correctamente');

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('table tbody tr td').contains('Huemul Consultorio 3 PB (Huemul)');
    })

    it('editar agenda en planificación', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody td').contains('En planificación').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('planificacion');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');

        });
        cy.plexButtonIcon('pencil').click();

        const manana = Cypress.moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Fecha"', '{selectall}{backspace}' + manana);
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.wait('@getTiposPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });

        cy.plexSelect('label="Tipos de prestación"').find('.remove-button').click();
        cy.plexSelect('label="Tipos de prestación"', '59ee2d9bf00c415246fd3d85').click();

        cy.plexSelect('label="Equipo de Salud"').find('.remove-button').click({ force: true });
        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@putAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('planificacion');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5c82a5a53c524e4c57f08cf2');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('59ee2d9bf00c415246fd3d85');
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + manana);

        cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + manana);

        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('.tipo-prestacion').contains('Consulta de ortopedia');
    })

    it('suspender agenda disponible sin turnos', () => {

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('table tbody td').contains('oxigenoterapia domiciliaria').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('disponible');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5062f69fe79a598faf261');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(4);
        });
        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('suspendida');
        });
        cy.get('table tbody td').contains('oxigenoterapia domiciliaria').click();
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
    })

    it('suspender agenda disponible con turno', () => {

        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('examen pediátrico').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5063f69fe79a598fcf99d');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('asignado');
            expect(xhr.response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('suspendida');
        });
        cy.toast('success', 'La agenda cambió el estado a Suspendida');
        cy.get('table tbody td').contains('examen pediátrico').click();
        cy.wait('@findAgenda');
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
        cy.plexButtonIcon('sync-alert').click();
        cy.wait('@findAgenda');
        cy.get('tbody').find('td').first().click({ force: true });
        cy.wait('@getCandidatas');

        cy.contains(' No hay agendas que contengan turnos que coincidan');
    })

    it('suspender agenda disponible con turno y reasignarlo', () => {
        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('servicio de neumonología').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('asignado');
            expect(xhr.response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(xhr.response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
        });
        cy.toast('success', 'La agenda cambió el estado a Suspendida');
        cy.get('table tbody td').contains('servicio de neumonología').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('suspendida');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(xhr.response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
            expect(xhr.response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
        cy.plexButtonIcon('sync-alert').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('suspendida');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(xhr.response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
            expect(xhr.response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.get('tbody').find('td').first().click({ force: true });
        cy.wait('@getCandidatas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('.reasignar').first().click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.toast('success', 'El turno se reasignó correctamente');
        cy.toast('info', 'INFO: SMS no enviado');
        cy.wait('@patchAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('disponible');
        });
        cy.wait('@putAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('suspendida');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
        });
        cy.plexButton('Gestor de Agendas').click();

        cy.wait('@getAgendas');
        cy.wait('@getTiposPrestacion');

        cy.get('table tbody td div').contains('servicio de neumonología').click();
        cy.get('.lista-turnos .badge-info').contains('Reasignado');
    })

    it('suspender turno de agenda publicada', () => {

        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'publicada');
        cy.wait('@getAgendas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('tbody tr').contains('ESPOSITO').click();
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].turnos[0].estado).to.be.eq('disponible');
        });
        cy.get('.lista-turnos').contains('Disponible').click();
        cy.get('plex-box').eq(1).plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.toast('alert', 'El turno seleccionado fue suspendido');
        cy.wait('@patchAgenda2').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].turnos[1].estado).to.be.eq('disponible');
        });
        cy.wait('@findAgenda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('publicada');
            expect(xhr.response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(xhr.response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(xhr.response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(xhr.response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(xhr.response.body.bloques[0].turnos[1].estado).to.be.eq('disponible');
        });
        cy.wait('@getAgendas');
        cy.get('.lista-turnos').contains('Turno suspendido (sin paciente)');

    })

    it('editar agenda dinamica con institucion', () => {
        cy.route('GET', '**/api/modules/turnos/institucion**').as('institucion');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.plexButton("Crear una nueva agenda").click();
        cy.swal('cancel');
        cy.plexDatetime('name="modelo.fecha"', cy.today());
        cy.plexDatetime('name="modelo.horaInicio"', "08:00");
        cy.plexDatetime('name="modelo.horaFin"', "16:00");
        cy.plexSelectAsync('label="Tipos de prestación"', 'consulta de medicina general', '@prestaciones', 0);
        cy.plexBool('label="Dinámica"', true);
        cy.plexBool('name="espacioFisicoPropios"', false);
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.contains('La agenda se guardó correctamente');
        cy.get('table tbody td').contains('ESCUELA PRIMARIA 300').click();
        cy.plexButtonIcon('pencil').click();
        cy.plexSelect('label="Espacio Físico"').click();
        cy.plexSelect('label="Espacio Físico"').find('.remove-button').click();
        cy.plexSelectAsync('label="Espacio Físico"', 'CE.M.O.E. SAN JOSE OBRERO', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.get('table tbody td').contains('CE.M.O.E. SAN JOSE OBRERO');
    })

    it('clonar agenda con una institucion asignada', () => {
        cy.route('GET', '**/api/modules/turnos/institucion**').as('institucion');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.plexButton("Crear una nueva agenda").click();
        cy.swal('cancel');
        cy.plexDatetime('name="modelo.fecha"', cy.today());
        cy.plexDatetime('name="modelo.horaInicio"', "08:00");
        cy.plexDatetime('name="modelo.horaFin"', "16:00");
        cy.plexSelectAsync('label="Tipos de prestación"', 'consulta de medicina general', '@prestaciones', 0);
        cy.plexBool('label="Dinámica"', true);
        cy.plexBool('name="espacioFisicoPropios"', false);
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.contains('La agenda se guardó correctamente');
        cy.route('POST', '**/api/modules/turnos/agenda/clonar**').as('clonar');
        cy.get('table tbody td').contains('ESCUELA PRIMARIA 300').click();
        cy.plexButtonIcon("content-copy").click();
        cy.contains(Cypress.moment().add(1, 'days').date()).click()
        cy.plexButton("Clonar Agenda").click();
        cy.swal('confirm');
        cy.wait('@clonar').then((xhr) => {
            expect(xhr.status).to.be.eq(200)
        });
        cy.contains('La Agenda se clonó correctamente');
        cy.swal('confirm');
    })


})