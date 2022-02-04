describe('Acciones sobre paciente ingresado desde capa asistencial', () => {
    let token;
    let pacientes;
    let camas;
    let prestacion;
    before(() => {
        cy.seed();
        cy.loginCapa(['estadistica-v2', 'medica']).then(([user, t, pacientesCreados]) => {
            token = t;
            pacientes = pacientesCreados;
            cy.factoryInternacion({
                usaEstadisticaV2: true, // forzamos para crear el estado estadistica-v2,
                configCamas: [
                    { pacientes: [pacientes[0]], estado: 'ocupada', fechaIngreso: Cypress.moment().add(-5, 'm').toDate() }
                ]
            }).then(camasCreadas => {
                camas = camasCreadas;               
            });
        });
    });

    beforeEach(() => {
        cy.goto('/mapa-camas', token) 

        cy.server();
        cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.route('GET', '**/api/modules/rup/internacion/camas/**').as('getCama');
        cy.route('GET', '**/api/core/tm/profesionales**').as('getProfesionales');
        cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
        cy.route('PATCH', '**/api/modules/rup/internacion/internacion-resumen/**').as('patchResumen');
        cy.route('POST', '**/api/modules/rup/prestaciones**').as('postPrestacion');
        cy.route('GET', '/api/core/term/snomed/expression?expression=<<394658006&words=**', [{
            "conceptId": "1234",
            "term": "Enfermeria en Rehabilitación",
        }, {
            "conceptId": "666",
            "term": "Dolor",
        }]).as('expEspecialidad');
        cy.route('GET', '**/api/core/tm/ocupacion?nombre=**', [{
            "_id": "5c793679af78f1fa5d0a8e1e",
            "id": "5c793679af78f1fa5d0a8e1e",
            "nombre": "Abogado",
            "codigo": "131"
        }, {
            "_id": "5c793679af78f1fa5d0a8e1a",
            "id": "5c793679af78f1fa5d0a8e1a",
            "nombre": "Medico",
            "codigo": "132"
        }]).as('getOcupacion')
        cy.viewport(1920, 1080);
    });

    it('Carga del informe de ingreso desde estadística-v2', () => {
        cy.plexButton('Estadístico (nuevo)').click();
        cy.wait('@getCamas');
        cy.get('table tbody tr td').contains(camas[0].cama.nombre).first().click();
        cy.plexTab('INTERNACION').click()
        
        cy.plexButtonIcon('lapiz-documento').click();
        cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Ingreso"', { text: Cypress.moment().add(-3, 'm').format('DD/MM/YYYY HH:mm'), skipEnter: true });
        cy.plexSelectType('name="origen"', 'Emergencia');
        cy.plexSelectAsync('name="profesional"', 'PRUEBA ALICIA', '@getProfesionales', 0);
        cy.plexText('name="motivo"', 'Estornudo');
        cy.plexSelectType('label="Cobertura"', 'Ninguno');
        cy.plexSelectType('name="situacionLaboral"', 'No trabaja y no busca trabajo');
        cy.plexSelectAsync('name="ocupacionHabitual"', 'Abog', '@getOcupacion', 0);
        cy.plexSelectType('name="nivelInstruccion"', 'Ninguno');
        cy.plexSelectType('label="Cama"').click().get('.option').contains('CAMA').click()

        cy.plexButtonIcon('check').click();

        cy.wait('@patchCamas').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@postPrestacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            prestacion = xhr.response.body;
        })
        // verifica que el resumen quede vinculado a la prestacion
        cy.wait('@patchResumen').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.idPrestacion).to.be.eq(prestacion.id); 
        })
    })

    it('Editar fecha de ingreso en capa asistencial y verificar sincronización en estadistica-v2', () => {
        const nuevaFecha = Cypress.moment().add(-1, 'm').format('DD/MM/YYYY HH:mm');
        // modificar fecha ingreso
        cy.plexButton('Médico').click();
        cy.wait('@getCamas');
        cy.get('table tbody tr td').contains(camas[0].cama.nombre).first().click();
        cy.plexTab('INTERNACION').click()
        cy.get('plex-title[titulo="INGRESO"] div').eq(2).plexButtonIcon('pencil').click();
        cy.plexDatetime('label="Fecha Ingreso"', { clear: true, skipEnter: true });
        cy.plexDatetime('label="Fecha Ingreso"', { text: nuevaFecha, skipEnter: true });
        cy.plexButtonIcon('check').click();
        cy.swal('confirm', 'Los datos se actualizaron correctamente');
        
        // cambio de capa
        cy.goto('/mapa-camas', token);
        cy.plexButton('Estadístico (nuevo)').click();
        cy.url().should('include', 'mapa-camas/internacion/estadistica-v2')
        cy.wait('@getCamas');
        cy.wait(100);   // sino no llega a 'ver' las camas aunque esten en pantalla
        cy.get('table tbody tr td').contains(camas[0].cama.nombre).first().click();
        cy.wait('@getCama')
        cy.plexTab('INTERNACION').click();
        
        // verifica fechas
        cy.get('plex-label[titulo="Fecha ingreso"]').find('small').first().should('contain', nuevaFecha)
    })
})