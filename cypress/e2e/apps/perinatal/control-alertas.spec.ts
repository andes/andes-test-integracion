/// <reference types="Cypress" />

context('Perinatal Listado', () => {
    let token;
    let paciente;
    let paciente2;
    let control = [
        {
            _id: "60ba5dba74c79f06db5dfeb9",
            profesional: {
                id: "5a31dbdd9fd75bb58d27234a",
                nombre: "NATALIA VANESA",
                apellido: "HUENCHUMAN"
            },
            organizacion: {
                id: "57e9670e52df311059bc8964",
                nombre: "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
            },
            fechaControl: "2021-06-04T14:05:35.624-03:00",
            idPrestacion: "60ba5d6fe5c869067f5e2633"
        }
    ];
    let embarazo = {
        conceptId: "127365008",
        term: "secundigesta",
        fsn: "secundigesta (hallazgo)",
        semanticTag: "hallazgo"
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
            fecha: "2021-06-04T00:00:00.000-03:00",
            fechaUltimoControl: "2021-06-04T14:05:35.624-03:00",
            fechaProximoControl: "2021-07-07T03:00:00.000Z",

        }).then(p => { paciente = p; });
        cy.task('database:create:carnet-perinatal', {
            controles: control2,
            embarazo: embarazo2,
            fecha: "2021-07-16T03:00:00.000Z",
            fechaControl: "2021-07-16T15:47:15.893Z",
            fechaUltimoControl: "2021-07-16T03:00:00.000Z",
            fechaProximoControl: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)),

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

    it('Paciente con control de embarazo vencido y dentro de alertas', () => {
        cy.plexButtonIcon('bell').click();
        cy.get('plex-help').contains('ANDES, PACIENTE VALIDADO');
        cy.get('plex-help').contains('10000000');
        cy.get('plex-help').contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
        cy.get('plex-help').contains('07/07/2021');
        cy.get('plex-help').contains('AUSENTE');
        cy.plexButtonIcon('close').click();
    });

    it('Paciente con control de embarazo no vencido', () => {
        let fecha = Cypress.moment().add('days', 1).format('DD/MM/YYYY');
        cy.get('tbody tr').eq(1).contains(fecha);
    })

})