/// <reference types="Cypress" />

/**
 * VER TEMA DE REGLAS COMO RESETEAR
 * A LA NOCHE DA ERROR POR PROBLEMA DE TIMEZONE
 */

context('SOLICITUDES', () => {
    let token
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.createPaciente('solicitudes/paciente-solicitud', token);
            cy.task('database:seed:agenda', { tipoPrestaciones: '59ee2d9bf00c415246fd3d6b', fecha: 2, profesionales: '5c82a5a53c524e4c57f08cf3', estado: 'disponible', tipo: 'profesional' });
        })
    })

    beforeEach(() => {
        cy.goto('/solicitudes', token);
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('consultaPaciente');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones?turneable=1').as('getPrestaciones');
        cy.route('GET', '**/core/tm/conceptos-turneables?permisos=solicitudes:tipoPrestacion:?**').as('conceptosTurneables');
        cy.route('GET', '**/api/modules/top/reglas?organizacionDestino=**').as('getReglas');
        cy.route('GET', '**/api/core/tm/profesionales?nombreCompleto=**').as('getProfesional');
        cy.route('GET', '**/api/modules/rup/prestaciones/solicitudes?solicitudDesde=**').as('solicitudes');
        cy.route('GET', '**/api/core/tm/organizaciones').as('getOrganizaciones');
        cy.route('POST', '**/api/modules/rup/prestaciones').as('guardarSolicitud');
        cy.route('POST', '**/api/modules/top/reglas').as('guardarRegla');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('auditarSolicitud');

    })

    it('crear nueva regla solicitud', () => {

        let prestacionDestino = 'Consulta de cirugía';
        let orgOrigen = 'HOSPITAL DR. HORACIO HELLER';
        let prestacionOrigen = 'consulta de medicina general';

        cy.plexButton('Reglas').click();

        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('label="Prestación Destino"', prestacionDestino, '@getPrestaciones', 0);
        cy.plexSelectAsync('name="organizacion"', orgOrigen, '@getOrganizaciones', 0);

        cy.plexButtonIcon('plus').click();

        cy.wait('@getPrestaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.plexSelectAsync('name="prestacionOrigen"', prestacionOrigen, '@getPrestaciones', 0);

        cy.plexButtonIcon('plus').eq(1).click();

        cy.plexButton('Guardar').click();

        cy.wait('@guardarRegla').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].destino.organizacion.nombre).to.be.eq('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            expect(xhr.response.body[0].destino.prestacion.nombre).to.be.eq(prestacionDestino);
            expect(xhr.response.body[0].origen.organizacion.nombre).to.be.eq(orgOrigen);
            expect(xhr.response.body[0].origen.prestaciones[0].prestacion.nombre).to.be.eq(prestacionOrigen);
        });
        cy.toast('success', 'Las reglas se guardaron correctamente');
    });

    it('crear solicitud de entrada y verificar filtros', () => {

        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento('32589654')).click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de neurología', '@conceptosTurneables', 0);
        cy.plexSelectType('label="Organización origen"', 'HOSPITAL DR. HORACIO HELLER');
        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de clínica médica');
        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);
        cy.plexSelectAsync('name="profesional"', 'natalia huenchuman', '@getProfesional', 0);
        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexText('name="paciente"', 'SOLICITUD TEST');

        cy.plexSelectType('name="organizacion"', 'HOSPITAL DR. HORACIO HELLER');
        cy.plexSelectType('name="prestacionDestino"', 'Consulta de Neurología');
        cy.plexSelectType('name="estado"', 'auditoria');
        cy.get('table tbody tr td').contains('consulta de neurología');

    })

    it('crear solicitud de entrada y auditarla', () => {
        cy.server();

        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente');
        cy.get('paciente-listado plex-item').contains(formatDocumento('32589654')).click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de neurología', '@conceptosTurneables', 0);

        cy.plexSelectType('label="Organización origen"', 'HOSPITAL DR. HORACIO HELLER');

        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de clínica médica');

        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);


        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(xhr => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
        });
        cy.toast('success', 'consulta de neurología');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('name="prestacionDestino"', 'Consulta de Neurología');

        cy.wait('@solicitudes').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('table tbody tr td').contains('CORTES, JAZMIN').click({ force: true });
        cy.plexButtonIcon('lock-alert').first().click();
        cy.plexButton('Responder').click();
        cy.get('textarea').last().type('Una observacion', {
            force: true
        });
        cy.plexButton('Confirmar').click();
        cy.wait('@auditarSolicitud').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estados[1].observaciones).to.be.eq('Una observacion');
        });
    })
});
function formatDocumento(documentoPac) {
    // armamos un documento con puntos como se muestra en la lista de pacientes
    if (documentoPac) {
        return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
    }
    return documentoPac;
}