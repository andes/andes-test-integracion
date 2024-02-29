context('mobile profesional', () => {
    let token, idPrestacion;
    before(() => {
        cy.seed();
        cy.cleanDB('authDisclaimers');
        cy.task('database:seed:paciente');
        cy.task('database:create:paciente-app',
            {
                fromProfesional: '5d02602588c4d1772a8a17f8',
                device: {
                    "device_id": "",
                    "device_type": "Android 7.0",
                    "app_version": 34,
                }
            }
        );
        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cdc4c865cd661b503d727a6',
                registros: [{
                    id: "5f94594bdc5f1a0f691a67f2",
                    concepto: {
                        term: "documento adjunto",
                        fsn: "documento adjunto (procedimiento)",
                        conceptId: "1921000013108",
                        semanticTag: "procedimiento"
                    },
                }]
            }
        ).then((prestacion) => {
            idPrestacion = prestacion._id;
        });
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });

    })

    beforeEach(() => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            console.log(err);
            return false;
        })
        cy.intercept('POST', '**/api/modules/mobileApp/login').as('login');
        cy.intercept('POST', '**/api/auth/login').as('loginProfesional');
        cy.intercept('GET', '**/api/modules/mobileApp/prestaciones-adjuntar').as('prestaciones-adjuntar');
        cy.intercept('PATCH', '**/api/modules/mobileApp/prestaciones-adjuntar/**').as('patch-adjuntar');
        cy.intercept('GET', '**/api/modules/rup/prestaciones/huds/**', []).as('getHuds')
        cy.intercept('GET', '/api/core/term/snomed/expression?expression=**', []).as('snomed');
    });


    it('cargar adjunto', () => {
        cy.intercept('POST', '/api/drive**', []).as('store');
        cy.intercept('PATCH', '/api/modules/rup/prestaciones/**').as('patchPrestacion');

        cy.goto('/rup/ejecucion/' + idPrestacion, token);
        cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });

        const fileName = '/archivos/cat.png';
        cy.get('[type="file"]').attachFile(fileName);
        cy.wait('@store').then(({ response }) => {
            expect(response.statusCode).to.eq(200);;
        });

        cy.plexButton("Guardar sesión de informes de enfermería").click();
        cy.wait('@patchPrestacion').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.ejecucion.registros[0].valor.documentos[0].ext).to.be.eq('png');
        });
    });


    it('Log in', () => {
        cy.post(
            '/api/modules/mobileApp/prestaciones-adjuntar',
            {
                "paciente": "586e6e8627d3107fde116cdb",
                "prestacion": idPrestacion,
                "registro": "5f94594bdc5f1a0f691a67f2",
                "profesional": "5d02602588c4d1772a8a17f8"
            },
            token
        );

        cy.goto("/mobile/");
        cy.url().should('include', '/mobile/home');
        cy.get('.nologin').click();
        cy.get('input').first().type('30643636');
        cy.get('#password').first().type('asd');
        cy.get('.success').click();
        cy.wait('@loginProfesional').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(typeof response.body.token === 'string').to.be.eq(true);
        });
        cy.contains('HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON').click();
        cy.contains('Hola Natalia');
    });

    it.skip('Adjunto RUP', () => {
        cy.get('[name="andes-vacuna"]').click();
        cy.wait('@prestaciones-adjuntar').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
        });
        cy.url().should('include', '/mobile/profesional/adjuntar');
        cy.wait('@prestaciones-adjuntar');
        cy.wait(500);
        cy.get('[type="file"]').attachFile('archivos/cat.png');
        cy.wait(500);

        cy.get('ion-button').get('.ion-color-success').click();
        cy.wait('@patch-adjuntar').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.status).to.be.eq("ok");
        });
    });

});

