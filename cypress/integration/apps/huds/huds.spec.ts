/// <reference types="Cypress" />

context('RUP - Ejecucion', () => {
    let token;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => token = t);
        cy.task('database:seed:paciente');

        cy.cleanDB(['prestaciones']);

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cdc4c865cd661b503d727a6',
                estado: 'validada',
                fecha: -1,
                registros: [{
                    id: "5f772b7ac9264781190bc794",
                    concepto: {
                        "conceptId": "186788009",
                        "term": "fiebre Q",
                        "fsn": "fiebre Q (trastorno)",
                        "semanticTag": "trastorno"
                    },
                    valor: {
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>hola mundo</p>"
                    },
                },
                {
                    id: "5f772b7ac9264781190bc795",
                    concepto: {
                        "conceptId": "386661006",
                        "term": "fiebre",
                        "fsn": "fiebre (hallazgo)",
                        "semanticTag": "hallazgo"
                    },
                    valor: {
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>SOY FIEBRE</p>"
                    },
                },
                {
                    id: "5f8eff346b215afada0dabc0",
                    concepto: {
                        "conceptId": "62315008",
                        "term": "diarrea",
                        "fsn": "diarrea(hallazgo)",
                        "semanticTag": "hallazgo"
                    },
                }]
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '598ca8375adc68e2a0c121bc',
                estado: 'validada',
                registros: [{
                    id: "5f772b7ac9264781190bc790",
                    concepto: {
                        "conceptId": "186788009",
                        "term": "fiebre Q",
                        "fsn": "fiebre Q (trastorno)",
                        "semanticTag": "trastorno"
                    },
                    valor: {
                        "idRegistroOrigen": "5f772b7ac9264781190bc794",
                        "estado": "activo",
                        "fechaInicio": new Date(),
                        "evolucion": "<p>hola mundo</p>"
                    },
                }]
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '598ca8375adc68e2a0c121b8',
                estado: 'validada',
                registros: [{
                    id: "5f8eff346b215afada0dabc0",
                    concepto: {
                        "conceptId": "400268004",
                        "term": "ibuprofeno+mentol",
                        "fsn": "ibuprofeno+mentol(producto)",
                        "semanticTag": "producto"
                    },
                    valor: {
                        "cantidad": 2,
                        "unidad": "unidades",
                        "recetable": true,
                        "indicacion": "prueba",
                        "estado": "activo",
                        duracion: {
                            "cantidad": 20,
                            "unidad": "dias"
                        }
                    },
                },
                {
                    id: "5f8eff406b215afada0dabc1",
                    concepto: {
                        "conceptId": "27113001",
                        "term": "peso corporal",
                        "fsn": "peso corporal(entidad observable)",
                        "semanticTag": "entidad observable"
                    },
                    valor: 90,
                }]
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '598ca8375adc68e2a0c121b8',
                tipoPrestacionOrigen: '598ca8375adc68e2a0c121b8',
                ambitoOrigen: "ambulatorio",
                profesional: '5d02602588c4d1772a8a17f8',
                profesionalOrigen: '5d02602588c4d1772a8a17f8',
                organizacionOrigen: '57e9670e52df311059bc8964',
                estado: 'auditoria',
                registroSolicitud: [{
                    concepto: {
                        "conceptId": "391000013108",
                        "term": "consulta de medicina general",
                        "fsn": "consulta de medicina general",
                        "semanticTag": "procedimiento",
                    },
                    valor: {
                        solicitudPrestacion: {
                            "motivo": "motivo de la solicitud",
                            "autocitado": false
                        }
                    },
                }],
                historial: [{
                    organizacion: {
                        "id": "57e9670e52df311059bc8964",
                        "nombre": "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
                    },
                    accion: "creacion",
                    descripcion: "Creada",
                    observaciones: "observacion de la solcitud"
                }],
                inicio: "top"
            }
        );

        cy.task(
            'database:seed:prestacion',
            {
                paciente: '586e6e8627d3107fde116cdb',
                tipoPrestacion: '5cac99471742c567658b46db',
                estado: 'validada',
                ambito: 'internacion',
                registros: [{
                    concepto: {
                        "conceptId": "373942005",
                        "term": "informe de alta",
                        "fsn": "informe de alta (elemento de registro)",
                        "semanticTag": "elemento de registro"
                    },
                    valor: {
                        "unidadOrganizativa": {
                            "_id": "5e8b4213b2ce3c28662a966f",
                            "conceptId": "3161000013100",
                            "term": "servicio de clínica médica",
                            "fsn": "servicio de clínica médica (medio ambiente)",
                            "semanticTag": "medio ambiente",
                            "id": "5e8b4213b2ce3c28662a966f"
                        },
                        "fechaDesde": '2020-10-22 03:00:00.000Z',
                        "fechaHasta": '2020-10-27 11:19:18.134Z'
                    },
                    registros: [
                        {
                            concepto: {
                                "conceptId": "3571000013102",
                                "term": "resumen de la internación",
                                "fsn": "resumen de la internación (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto resumen de la internación',
                        },
                        {
                            concepto: {
                                "conceptId": "3581000013104",
                                "term": "tratamiento recibido durante la internación",
                                "fsn": "tratamiento recibido durante la internación (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto del tratamiento recibido durante la internacion',
                        },
                        {
                            concepto: {
                                "conceptId": "3591000013101",
                                "term": "resumen de laboratorios",
                                "fsn": "resumen de laboratorios(elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto del resumen de laboratorios',
                        },
                        {
                            concepto: {
                                "conceptId": "3601000013109",
                                "term": "resumen de procedimientos",
                                "fsn": "resumen de procedimientos(elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto del resumen de procedimientos',
                        },
                        {
                            concepto: {
                                "conceptId": "4771000013105",
                                "term": "situaciones pendientes",
                                "fsn": "situaciones pendientes (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto de situaciones pendientes',
                        },
                        {
                            concepto: {
                                "conceptId": "3611000013107",
                                "term": "tratamiento a seguir post internación",
                                "fsn": "tratamiento a seguir post internación (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto de tratamiento a seguir post internacion',
                        },
                        {
                            concepto: {
                                "conceptId": "900000000000003001",
                                "term": "dieta a seguir post internación",
                                "fsn": "dieta a seguir post internación (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto de dieta a seguir post internacion',
                        },
                        {
                            concepto: {
                                "conceptId": "3631000013101",
                                "term": "pautas de alarma post internación",
                                "fsn": "pautas de alarma post internación (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto de pautas de alarma post internacion',
                        },
                        {
                            concepto: {
                                "conceptId": "3641000013106",
                                "term": "diagnóstico al egreso",
                                "fsn": "diagnóstico al egreso (elemento de registro)",
                                "semanticTag": "elemento de registro"
                            },
                            valor: 'Texto de diagnostico de egreso',
                        },
                    ]
                },
                ]
            }
        );
    });


    beforeEach(() => {
        cy.server();
        cy.route('GET', '/api/modules/rup/prestaciones/huds/586e6e8627d3107fde116cdb?**', []).as('huds');
        cy.route('GET', '/api/modules/seguimiento-paciente**', []);
        cy.route('GET', '/api/modules/huds/accesos**', []);
    });

    it('no puedo entrar sin token HUDS', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token);
        cy.url().should('include', 'inicio');
    });

    it('visualizar HUDS', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);
        cy.assertHudsBusquedaFiltros('trastorno', 1);
        cy.assertHudsBusquedaFiltros('producto', 1);
        cy.assertHudsBusquedaFiltros('procedimiento', 1);

        cy.getHUDSItems().should('have.length', 3);

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'consulta de clínica médica ',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        });

        cy.getHUDSItems().eq(1).assertRUPMiniCard({
            term: 'consulta de medicina general',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        });

        cy.getHUDSItems().eq(2).assertRUPMiniCard({
            term: 'sesión de informes de enfermería',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        });

        cy.getHUDSItems().eq(1).click();
        cy.assertRupCard(0, { semanticTag: 'producto', term: ' Ibuprofeno+mentol ' }).then((elem) => {
            cy.wrap(elem).contains('activo'); //Estado
            cy.wrap(elem).contains('20 dias'); //Durante
            cy.wrap(elem).contains('prueba'); //Indicación
            cy.wrap(elem).contains('2 unidades'); //Cantidad
            cy.wrap(elem).contains('si'); //Recetable
        });

        cy.assertRupCard(1, { semanticTag: 'procedimiento', term: ' Peso corporal ' }).then((elem) => {
            cy.wrap(elem).contains('90 Kg'); //Peso
        });

        cy.getHUDSItems().eq(2).click();

        cy.assertRupCard(0, { semanticTag: 'trastorno', term: 'Fiebre Q' }).then((elem) => {
            cy.wrap(elem).contains('hola mundo');
            cy.wrap(elem).plexBadge('activo', 'success');
        });

        cy.HudsBusquedaFiltros('hallazgo');
        cy.getHUDSItems().should('have.length', 2);
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'fiebre',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        cy.HudsBusquedaFiltros('trastorno');
        cy.getHUDSItems().should('have.length', 1);

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'fiebre Q',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        cy.get('vista-registro .menu-left').click();
        cy.get('vista-registro').plexBadge('fiebre');
        cy.get('vista-registro').plexBadge('fiebre Q');
    });

    it('HUDS - Filtro por texto libre', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);

        //Hallazgo
        cy.HudsBusquedaFiltros('hallazgo');

        cy.plexText('name="searchTerm"', "diarrea");
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'diarrea',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        //Trastorno
        cy.HudsBusquedaFiltros('trastorno');

        cy.plexText('name="searchTerm"').clear();
        cy.plexText('name="searchTerm"', "fiebre");
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'fiebre Q',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'activo'
        }).click();

        //Procedimiento
        cy.HudsBusquedaFiltros('procedimiento');

        cy.plexText('name="searchTerm"').clear();
        cy.plexText('name="searchTerm"', "peso corporal");
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'peso corporal',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman'
        }).click();

        cy.get('.prestacion-offset').plexBadge('Registro Privado', 'danger');

        //Producto
        cy.HudsBusquedaFiltros('producto');

        cy.plexText('name="searchTerm"').clear();
        cy.plexText('name="searchTerm"', "ibuprofeno+mentol");
        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'ibuprofeno+mentol',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            badge: 'activo'
        }).click();

        cy.get('.prestacion-offset').plexBadge('Registro Privado', 'danger');
    })

    it('HUDS - Filtro ambulatorio', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);

        cy.HudsBusquedaFiltros('prestaciones');

        cy.plexButtonIcon('chevron-down').click();

        cy.plexSelectType('label="Prestación"', 'sesion de informes de enfermeria');
        cy.plexDatetime('name="fechaInicio"', Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'));

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'sesión de informes de enfermería',
            fecha: Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        }).click();
    })

    it('HUDS - Controlar datos de solicitud', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);

        //Hallazgo
        cy.HudsBusquedaFiltros('solicitudes');
        cy.getHUDSItems().should('have.length', 1);

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'consulta de medicina general',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Huenchuman, Natalia',
        }).click();

        cy.get('.columna-completa').contains("consulta de medicina general"); //Tipo de prestación origen
        cy.get('.columna-completa').contains("HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"); //Organización origen
        cy.get('.columna-completa').contains("motivo de la solicitud"); //Motivo de la solicitud
        cy.get('.columna-completa').contains("auditoria"); //Estado de la solicitud

        cy.get('historial-solicitud').plexLabel(Cypress.moment().format('DD/MM/YYYY'));
        cy.get('historial-solicitud').plexLabel('Creada por Natalia Huenchuman');
        cy.get('historial-solicitud').plexLabel('Creacion de solicitud');
    });

    it('HUDS - Filtro internacion', () => {
        cy.goto('/huds/paciente/586e6e8627d3107fde116cdb', token, token);
        cy.assertHudsBusquedaFiltros('prestaciones', 4);
        cy.HudsBusquedaFiltros('prestaciones');
        cy.plexOptions('Internación').click();

        cy.plexButtonIcon('chevron-down').click();

        cy.plexSelectType('label="Prestación"', 'epicrisis medica');
        cy.plexDatetime('name="fechaInicio"', Cypress.moment().subtract(1, 'day').format('DD/MM/YYYY'));

        cy.getHUDSItems().eq(0).assertRUPMiniCard({
            term: 'epicrisis médica',
            fecha: Cypress.moment().format('DD/MM/YYYY'),
            profesional: 'Natalia Huenchuman',
            badge: 'validada'
        }).click();

        cy.assertRupCard(0, { term: ' Informe de alta ' }).then((elem) => {
            cy.wrap(elem).contains(' servicio de clínica médica '); // UNIDAD ORGANIZATIVA DE LA EPICRISIS
            cy.wrap(elem).contains('Texto resumen de la internación'); // RESUMEN DE LA INTERNACIÓN
            cy.wrap(elem).contains(' Texto del tratamiento recibido durante la internacion '); // TRATAMIENTO RECIBIDO DURANTE LA INTERNACIÓN
            cy.wrap(elem).contains(' Texto del resumen de laboratorios '); // REGISTROS DE LABORATORIOS/ESTUDIOS (Resumen de laboratorios)
            cy.wrap(elem).contains(' Texto del resumen de procedimientos '); // REGISTROS DE LABORATORIOS/ESTUDIOS ( Resumen de procedimientos)
            cy.wrap(elem).contains(' Texto de situaciones pendientes '); // SITUACIONES PENDIENTES
            cy.wrap(elem).contains(' Texto de tratamiento a seguir post internacion '); // TRATAMIENTOS A SEGUIR
            cy.wrap(elem).contains(' Texto de dieta a seguir post internacion '); // DIETA A SEGUIR
            cy.wrap(elem).contains(' Texto de pautas de alarma post internacion '); // PAUTAS DE ALARMA
            cy.wrap(elem).contains(' Texto de diagnostico de egreso '); // DIAGNOSTICO AL EGRESO
        });
    })

});
