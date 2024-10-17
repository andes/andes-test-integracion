context("TM - Farmacia", () => {
    let token
    before(() => {
        cy.seed();
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.intercept('POST', '**/core/tm/farmacias').as('create');
        cy.intercept('PATCH', '**/core/tm/farmacias/**').as('patchFarmacia');
    })

    const habilitacion = Cypress.moment().subtract(2, 'years').format('DD/MM/YYYY');
    const renovacion = Cypress.moment().format('DD/MM/YYYY');
    const vencimiento = Cypress.moment().add(3, 'years').format('DD/MM/YYYY');

    it('Crear una farmacia.', () => {
        cy.goto('/tm/farmacia', token);
        cy.plexButton("Nueva Farmacia").click();

        // DATOS PRINCIPALES
        cy.plexText('label="Denominación"', 'ACONCAGUA');
        cy.plexText('label="Razón Social"', 'ALVAREZ MARIELA ANDREA');
        cy.plexText('label="CUIT"', '27226637724');
        cy.plexText('label="D.T Responsable"', 'ALVAREZ MARIELA ANDREA');
        cy.plexText('label="Matrícula D.T"', '426');
        cy.plexText('label="Disposición Alta D.T"', '002/06');
        cy.plexSelectType('label="Asociado"', 'Colegio de Farmacéuticos');
        cy.plexText('label="Disposición habilitación"', '237/24');
        cy.plexDatetime('label="Fecha habilitación"', '{selectall}{backspace}' + habilitacion);
        cy.plexDatetime('label="Fecha renovación"', '{selectall}{backspace}' + renovacion);
        cy.plexDatetime('label="Vencimiento habilitación"', '{selectall}{backspace}' + vencimiento);
        cy.plexText('label="Expediente papel"', '4420-168161/15');
        cy.plexText('label="Expediente GDE"', '2021-00164984');
        cy.plexText('label="Número caja"', 'CAJA N° 21');
        cy.plexBool('label="Laboratorio Magistrales"', true);

        // fARMACÉUTICOS AUXILIARES
        cy.plexButtonIcon('plus').eq(0).click();
        cy.plexText('label="Farmacéutico"', 'LUCAS CATUCCIA');
        cy.plexText('label="Matrícula"', '919');
        cy.plexText('label="Disposición Alta"', '1142/21');

        // HORARIOS
        cy.plexText('label="Día y horario"', 'LUNES A VIERNES DE 8:30 A 12:30 Y DE 16:30 A 20:30');

        // DOMICILIO
        cy.plexSelectType('label="Provincia"', 'NEUQUEN');
        cy.plexSelectType('label="Localidad"', 'NEUQUEN');
        cy.plexText('label="Dirección"', 'BUENOS AIRES 486');

        // CONTACTO
        cy.plexButtonIcon('plus').eq(2).click();
        cy.plexSelectType('label="Tipo"', 'Teléfono Fijo');
        cy.plexPhone('label="Número Fijo"', '4400000');

        cy.plexButton('Guardar').click();
        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.denominacion).to.be.eq('ACONCAGUA');
            expect(response.body.razonSocial).to.be.eq('ALVAREZ MARIELA ANDREA');
            expect(response.body.cuit).to.be.eq('27-22663772-4');
            expect(response.body.DTResponsable).to.be.eq('ALVAREZ MARIELA ANDREA');
        });
        cy.toast('success', 'Farmacia creada con éxito');
    })

    it('Editar una farmacia.', () => {
        cy.goto('/tm/farmacia', token);
        cy.get('tbody tr').first().click();

        // DATOS PRINCIPALES
        cy.get('plex-layout-sidebar').plexButtonIcon('pencil').first().click({ force: true });
        cy.plexText('label="Denominación"', '{selectall}{backspace}ADOS');
        cy.plexText('label="Razón Social"', '{selectall}{backspace}COOPERATIVA DE TRABAJO DE SALUD ADOS LIMITADA');
        cy.plexText('label="CUIT"', '{selectall}{backspace}30708585250');
        cy.plexText('label="D.T Responsable"', '{selectall}{backspace}EMANUEL MATIAS ANDREOCCI');
        cy.plexText('label="Matrícula D.T"', '{selectall}{backspace}929');
        cy.plexText('label="Disposición Alta D.T"', '{selectall}{backspace}887/24');
        cy.plexSelect('label="Asociado"').click().get('.option').contains('Independientes').click();

        cy.plexText('label="Disposición habilitación"', '237/24');
        cy.plexDatetime('label="Fecha habilitación"', '{selectall}{backspace}' + habilitacion);
        cy.plexDatetime('label="Fecha renovación"', '{selectall}{backspace}' + renovacion);
        cy.plexDatetime('label="Vencimiento habilitación"', '{selectall}{backspace}' + vencimiento);
        cy.plexText('label="Expediente papel"', '{selectall}{backspace}4420-129402/13');
        cy.plexText('label="Expediente GDE"', '{selectall}{backspace}2020-0562040');
        cy.plexText('label="Número caja"', '{selectall}{backspace}CAJA N° 17');
        cy.plexBool('label="Gabinete Inyectables"', true);
        cy.plexBool('label="Laboratorio Magistrales"', false);

        // fARMACÉUTICOS AUXILIARES
        cy.plexButtonIcon('close').eq(0).click();
        cy.plexButtonIcon('plus').eq(0).click();
        cy.plexText('label="Farmacéutico"', 'JORGELINA VANESA AMARILLA');
        cy.plexText('label="Matrícula"', '950');
        cy.plexText('label="Disposición Alta"', '1366/22');

        // HORARIOS
        cy.plexButtonIcon('plus').eq(1).click();
        cy.get('plex-text[label="Día y horario"]').eq(1).type('SABADO DE 8:00 A 13:00');

        cy.get('plex-select[label="Provincia"]').clearSelect();
        cy.plexSelect('label="Provincia"').click().contains('Neuquén').click();
        cy.plexSelect('label="Localidad"').click().contains('Aluminé').click();
        cy.plexText('label="Dirección"', 'CRISTIAN JOUBERT 263');

        // CONTACTO
        cy.plexButtonIcon('close').eq(3).click();
        cy.plexSelect('label="Tipo"').click().contains('Teléfono Celular').click();
        cy.plexPhone('label="Número Celular"', '2999999999');

        cy.plexButton('Guardar').click();
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.denominacion).to.be.eq('ADOS');
            expect(response.body.razonSocial).to.be.eq('COOPERATIVA DE TRABAJO DE SALUD ADOS LIMITADA');
            expect(response.body.cuit).to.be.eq('30-70858525-0');
            expect(response.body.DTResponsable).to.be.eq('EMANUEL MATIAS ANDREOCCI');
            expect(response.body.matriculaDTResponsable).to.be.eq('929');
            expect(response.body.disposicionAltaDT).to.be.eq('887/24');
            expect(response.body.asociadoA).to.be.eq('Independientes');
            expect(response.body.disposicionHabilitacion).to.be.eq('1115/21237/24');
            expect(response.body.expedientePapel).to.be.eq('4420-129402/13');
            expect(response.body.expedienteGDE).to.be.eq('2020-0562040');
            expect(response.body.nroCaja).to.be.eq('CAJA N° 17');
            expect(response.body.farmaceuticosAuxiliares[0].farmaceutico).to.be.eq('JORGELINA VANESA AMARILLA');
            expect(response.body.farmaceuticosAuxiliares[0].disposicionAlta).to.be.eq('1366/22');
            expect(response.body.farmaceuticosAuxiliares[0].matricula).to.be.eq('950');
            expect(response.body.horarios[1].dia).to.be.eq('SABADO DE 8:00 A 13:00');
            expect(response.body.domicilio.ubicacion.provincia.nombre).to.be.eq('Neuquén');
            expect(response.body.domicilio.ubicacion.localidad.nombre).to.be.eq('Aluminé');
            expect(response.body.domicilio.valor).to.be.eq('CRISTIAN JOUBERT 263');
            expect(response.body.contactos[0].tipo.id).to.be.eq('celular');
            expect(response.body.contactos[0].tipo.nombre).to.be.eq('Teléfono Celular');
            expect(response.body.contactos[0].valor).to.be.eq(2999999999);
        });
        cy.toast('success', 'Farmacia editada con éxito');
    })

    it('Agregar, editar y eliminar una disposición.', () => {
        cy.goto('/tm/farmacia', token);
        cy.get('tbody tr').first().click();

        // AGREGAMOS UNA DISPOSICIÓN
        cy.plexButton('Agregar disposición').click();
        cy.plexText('label="Número"', '081/07');
        cy.plexText('label="Descripción"', 'Cambio razon social');
        cy.get('plex-layout-sidebar').plexButtonIcon('check').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.disposiciones[0].numero).to.be.eq('081/07');
            expect(response.body.disposiciones[0].descripcion).to.be.eq('Cambio razon social');
        });
        cy.toast('success', 'Disposición creada exitosamente');

        // EDITAMOS UNA DISPOSICIÓN
        cy.get('plex-layout-sidebar').plexButtonIcon('pencil').eq(1).click({ force: true });
        cy.plexText('label="Número"', `{selectall}{backspace}947/16`);
        cy.plexText('label="Descripción"', '{selectall}{backspace}Cambio de horario');
        cy.get('plex-layout-sidebar').plexButtonIcon('check').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.disposiciones[0].numero).to.be.eq('947/16');
            expect(response.body.disposiciones[0].descripcion).to.be.eq('Cambio de horario');
        });
        cy.toast('success', 'Disposición editada exitosamente');

        // ELIMINAMOS UNA DISPOSICIÓN
        cy.get('plex-layout-sidebar').plexButtonIcon('cesto').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.disposiciones.length).to.be.eq(0);
        });
        cy.toast('success', 'Disposición eliminada exitosamente');
    })

    it('Agregar, editar y eliminar una sanción.', () => {
        cy.goto('/tm/farmacia', token);
        cy.get('tbody tr').first().click();

        // AGREGAMOS UNA SANCIÓN
        cy.plexButton('Agregar sanción').click();
        cy.plexText('label="Número"', '189/02');
        cy.plexText('label="Descripción"', 'Rectificacion cuit');
        cy.get('plex-layout-sidebar').plexButtonIcon('check').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.sancion[0].numero).to.be.eq('189/02');
            expect(response.body.sancion[0].descripcion).to.be.eq('Rectificacion cuit');
        });
        cy.toast('success', 'Sanción creada exitosamente');

        // EDITAMOS UNA SANCIÓN
        cy.get('plex-layout-sidebar').plexButtonIcon('pencil').eq(1).click({ force: true });
        cy.plexText('label="Número"', `{selectall}{backspace}395/05`);
        cy.plexText('label="Descripción"', '{selectall}{backspace}Traslado');
        cy.get('plex-layout-sidebar').plexButtonIcon('check').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.sancion[0].numero).to.be.eq('395/05');
            expect(response.body.sancion[0].descripcion).to.be.eq('Traslado');
        });
        cy.toast('success', 'Sanción editada exitosamente');

        // ELIMINAMOS UNA SANCIÓN
        cy.get('plex-layout-sidebar').plexButtonIcon('cesto').click({ force: true });
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.sancion.length).to.be.eq(0);
        });
        cy.toast('success', 'Sanción eliminada exitosamente');
    })

    it('Eliminar una farmacia.', () => {
        cy.goto('/tm/farmacia', token);
        cy.get('tbody tr').plexIcon('cesto').first().click();
        cy.swal('confirm');
        cy.wait('@patchFarmacia').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.activo).to.be.eq(false);
        });
        cy.toast('success', 'La Farmacia se eliminó exitosamente.');
    })
});