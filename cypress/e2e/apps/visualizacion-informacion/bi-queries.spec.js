/// <reference types="Cypress" />

context('Visualizacion de Información - BI-Queries', function () {
    let token;
    before(() => {
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    });

    it('Verificar filtros de entrada y salida', () => {
        // Stub para devolver la query de prestaciones sin el microservicio
        cy.intercept('GET', '/api/bi/queries?desdeAndes=true**', [{
            "_id": "5f47c1d31787bd8018805228",
            "nombre": "Prestaciones",
            "argumentos": [
                {
                    "key": "fechaDesde",
                    "label": "Desde",
                    "tipo": "date",
                    "required": true
                },
                {
                    "key": "fechaHasta",
                    "label": "Hasta",
                    "tipo": "date",
                    "required": true
                },
                {
                    "key": "organizacionOrigen",
                    "label": "Organización",
                    "tipo": "organizacion",
                    "required": false,
                    "subquery": {
                        "solicitud.organizacion.id": "#organizacionOrigen"
                    }
                },
                {
                    "key": "profesional",
                    "label": "Profesional",
                    "required": false,
                    "tipo": "profesional",
                    "subquery": {
                        "solicitud.profesional.id": "#profesional"
                    }
                },
                {
                    "key": "prestacion",
                    "label": "Prestacion",
                    "tipo": "conceptoTurneable",
                    "required": false,
                    "subquery": {
                        "solicitud.tipoPrestacion.id": "#prestacion"
                    }
                },
                {
                    "key": "nombreCompleto",
                    "label": "Nombre Completo",
                    "check": true,
                    "tipo": "salida"
                },
                {
                    "key": "documento",
                    "label": "Documento",
                    "check": true,
                    "tipo": "salida"
                },
                {
                    "key": "edad",
                    "label": "Edad",
                    "check": true,
                    "tipo": "salida"
                },
                {
                    "key": "fechaNacimiento",
                    "check": true,
                    "label": "Fecha de Nacimiento",
                    "tipo": "salida"
                },
                {
                    "key": "domicilio",
                    "check": true,
                    "label": "Domicilio",
                    "tipo": "salida"
                }
            ],
        }]).as('queryPrestaciones');

        cy.intercept('GET', 'api/auth/submodulo/**', [
            {
                "_id": "57e9670e52df311059bc8964",
                "nombre": "HTAL PROV NEUQUEN - DR EDUARDO CASTRO RENDON",
                "id": "57e9670e52df311059bc8964"
            }
        ])
        cy.goto('/visualizacion-informacion/bi-queries', token);

        cy.plexSelectType('name="select"', 'Prestaciones');
        cy.plexDateTimeDinamico('Desde', cy.today());
        cy.plexDateTimeDinamico('Hasta', cy.today());
        cy.plexSelectTypeDinamico('Organización', 'dr eduardo castro rendon{enter}');
        cy.plexBoolDinamico('Nombre Completo', false);
        cy.plexButton(' Descargar CSV ').should('have.prop', 'disabled', false);
    });
});