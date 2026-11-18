const moment = require('moment');

context('Plan de Indicaciones', () => {
    let token;
    let pacientes;
    let camas;
    const conceptSustancia = [
        {
            "conceptId": "387207008",
            "fsn": "ibuprofeno (sustancia)",
            "semanticTag": "sustancia",
            "term": "ibuprofeno",
            "refsetIds": []
        },
        {
            "conceptId": "387517004",
            "fsn": "paracetamol (sustancia)",
            "semanticTag": "sustancia",
            "term": "paracetamol"
        },
        {
            "conceptId": "7034005",
            "fsn": "diclofenaco (sustancia)",
            "semanticTag": "sustancia",
            "term": "diclofenaco"
        }
    ];

    const unidadDosis = [
        {
            "conceptId": "439139003",
            "fsn": "gotas por minuto (calificador)",
            "semanticTag": "calificador",
            "term": "gotas por minuto",
            "refsetIds": []
        },
        {
            "conceptId": "258773002",
            "fsn": "mililitro (calificador)",
            "semanticTag": "calificador",
            "term": "ml"
        }
    ];

    const administracion = [
        {
            "conceptId": "738956005",
            "fsn": "oral (sitio de administración previsto)",
            "semanticTag": "sitio de administración previsto",
            "term": "oral"
        },
        {
            "conceptId": "255560000",
            "fsn": "intravenoso (calificador)",
            "semanticTag": "calificador",
            "term": "intravenoso"
        }
    ];

    const formaFarmaceutica = [
        {
            "conceptId": "739009002",
            "fsn": "jarabe (forma farmacéutica básica)",
            "semanticTag": "forma farmacéutica básica",
            "term": "jarabe"
        },
        {
            "conceptId": "732994000",
            "fsn": "gota (unidad de presentación)",
            "semanticTag": "unidad de presentación",
            "term": "gota"
        }
    ];

    const frecuencia = [
        {
            "id": "62bf0af3a3273f6640854743",
            "key": "4",
            "nombre": "4 horas",
            "source": "plan-indicaciones:frecuencia",
            "type": "number",
            "_id": "62bf0af3a3273f6640854743"
        },
        {
            "id": "62bf0af3a3273f6640854747",
            "key": "8",
            "nombre": "8 horas",
            "source": "plan-indicaciones:frecuencia",
            "type": "number",
            "_id": "62bf0af3a3273f6640854747"
        }
    ]

    before(() => {
        cy.seed();
        cy.cleanDB();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.loginCapa('medica').then(([user, t, pacientesCreados]) => {
            pacientes = pacientesCreados;
            token = t;
            cy.factoryInternacion({ configCamas: [{ estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment('2020-01-10').toDate() }] })
                .then(camasCreadas => {
                    camas = camasCreadas;
                });
        });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/mapa-camas', token);
        cy.intercept('GET', '**/api/modules/rup/internacion/estados**').as('getPrestaciones');
        cy.intercept('GET', '**/api/core/term/snomed/expression?**', conceptSustancia).as('getSustancia');
        cy.intercept('GET', '**/api/core/term/snomed/expression?expression=258684004%20OR%20258682000**', unidadDosis).as('getUnidadDosis');
        cy.intercept('GET', '**/api/core/term/snomed/expression?expression=764295003%20OR%20761829007**', administracion).as('getAdministracion');
        cy.intercept('GET', '**/api/core/term/snomed/expression?expression=732997007**', formaFarmaceutica).as('getFormaFarmaceutica');
        cy.intercept('GET', '**/api/modules/constantes?source=plan-indicaciones:frecuencia', frecuencia).as('getFrecuencia');
        cy.intercept('POST', '**/api/modules/rup/internacion/plan-indicaciones').as('postIndicaciones');
        cy.intercept('PATCH', '**/api/modules/rup/internacion/plan-indicaciones/**').as('patchIndicaciones');
    });

    it('crear una nueva indicacion y validarla', () => {
        cy.get('tbody tr').first().click();
        cy.get('plex-layout-sidebar').plexButton(' INDICACIONES ').click();
        cy.plexButtonIcon('plus').eq(0).click();
        cy.plexSelectAsync('label="Principio activo"', 'ibuprofeno', '@getSustancia', 0);
        cy.plexText('label="Valor Dosis"', '2');
        cy.plexSelectAsync('label="Unidad Dosis"', 'gotas por minuto', '@getUnidadDosis', 0);
        cy.plexSelectAsync('label="Vía de administración"', 'oral', '@getAdministracion', 0);
        cy.plexSelectAsync('label="Forma Farmacéutica"', 'jarabe', '@getFormaFarmaceutica', 0);
        cy.plexSelectAsync('label="Frecuencia"', '8 horas', '@getFrecuencia', 0);
        cy.plexDatetime('label="Horario"', '{selectall}{backspace}' + '08:00');
        cy.plexButtonIcon("check").click();
        cy.get('plex-layout-main').find('plex-bool').click();
        cy.plexDropdown('label="Validar borradores"').eq(0).click();
        cy.get('plex-layout-main').contains('Seleccionadas').click();
        cy.toast('success', 'Indicaciones validadas correctamente.');
        cy.wait('@postIndicaciones').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.valor.sustancias[0].ingrediente.conceptId).to.be.eq('387207008');
            expect(response.body.valor.sustancias[0].dosisUnidad.conceptId).to.be.eq('439139003');
            expect(response.body.valor.sustancias[0].dosisValor).to.be.eq('2');
            expect(response.body.valor.via.conceptId).to.be.eq('738956005');
            expect(response.body.valor.frecuencias[0].frecuencia.nombre).to.be.eq('8 horas');
            expect(response.body.valor.presentacion.conceptId).to.be.eq('739009002');
        })

    });

    it('Editar una indicacion', () => {
        cy.get('tbody tr').first().click();
        cy.get('plex-layout-sidebar').plexButton(' INDICACIONES ').click();
        cy.plexButtonIcon('plus').eq(0).click();
        cy.plexSelectAsync('label="Principio activo"', 'paracetamol', '@getSustancia', 0);
        cy.plexText('label="Valor Dosis"', '2');
        cy.plexSelectAsync('label="Unidad Dosis"', 'gotas por minuto', '@getUnidadDosis', 0);
        cy.plexSelectAsync('label="Vía de administración"', 'oral', '@getAdministracion', 0);
        cy.plexSelectAsync('label="Forma Farmacéutica"', 'jarabe', '@getFormaFarmaceutica', 0);
        cy.plexSelectAsync('label="Frecuencia"', '4 horas', '@getFrecuencia', 0);
        cy.plexDatetime('label="Horario"', '{selectall}{backspace}' + '08:00');
        cy.plexButtonIcon("check").click();
        cy.wait(1000)
        cy.get('plex-layout-main').find('plex-bool').eq(0).click();
        cy.plexDropdown('label="Validar borradores"').eq(0).click();
        cy.get('plex-layout-main').contains('Seleccionadas').click();
        cy.toast('success', 'Indicaciones validadas correctamente.');
        cy.get('table tbody tr td').eq(1).first().click();
        cy.get('plex-layout-sidebar').plexIcon('pencil').click();
        cy.plexSelectAsync('label="Principio activo"', '{selectall}{backspace}' + 'diclofenaco', '@getSustancia', 0);
        cy.plexText('label="Valor Dosis"', '{selectall}{backspace}' + '5');
        cy.plexSelectType('label="Unidad Dosis"', '{selectall}{backspace}' + 'ml');
        cy.plexSelectType('label="Vía de administración"', '{selectall}{backspace}' + 'intravenoso');
        cy.plexSelectType('label="Forma Farmacéutica"', '{selectall}{backspace}' + 'gota');
        cy.plexSelectType('label="Frecuencia"', '{selectall}{backspace}' + '8 horas');
        cy.plexDatetime('label="Horario"', '{selectall}{backspace}' + '16:00');
        cy.plexButtonIcon("check").click();
        cy.wait('@patchIndicaciones').then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.valor.sustancias[0].ingrediente.conceptId).to.be.eq("7034005");
            expect(response.body.valor.sustancias[0].dosisUnidad.conceptId).to.be.eq("258773002");
            expect(response.body.valor.sustancias[0].dosisValor).to.be.eq("5");
            expect(response.body.valor.via.conceptId).to.be.eq("255560000");
            expect(response.body.valor.frecuencias[0].frecuencia.nombre).to.be.eq('8 horas');
            expect(response.body.valor.presentacion.conceptId).to.be.eq("732994000");
        })
    })
})