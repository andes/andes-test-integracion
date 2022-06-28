describe('Acciones sobre paciente ingresado desde capa estadistica-v2', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();
        // interamente si damos permisos para estadistica-v2 entonces se loguea en efector hospital senillosa
        cy.loginCapa(['estadistica-v2', 'medica']).then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({
                usaEstadisticaV2: true, // forzamos para crear el estado estadistica-v2,
                vincularInformePrestacion: true,    // vinculamos el resumen con la prestación (informe)
                organizacion: user.organizaciones[0],
                configCamas: [
                    { pacientes: [pacientes[0]], estado: 'ocupada', fechaIngreso: Cypress.moment().add(-5, 'm').toDate() }
                ]
            });
        });
    });
    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/modules/rup/internacion/prestaciones?**').as('getPrestaciones');
        cy.route('GET', '**/api/modules/rup/internacion/internacion-resumen?**').as('getResumen')
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente')
        cy.route('PATCH', '**/api/modules/rup/internacion/internacion-resumen/**').as('patchResumen');
        cy.route('PATCH', '**/api/modules/rup/prestaciones/**').as('patchPrestacion');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.route('GET', '**/api/core/term/cie10?**', [{
            id: '59bbf1ed53916746547cbdba',
            idCie10: 1187.0,
            idNew: 3568.0,
            capitulo: '10',
            grupo: '02',
            causa: 'J12',
            subcausa: '9',
            codigo: 'J12.9',
            nombre: '(J12.9) Neumonía viral, no especificada',
            sinonimo: 'Neumonia viral, no especificada',
            descripcion: '10.Enfermedades del sistema respiratorio (J00-J99)',
            c2: true,
            reporteC2: 'Neumonia',
        }, {
            "id": "59bbf1ed53916746547cb91a",
            "idCie10": 3,
            "idNew": 2384,
            "capitulo": "05",
            "grupo": "09",
            "causa": "F80",
            "subcausa": "8",
            "codigo": "F80.8",
            "nombre": "Otros trastornos del desarrollo del habla y del lenguaje",
            "sinonimo": "Otros trastornos del desarrollo del habla y del lenguaje",
            "descripcion": "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2": false
        }, {
            "id": "59bbf1ed53916746547cb941",
            "idCie10": 42,
            "idNew": 2423,
            "capitulo": "05",
            "grupo": "10",
            "causa": "F94",
            "subcausa": "0",
            "codigo": "F94.0",
            "nombre": "Mutismo electivo",
            "sinonimo": "Mutismo electivo",
            "descripcion": "05.Trastornos mentales y del comportamiento (F00-F99)",
            "c2": false
        }]).as('getDiagnostico');
        cy.viewport(1920, 1080);
    });

    it.skip('Egreso de paciente desde listadado de internación', () => {
        const fechaEgreso = Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm');

        cy.goto('/mapa-camas/listado-internacion-unificado/estadistica-v2', token);
        cy.url().should('include', 'listado-internacion-unificado');
        // cy.wait('@getPrestaciones');
        cy.get('table tbody tr td').contains(pacientes[0].nombre).first().click();
        cy.wait('@getPaciente');
        cy.wait('@getResumen');

        cy.get('button').contains('EGRESO').click();
        cy.plexSelectType('label="Tipo de egreso"', 'Alta medica');
        cy.plexSelectAsync('label="Diagnostico Principal al egreso"', 'Neumo', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otro Diagnóstico"', 'Otros trastornos', '@getDiagnostico', 0);
        cy.plexSelectAsync('label="Otras circunstancias"', 'Mutismo', '@getDiagnostico', 0);
        cy.plexDatetime('label="Fecha y hora de egreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha y hora de egreso"', { text: fechaEgreso, skipEnter: true });

        cy.plexButtonIcon('check').click();
        cy.swal('confirm', 'Los datos se actualizaron correctamente');

        cy.wait('@patchCamas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        // verificamos sincronización entre resumen y prestación
        cy.wait('@patchResumen').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(Cypress.moment(xhr.response.body.fechaEgreso).format('DD/MM/YYYY HH:mm')).to.be.eq((fechaEgreso))
        });
        cy.wait('@patchPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.ejecucion.registros).have.length(2);
            const fechaEgresoPrestacion = Cypress.moment(xhr.response.body.ejecucion.registros[1].valor.InformeEgreso.fechaEgreso).format('DD/MM/YYYY HH:mm');
            expect(fechaEgresoPrestacion).to.be.eq(fechaEgreso);
        });
    })
})