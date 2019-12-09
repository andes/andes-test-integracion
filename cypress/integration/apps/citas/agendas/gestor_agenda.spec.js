describe('CITAS - Planicar Agendas', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente');
        cy.task('database:seed:agenda', { inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { estado: 'planificacion', inicio: 1, fin: 3 });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5062f69fe79a598faf261', estado: 'disponible', inicio: 2, fin: 3 });
        cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', tipoPrestaciones: '57f5063f69fe79a598fcf99d', estado: 'publicada', inicio: 3, fin: 4 });
        cy.task('database:seed:agenda', { pacientes: '586e6e8627d3107fde116cdb', tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', inicio: 4, fin: 5 });
        cy.task('database:seed:agenda', { tipoPrestaciones: '57f5060669fe79a598f4e841', estado: 'publicada', inicio: 5, fin: 6 });
        cy.login('30643636', 'asd').then(t => {
            token = t;

        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getTiposPrestacion');
        cy.route('GET', '**/api/modules/turnos/agenda**').as('getAgendas');
        cy.route('GET', '**/api/modules/turnos/agenda/**').as('findAgenda');
        cy.route('PATCH', '**/api/modules/turnos/turno/**').as('patchAgenda');
        cy.route('PUT', '**/api/modules/turnos/turno/**').as('putAgenda');

        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.visit('/citas/gestor_agendas', {
            onBeforeLoad: (win) => {
                win.sessionStorage.setItem('jwt', token);
            }

        });
    })

    it('editar agenda publicada', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/turnos/espacioFisico**').as('getEspacioFisico');


        cy.wait('@getAgendas');
        cy.get('table tbody div').contains('HUENCHUMAN').click();

        cy.plexButtonIcon('pencil').click();
        cy.get('.remove-button').click();

        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);
        cy.plexSelectAsync('label="Espacio Físico"', 'Huemul Consultorio 3 PB', '@getEspacioFisico', 0);

        cy.plexButton('Guardar').click();
        cy.toast('success');
        cy.wait('@getAgendas');
        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('table tbody tr td').contains('Huemul Consultorio 3 PB (Huemul)');
    })

    it('editar agenda en planificación', () => {
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('En planificación').click();

        cy.plexButtonIcon('pencil').click();

        cy.swal('cancel');

        const manana = Cypress.moment().add(1, 'days').format('DD/MM/YYYY');

        cy.plexDatetime('label="Fecha"', '{selectall}{backspace}' + manana);
        // [TODO] Ver helpers para las fechas de las agendas

        // cy.plexDatetime('label="Inicio"', '{selectall}{backspace}' + '1200');
        // cy.plexDatetime('label="Fin"', '{selectall}{backspace}' + '1400');

        cy.plexSelect('label="Tipos de prestación"').find('.remove-button').click();


        cy.plexSelect('label="Tipos de prestación"', '59ee2d9bf00c415246fd3d85').click();


        cy.plexSelect('label="Equipo de Salud"').find('.remove-button').click();
        cy.plexSelectAsync('label="Equipo de Salud"', 'prueba alicia', '@getProfesional', 0);

        cy.plexButton('Guardar').click();

        cy.get('plex-dateTime[label="Desde"] input').type('{selectall}{backspace}' + manana);
        cy.get('plex-dateTime[label="Hasta"] input').type('{selectall}{backspace}' + manana);
        cy.get('.nombres-profesionales').contains('PRUEBA');
        cy.get('.tipo-prestacion').contains('Consulta de ortopedia');

        // [TODO] Ver helpers para las fechas de las agendas
        // cy.get('.datos-agenda').contains(' 14:00 a 19:00 hs - ');
    })

    it('suspender agenda disponible sin turnos', () => {

        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('oxigenoterapia domiciliaria').click();

        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();

        cy.get('table tbody td').contains('oxigenoterapia domiciliaria').click();
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
    })

    it('suspender agenda disponible con turno', () => {

        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('examen pediátrico').click();

        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();

        cy.get('table tbody td').contains('examen pediátrico').click();
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
        cy.plexButtonIcon('sync-alert').click();
        cy.wait('@findAgenda');
        cy.get('tbody tr').first().click();
        cy.contains(' No hay agendas que contengan turnos que coincidan');
    })

    it('suspender agenda disponible con turno y reasignarlo', () => {
        cy.wait('@getAgendas');
        cy.get('table tbody td').contains('servicio de neumonología').click();
        cy.plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.get('table tbody td').contains('servicio de neumonología').click();
        cy.get('.bloques-y-turnos .badge-danger').contains('Suspendida');
        cy.plexButtonIcon('sync-alert').click();
        cy.wait('@findAgenda');

        cy.get('tbody tr').first().click();

        cy.get('.reasignar').first().click();
        cy.get('button').contains('CONFIRMAR').click();
        cy.wait('@patchAgenda');
        cy.plexButton('Gestor de Agendas').click();
        cy.wait('@putAgenda');

        // [TODO] Investigar este caso.
        cy.wait('@getAgendas');
        cy.wait('@getAgendas');
        cy.wait('@getAgendas');
        cy.wait('@getTiposPrestacion');

        cy.get('table tbody td').contains('servicio de neumonología').click();
        cy.get('.lista-turnos .badge-info').contains('Reasignado');
    })

    it('suspender turno de agenda publicada', () => {

        cy.wait('@getAgendas');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('label="Estado"', 'publicada');
        cy.get('tbody tr').first().click();
        cy.get('.lista-turnos').first().click();
        cy.get('plex-box').eq(1).plexButtonIcon('stop').click();
        cy.plexButton('Confirmar').click();
        cy.wait('@getAgendas');
        cy.get('.lista-turnos').contains('Turno suspendido (sin paciente)');

    })
})