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
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes**', req => {
            delete req.headers['if-none-match'] // evita que responda con datos de caché (statusCode 304)
        }).as('consultaPaciente');
        cy.intercept('GET', '**/api/core/tm/conceptos-turneables?**', req => { delete req.headers['if-none-match'] }).as('conceptosTurneables');
        cy.intercept('GET', '**/api/modules/top/reglas?organizacionDestino=**', req => { delete req.headers['if-none-match'] }).as('getReglas');
        cy.intercept('GET', '**/api/core/tm/profesionales?nombreCompleto=**', req => { delete req.headers['if-none-match'] }).as('getProfesional');
        cy.intercept('GET', '**/api/modules/rup/prestaciones/solicitudes**', req => { delete req.headers['if-none-match'] }).as('solicitudes');
        cy.intercept('GET', '**/api/core/tm/organizaciones**', req => { delete req.headers['if-none-match'] }).as('getOrganizaciones');
        cy.intercept('POST', '**/api/modules/rup/prestaciones', req => { delete req.headers['if-none-match'] }).as('guardarSolicitud');
        cy.intercept('POST', '**/api/modules/top/reglas', req => { delete req.headers['if-none-match'] }).as('guardarRegla');
        cy.intercept('PATCH', '**/api/modules/rup/prestaciones/**', req => { delete req.headers['if-none-match'] }).as('auditarSolicitud');

    })

    it('crear nueva regla de entrada', () => {
        cy.plexButton('Reglas de entrada').click();
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta de medicina general', '@conceptosTurneables', 0);
        cy.plexSelectAsync('name="organizacion"', 'HOSPITAL DE AREA RINCON DE LOS SAUCES', '@getOrganizaciones', 0);
        cy.plexButtonIcon('plus').click();
        cy.plexSelectAsync('name="prestacionOrigen"', 'consulta de urologia', '@conceptosTurneables', 0);
        cy.plexButtonIcon('plus').eq(1).click();
        cy.plexSelectAsync('name="prestacionOrigen"', 'consulta de clínica médica', '@conceptosTurneables', 0);
        cy.plexButtonIcon('plus').eq(1).click();
        cy.plexButton('Guardar').click();
        cy.wait('@guardarRegla').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body[1].origen.organizacion.nombre).to.be.eq('HOSPITAL DE AREA RINCON DE LOS SAUCES');
            expect(response.body[1].origen.prestaciones[0].prestacion.term).to.be.eq('consulta de urología');
            expect(response.body[1].origen.prestaciones[0].prestacion.conceptId).to.be.eq('2301000013109');
            expect(response.body[1].origen.prestaciones[1].prestacion.term).to.be.eq('consulta de clínica médica');
            expect(response.body[1].origen.prestaciones[1].prestacion.conceptId).to.be.eq('401000013105');

            expect(response.body[1].destino.organizacion.nombre).to.be.eq('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
            expect(response.body[1].destino.prestacion.term).to.be.eq('consulta de medicina general');
            expect(response.body[1].destino.prestacion.conceptId).to.be.eq('391000013108');
        });
        cy.toast('success', 'Las reglas se guardaron correctamente');
    });

    it('Verificar prestacion destino - Reglas de entrada', () => {
        cy.plexButton('Reglas de entrada').click();
        cy.plexSelectAsync('name="organizacion"', 'HOSPITAL DE AREA RINCON DE LOS SAUCES', '@getOrganizaciones', 0);
        cy.plexButtonIcon('plus').click();
        cy.swal('confirm', 'Debe seleccionar la prestación destino');
        cy.plexButton('Guardar').should('have.prop', 'disabled', true);
    });

    it('Verificar organización origen - Reglas de entrada', () => {
        cy.plexButton('Reglas de entrada').click();
        cy.plexSelectAsync('name="tipoPrestacion"', 'consulta de medicina general', '@conceptosTurneables', 0);
        cy.plexButtonIcon('plus').click();
        cy.swal('confirm', 'Debe seleccionar la organización de origen');
        cy.plexButton('Guardar').should('have.prop', 'disabled', false);
    });

    it('crear solicitud de entrada y verificar filtros', () => {

        cy.plexButton('Nueva Solicitud de Entrada').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.get('paciente-listado plex-item').contains(formatDocumento('32589654')).click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de neurología', '@conceptosTurneables', 0);

        cy.wait('@getReglas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.plexSelectType('label="Organización origen"', 'HOSPITAL DR. HORACIO HELLER');
        cy.plexSelectType('label="Tipos de Prestación Origen"', 'Consulta de clínica médica');
        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);
        cy.plexSelectAsync('name="profesional"', 'natalia huenchuman', '@getProfesional', 0);
        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');
        });
        cy.plexButtonIcon('chevron-down').click();
        cy.plexText('name="paciente"', 'SOLICITUD TEST');

        cy.plexSelectType('name="prestacionDestino"', 'Consulta de neurología');
        cy.plexSelectType('name="estado"', 'auditoria');
        cy.get('table tbody tr').first('contain', 'consulta de neurología');
    });

    it('crear solicitud de entrada y auditarla', () => {

        cy.plexButton('Nueva Solicitud').click();
        cy.plexText('name="buscador"', '32589654');
        cy.wait('@consultaPaciente');
        cy.get('paciente-listado plex-item').contains(formatDocumento('32589654')).click();

        cy.plexDatetime('name="fechaSolicitud"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectAsync('label="Tipo de Prestación Solicitada"', 'Consulta de cirugía infantil', '@conceptosTurneables', 0);
        cy.wait('@getReglas').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });

        cy.plexSelectType('label="Organización origen"', 'HOSPITAL DE AREA PLOTTIER');

        cy.plexSelect('label="Tipos de Prestación Origen"', 0).click();

        cy.plexSelectAsync('name="profesionalOrigen"', 'cortes jazmin', '@getProfesional', 0);


        cy.get('textarea').last().type('Motivo de la solicitud', {
            force: true
        });
        cy.plexButton('Guardar').click();
        cy.wait('@guardarSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.solicitud.registros[0].valor.solicitudPrestacion.motivo).to.be.eq('Motivo de la solicitud');
            expect(response.body.solicitud.historial[0].accion).to.be.eq('creacion');

        });
        cy.toast('success', 'Consulta de cirugía infantil');
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectType('name="prestacionDestino"', 'Consulta de cirugía infantil');

        cy.wait('@solicitudes').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
        });
        cy.get('plex-label').contains('CORTES, JAZMIN').click();
        cy.get('plex-layout-sidebar').plexIcon('lock-alert').click({ force: true })
        cy.plexButton('Aceptar').click({ force: true });
        cy.get('textarea').last().type('Una observacion', { force: true });
        cy.plexIcon('check').click({ force: true });
        cy.wait('@auditarSolicitud').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.estados[1].observaciones).to.be.eq('Una observacion');
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