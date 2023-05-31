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
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', profesionales: '5d49fa8bb6834a1d95e277b8', inicio: '20', fin: '22' });
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    })

    beforeEach(() => {
        cy.intercept('GET', '**/api/modules/turnos/agenda?**', req => {
            delete req.headers['if-none-match']
        }).as('getAgendas');
        cy.intercept('GET', '**/api/modules/turnos/agenda/**', req => {
            delete req.headers['if-none-match']
        }).as('findAgenda');
        cy.intercept('GET', '**/api/modules/turnos/agenda/candidatas?**', req => {
            delete req.headers['if-none-match']
        }).as('getCandidatas');
        cy.intercept('PATCH', '**/api/modules/turnos/turno/**').as('patchAgenda');
        cy.intercept('PATCH', '**/api/modules/turnos/agenda/**').as('patchAgenda2');
        cy.intercept('PUT', '**/api/modules/turnos/turno/**').as('putAgenda');
        cy.intercept('PUT', '**/api/modules/turnos/agenda/**').as('putAgenda2');
        cy.intercept('POST', '**/api/modules/turnos/agenda/clonar/**').as('clonar');
        cy.intercept('POST', '**/api/modules/turnos/agenda**').as('postAgenda');
        cy.intercept('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.intercept('GET', '**/api/modules/turnos/espacioFisico**').as('getEspacioFisico');
        cy.intercept('GET', '**/api/modules/turnos/institucion**').as('institucion');
        cy.goto('/citas/gestor_agendas', token);
        cy.viewport(1920, 1080);
    })

    it('editar agenda publicada', () => {
        cy.intercept('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.intercept('GET', '**/api/modules/turnos/espacioFisico**').as('getEspacioFisico');

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body[0].estado).to.be.eq('publicada');
            expect(response.body[0].organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body[0].profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body[0].bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');
        });

        cy.get('table tbody td').contains('HUENCHUMAN').click();
        cy.get('table tbody tr').plexButtonIcon('pencil').first().click();
        cy.wait(500)
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar').plexSelect('label="Equipo de Salud"').type('{backspace}');
        cy.get('plex-layout-sidebar').plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);
        cy.get('plex-layout-sidebar').plexSelectAsync('label="Espacio Físico"', 'Huemul Consultorio 3 PB', '@getEspacioFisico', 0);


        cy.plexButton('Guardar').click();
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5c82a5a53c524e4c57f08cf2');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');
            expect(response.body.espacioFisico.id).to.be.eq('5b645a2a69e8da0899074164');
        });
        cy.toast('success', 'La agenda se guardó correctamente');

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.wait(2000)
        cy.get('section.d-flex').contains('PRUEBA, ALICIA');
    })

    it('editar agenda en planificación', () => {
        cy.intercept('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.plexSelectType('label="Estado"', 'en planificación');
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('table tbody tr td').first().click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('planificacion');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');

        });
        cy.get('table tbody tr').plexButtonIcon('pencil').first().click({ force: true });
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('planificacion');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('598ca8375adc68e2a0c121b9');

        });

        const manana = Cypress.moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDateTimeDinamico('Fecha', '{selectall}{backspace}' + manana);
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.plexSelect('label="Tipos de prestación"').find('.remove-button').click();
        cy.plexSelect('label="Tipos de prestación"', '59ee2d9bf00c415246fd3d85').click();
        cy.plexSelect('name="modelo.profesionales"');
        cy.plexSelectAsync('name="modelo.profesionales"', 'prueba alicia', '@getProfesional', 0);

        cy.plexButton('Guardar').click();
        cy.wait('@putAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('planificacion');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5c82a5a53c524e4c57f08cf2');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('59ee2d9bf00c415246fd3d85');
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.plexDatetime('label="Hasta"', '{selectall}{backspace}' + manana);
        cy.plexDatetime('label="Desde"', '{selectall}{backspace}' + manana);

        cy.get('section.d-flex').contains('PRUEBA, ALICIA');
        cy.get('section.d-flex').contains('Consulta de ortopedia');

    })

    it('suspender agenda disponible sin turnos', () => {

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.get('table tbody td').plexLabel('oxigenoterapia domiciliaria').click();

        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('disponible');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5062f69fe79a598faf261');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(4);
        });
        cy.get('table tbody tr').plexButtonIcon('stop').first().click({ force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
        });
        cy.get('plex-layout-main table tbody td').plexLabel('oxigenoterapia domiciliaria').click();
        cy.get('table tbody td').plexBadge('Suspendida');
    })

    it('suspender agenda disponible con turno', () => {

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            cy.get('table tbody td').contains('examen pediátrico').click();
        });
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5063f69fe79a598fcf99d');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('asignado');
            expect(response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.get('table tbody tr').plexButtonIcon('stop').first().click({ force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
        });
        cy.toast('success', 'La agenda cambió el estado a Suspendida');
        cy.get('table tbody td').plexLabel('examen pediátrico').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('table tbody td').plexBadge('Suspendida');
        cy.get('table tbody tr').plexButtonIcon('sync-alert').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('table tbody td').first().click({ force: true });
        cy.wait('@getCandidatas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.contains(' No hay agendas que contengan turnos que coincidan');
    })

    it('suspender agenda disponible con turno y reasignarlo', () => {
        cy.wait('@getAgendas');
        cy.get('table tbody td').plexLabel('servicio de neumonología').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('asignado');
            expect(response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.get('table tbody tr').plexButtonIcon('stop').first().click({ force: true });
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
        });
        cy.toast('success', 'La agenda cambió el estado a Suspendida');
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
            expect(response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });

        cy.plexSelectType('name="prestaciones"', 'servicio de neumonología').click();
        cy.get('table tbody td').plexBadge('Suspendida');
        cy.get('table tbody tr').plexButtonIcon('sync-alert').first().click({ force: true });
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d02602588c4d1772a8a17f8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
            expect(response.body.bloques[0].turnos[0].motivoSuspension).to.be.eq('agendaSuspendida');
            expect(response.body.bloques[0].turnos[0].paciente.id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        cy.get('tbody').find('td').first().click({ force: true });
        cy.wait('@getCandidatas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.get('.reasignar').first().click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.toast('success', 'El turno se reasignó correctamente');
        cy.toast('info', 'INFO: SMS no enviado');
        cy.wait('@patchAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(4);
            expect(response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('disponible');
        });
        cy.wait('@putAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].turnos[0].estado).to.be.eq('suspendido');
        });
        cy.plexButton('Gestor de Agendas').click();

        cy.wait('@getAgendas');
        cy.get('table tbody td div').contains('servicio de neumonología').click();
        cy.wait(1000)
        cy.plexBadge('Reasignado');
    })

    it('suspender turno de agenda publicada', () => {

        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'publicada');
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('tbody tr').contains('ESPOSITO').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(3);
            expect(response.body.bloques[0].turnos[1].estado).to.be.eq('disponible');
        });
        cy.get('plex-layout-sidebar table tbody td div').contains('Disponible').click({ force: true });
        cy.get('plex-layout-sidebar').plexButtonIcon('stop').click({ force: true });
        cy.get('plex-layout-sidebar plex-help').plexButtonIcon('check').click({ force: true });
        cy.toast('success', 'El turno seleccionado fue suspendido');
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(2);
            expect(response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].turnos[2].estado).to.be.eq('disponible');
        });
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('5d49fa8bb6834a1d95e277b8');
            expect(response.body.bloques[0].tipoPrestaciones[0].id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].accesoDirectoDelDia).to.be.eq(4);
            expect(response.body.bloques[0].restantesDelDia).to.be.eq(2);
            expect(response.body.bloques[0].tipoPrestaciones[0]._id).to.be.eq('57f5060669fe79a598f4e841');
            expect(response.body.bloques[0].turnos[2].estado).to.be.eq('disponible');
        });
        cy.wait('@getAgendas');
        cy.get('plex-layout-sidebar table tbody td div').contains('suspendido(sin paciente)');

    })

    it('editar agenda dinamica con institucion', () => {

        cy.plexButton("Crear agenda").click({ force: true });
        cy.plexDateTimeDinamico('Fecha', cy.today());
        cy.plexDateTimeDinamico('Inicio', "08:00");
        cy.plexDateTimeDinamico('Fin', "16:00");
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.get('plex-bool[name="dinamica"]').click();
        cy.get('plex-bool[name="espacioFisicoPropios"]').click();
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Espacio Físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.get('table tbody td').plexLabel('consulta de medicina general').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('table tbody tr').plexButtonIcon('pencil').first().click({ force: true });
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.get('plex-layout-sidebar').plexBool('name="espacioFisicoPropios"', true).click({ force: true });
        cy.get('plex-layout-sidebar').plexSelectAsync('label="Espacio Físico"', 'Huemul Consultorio 3 PB', '@getEspacioFisico', 0);
        cy.plexButton("Guardar").click();
        cy.toast('success');
    })

    it('clonar agenda con una institucion asignada', () => {
        cy.plexButton("Crear agenda").click();
        cy.plexDateTimeDinamico('Fecha', cy.today());
        cy.plexDateTimeDinamico('Inicio', "08:00");
        cy.plexDateTimeDinamico('Fin', "16:00");
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.get('plex-bool[name="espacioFisicoPropios"]').click();
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.get('plex-layout-sidebar').plexInt('label="Cantidad de Turnos"', '10');
        cy.get('plex-layout-sidebar').plexInt('name="accesoDirectoDelDia"', '5');
        cy.get('plex-layout-sidebar').plexInt('name="accesoDirectoProgramado"', '5');
        cy.plexButton("Guardar").click();
        cy.wait('@postAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.otroEspacioFisico.nombre).to.be.eq('ESCUELA PRIMARIA 300');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Espacio Físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.get('table tbody td').plexLabel('consulta de medicina general').first().click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.otroEspacioFisico.nombre).to.be.eq('ESCUELA PRIMARIA 300');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
        });
        cy.plexButtonIcon("content-copy").first().click({ force: true });
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        if (cy.esFinDeMes()) {
            cy.plexButtonIcon('chevron-right').click();
            cy.wait('@getAgendas').then(({ response }) => {
                expect(response.statusCode).to.eq(200);
            });
        }
        cy.get('table tr td').contains(Cypress.moment().add(1, 'days').format('D')).click({ force: true });
        cy.plexButtonIcon("check").click();
        cy.swal('confirm');
        cy.wait('@clonar').then(({ response }) => {
            expect(response.statusCode).to.eq(200)
        });
        cy.contains('La Agenda se clonó correctamente');
        cy.swal('confirm');
    })

    it('intentar clonar agenda dinamica con una institucion asignada', () => {
        cy.plexButton("Crear agenda").click();
        cy.plexDateTimeDinamico('Fecha', cy.today());
        cy.plexDateTimeDinamico('Inicio', "08:00");
        cy.plexDateTimeDinamico('Fin', "16:00");
        cy.plexSelectType('label="Tipos de prestación"', 'consulta de medicina general');
        cy.plexBool('label="Dinámica"', true);
        cy.plexBool('name="espacioFisicoPropios"', false);
        cy.plexSelectAsync('label="Seleccione un espacio físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.plexButton("Guardar").click();
        cy.wait('@postAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.otroEspacioFisico.nombre).to.be.eq('ESCUELA PRIMARIA 300');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
        });
        cy.toast('success', 'La agenda se guardó correctamente');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('label="Espacio Físico"', 'ESCUELA PRIMARIA 300', '@institucion', 0);
        cy.get('table tbody td').plexLabel('consulta de medicina general').first().click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.otroEspacioFisico.nombre).to.be.eq('ESCUELA PRIMARIA 300');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
        });
        cy.get("button").contains('Clonar agenda').should('not.exist')

    });

    it('verificar actualizacion de estado de agenda suspendida', () => {
        cy.wait('@getAgendas').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });

        cy.get('table tbody td').contains('CORTES').click();
        cy.wait('@findAgenda').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estado).to.be.eq('publicada');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('58f74fd3d03019f919e9fff2');
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('name="profesionales"', 'CORTES JAZMIN', '@getProfesionales', 0);
        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.wait('@patchAgenda2').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.estado).to.be.eq('suspendida');
            expect(response.body.organizacion.id).to.be.eq('57e9670e52df311059bc8964');
            expect(response.body.profesionales[0].id).to.be.eq('58f74fd3d03019f919e9fff2');

        });
        cy.get('plex-badge').contains('Suspendida');
    })
})