const moment = require('moment');
context('Indicaciones', () => {
    let token;
    let paciente;
    let cama;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente', {
            template: 'validado',
            nombre:'Paciente Medica',
            apellido:'Medica',
            documento:'12345678'
        }).then(patient=>{
            cy.factoryInternacion({
                configCamas: [{
                    estado: 'ocupada', pacientes: [patient],
                    extras: { ingreso: true },
                    fechaIngreso: moment().subtract(1, 'd').toDate(),
                    unidadOrganizativa: '309901009',
                    sector: {
                        "tipoSector": {
                            "refsetIds": [],
                            "fsn": "edificio (medio ambiente)",
                            "term": "edificio",
                            "conceptId": "2421000013105",
                            "semanticTag": "medio ambiente"
                        },
                        "_id": "5b0586800d3951652da7daa1",
                        "nombre": "edificio este"
                    }
                }]
            }).then(camasCreadas => {
                cama = camasCreadas[0];
            });
        });

    })

    beforeEach(() => {
        cy.intercept('GET', '**/api/modules/rup/internacion/estados?**').as('getEstado');
        cy.intercept('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
        cy.intercept('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.intercept('GET', '**/api/modules/rup/internacion/internacion-resumen/**').as('getResumen');
        //cy.intercept('GET', '**/api/modules/rup/internacion/plan-indicaciones?**').as('getIndicaciones');
        //cy.intercept('GET', '**/api/modules/rup/internacion/plan-indicaciones-eventos?**').as('getEventos');


        
        
        cy.goto('/mapa-camas/internacion/medica', token);
    })

    it('Crear una nueva indicacion y validar pacientes', () => {
        cy.wait('@getCamas').then(({response}) => {
            expect(response.statusCode).to.eq(200)
        });
        cy.get('table tr td').first().click()
        cy.wait('@getPaciente').then(({response}) => {
            expect(response.statusCode).to.eq(200)
        });
        cy.get('[label="INDICACIONES"]').click({force:true})
        //cy.wait('@getResumen').then(({response}) => {
           // expect(response.statusCode).to.eq(200)
        //});
    });

   
})
