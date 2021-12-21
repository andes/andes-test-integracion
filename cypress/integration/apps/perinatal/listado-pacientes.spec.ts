/// <reference types="Cypress" />

context('Perinatal Listado', () => {
    let token;
    let listado;
    let paciente;
    let paciente2;
    let control = [
        {
            _id: "60cb3fdd59cc1e701e759857",
            profesional: {
                id: "5c82a5a53c524e4c57f08cf2",
                nombre: "ALICIA",
                apellido: "PRUEBA"
            },
            organizacion: {
                id: "57fcf038326e73143fb48dac",
                nombre: "HOSPITAL DR. HORACIO HELLER"
            },
            fechaControl: "2021-07-06T09:25:26.609-03:00",
            idPrestacion: "60cb3f4c59cc1e701e759803"
        }
    ];
    let embarazo = {
        "conceptId": "127364007",
        "term": "primer embarazo",
        "fsn": "primigesta (hallazgo)",
        "semanticTag": "hallazgo"
    }

    let control2 = [
        {
            _id: "60f1aa7819948f5e75058752",
            fechaControl: "2021-07-16T15:47:15.893Z",
            idPrestacion: "60f1aa2e19948f5e7505872a",
            organizacion: {
                id: "57e9670e52df311059bc8964",
                nombre: "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
            },
            profesional: {
                id: "5ddc01e43851da91beccbea1",
                nombre: "Celeste",
                apellido: "Ramos"
            }
        }
    ];
    let embarazo2 = {
        conceptId: "127368005",
        term: "segundo embarazo",
        fsn: "segundo embarazo (hallazgo)",
        semanticTag: "hallazgo"
    }

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:seed:paciente');
        });
        cy.task('database:create:carnet-perinatal', {
            controles: control,
            embarazo: embarazo,
            fecha: "2021-07-06T03:00:00.000Z",
            fechaControl: "2021-07-06T15:47:15.893Z",
            fechaUltimoControl: "2021-07-06T03:00:00.000Z",
            fechaProximoControl: "2021-07-07T03:00:00.000Z",

        }).then(p => { paciente = p; });
        cy.task('database:create:carnet-perinatal', {
            controles: control2,
            embarazo: embarazo2,
            fecha: "2021-07-16T03:00:00.000Z",
            fechaControl: "2021-07-16T15:47:15.893Z",
            fechaUltimoControl: "2021-07-16T03:00:00.000Z",
            fechaProximoControl: "2021-09-05T03:00:00.000Z",

        }).then(p => { paciente2 = p; });
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.route('GET', '**/api/core/tm/organizaciones**').as('getOrganizaciones');
        cy.route('GET', '**/api/modules/perinatal/carnet-perinatal**').as('listadoPerinatal');
        cy.route('PATCH', '**/api/modules/perinatal/carnet-perinatal/**').as('patchPaciente');
        cy.goto('/perinatal', token);
        cy.wait('@listadoPerinatal').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    })

    it('Filtro - Fecha desde / Fecha hasta', () => {
        cy.plexDatetime('name="fechaDesde"', '05/07/2021');
        cy.plexDatetime('name="fechaHasta"', '07/07/2021');
        cy.get('table tbody tr').should('length', 1);
    });

    it('Filtro - Fecha de cita', () => {
        cy.plexDatetime('name="fechaCita"', '07/07/2021');
        cy.get('table tbody tr').should('length', 1);
    });

    it('Filtro - Ultimo control', () => {
        cy.plexDatetime('name="fechaControl"', '06/07/2021');
        cy.get('table tbody tr').should('length', 1);
    });

    it('Filtro - Buscar paciente', () => {
        cy.plexText('name="paciente"', '10000000');
        cy.get('table tbody tr').should('length', 2);
        cy.plexText('name="paciente"', `{selectall}{backspace} VALIDADO`);
        cy.get('table tbody tr').should('length', 2);
    });

    it('Filtro - profesional', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.get('table tbody tr').should('length', 1);
        cy.plexButtonIcon('chevron-up').click();
    });

    it('Filtro - Organizacion', () => {
        cy.plexButtonIcon('chevron-down').click();
        cy.plexSelectAsync('name="organizacion"', 'HOSPITAL DR. HORACIO HELLER', '@getOrganizaciones', 0);
        cy.get('table tbody tr').should('length', 1);
        cy.plexButtonIcon('chevron-up').click();
    })

    it(' Verificar datos en el listado y sidebar', () => {
        cy.get('tbody tr').eq(0).contains('06/07/2021');
        cy.get('tbody tr').eq(0).contains('ANDES, PACIENTE VALIDADO');
        cy.get('tbody tr').eq(0).contains('10000000');
        cy.get('tbody tr').eq(0).contains('30 años');
        cy.get('tbody tr').eq(0).contains('AUSENTE');
        cy.get('tbody tr').eq(0).contains('07/07/2021');
        cy.get('tbody tr').eq(0).contains('06/07/2021');
        cy.get('tbody tr').eq(0).contains('10000000').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('ANDES');
            expect(xhr.response.body.nombre).to.be.eq('PACIENTE VALIDADO');
            expect(xhr.response.body.nombreCompleto).to.be.eq('PACIENTE VALIDADO ANDES');
            expect(xhr.response.body.documento).to.be.eq('10000000');
            expect(xhr.response.body.estado).to.be.eq('validado');
        });
    });

    it('Verificar historial del paciente', () => {
        cy.get('tbody tr').first().click();
        cy.get('plex-layout-sidebar plex-list').contains('06/07/2021');
        cy.get('plex-layout-sidebar plex-list').contains('PRUEBA, ALICIA');
        cy.get('plex-layout-sidebar plex-list').contains('HOSPITAL DR. HORACIO HELLER');
    });

    it('Persona con dos embarazos', () => {
        cy.plexText('name="paciente"', '10000000');
        cy.get('table tbody tr').should('length', 2);
    });

    it('Agregar nota a paciente', () => {
        cy.get('tbody tr').first().click();
        cy.get('plex-layout-sidebar').plexButton(' Agregar nota ').click();
        cy.get('plex-layout-sidebar').plexTextArea('name="notaText"', 'prueba');
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('prueba');
        });

        cy.get('plex-layout-sidebar plex-table').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexTextArea('name="notaText"', '{selectall}{backspace} Segunda prueba');
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota editada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('Segunda prueba');
        });

        cy.get('plex-layout-sidebar plex-table').plexIcon('cesto').click();
        cy.toast('success', 'Nota eliminada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq(null);
        });
    });

})