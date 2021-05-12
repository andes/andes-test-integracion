/// <reference types="Cypress" />

context('CENTRO OPERATIVO MÉDICO', () => {
    let token, tokenOriginal;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            tokenOriginal = t;
            token = t;
            cy.task('database:create:paciente', { template: 'validado', nombre: 'DERIVACION', apellido: 'NUEVA', documento: 2006891 });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'PACIENTE', apellido: 'COM 2', documento: 2006712 });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'PACIENTE', apellido: 'COM 3', documento: 2111893 });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'PACIENTE', apellido: 'COM 4', documento: 2001294 });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'PACIENTE', apellido: 'COM 5', documento: 2504195 });
            cy.task('database:create:paciente', { template: 'validado', nombre: 'PACIENTE', apellido: 'COM 6', documento: 2504196 });
        })
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core-v2/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('GET', '**/modules/com/derivaciones**').as('getDerivaciones');
        cy.route('GET', '**/api/core/tm/organizaciones?esCOM=true').as('getOrganizacion');
        cy.route('POST', '**/modules/com/derivaciones**').as('createDerivacion');
        cy.route('PATCH', '**/modules/com/derivaciones/**').as('editDerivacion');
        cy.route('POST', '**/modules/com/derivaciones/**/historial').as('updateHistorial');
        cy.route('POST', '/api/auth/v2/organizaciones').as('selectOrg');
        cy.route('GET', '**/api/auth/organizaciones').as('getOrganizaciones');
        // Lo removemos por ahora hasta encontrar la solución
        // cy.route('POST', '**/api/modules/descargas/reporteDerivacion').as('reporteDerivacion');
        secuencia(tokenOriginal);
    });

    function seleccionarPaciente(dni) {
        cy.plexText('name="buscador"', dni);
        cy.wait('@searchPaciente')
        const documento = dni.substr(0, dni.length - 6) + '.' + dni.substr(-6, 3) + '.' + dni.substr(-3);
        cy.get('paciente-listado plex-item').contains(documento).click();
    }

    function secuencia(token) {
        cy.goto('/com', token);
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexButton("Nueva derivación").click();
    }

    it('crear nueva derivacion y denegarla en el COM', () => {
        cy.plexButton('Nueva derivación').click({ force: true });
        seleccionarPaciente('2006891');
        cy.wait('@profesionalSolicitante').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTextArea('label="Detalle"', 'a rechazar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2006891');
        });
        cy.toast('success', 'Derivación guardada');

        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });

        cy.get('plex-label').contains('Solicitante: CORTES, JAZMIN').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('a rechazar');
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('inhabilitada').click();
        cy.plexTextArea('label="Observacion"', 'derivación denegada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-badge').contains('inhabilitada').should('have.length', 1);
        cy.contains('inhabilitada').click();

        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 2);
        cy.get('.card').contains('Pasa a inhabilitada por');
        cy.get('small').contains('Natalia Huenchuman de CENTRO OPERATIVO MEDICO');

    });

    it('crear nueva derivacion y cancelarla', () => {
        seleccionarPaciente('2006712');
        cy.plexTextArea('label="Detalle"', 'para cancelar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'TEST PRUEBA', '@profesionalSolicitante', 0);
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2006712');
        });
        cy.toast('success', 'Derivación guardada');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-label').contains('Solicitante: PRUEBA, TEST').should('have.length', 1);
        cy.contains('CANCELAR').click();
        cy.swal('confirm');
        cy.wait('@editDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.cancelada).to.be.eq(true);
        });
        cy.toast('success', 'Derivación cancelada');
        cy.contains('Solicitante: PRUEBA, TEST').should('not.exist');
    });

    it('crear nueva derivacion y sumar nota', () => {
        seleccionarPaciente('2111893');
        cy.plexTextArea('label="Detalle"', 'sumar nota');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'TEST PRUEBA', '@profesionalSolicitante', 0);
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2111893');
        });
        cy.toast('success', 'Derivación guardada');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.plexSelectType('label="Estado"').click().get('.option').contains('SOLICITADA').click();
        cy.get('plex-label').contains('Solicitante: PRUEBA, TEST').should('have.length', 1);
        cy.contains(' ACTUALIZAR ').click();
        cy.plexTextArea('label="Observacion"', 'nueva nota');
        cy.plexButton("Guardar").click();
        cy.wait('@updateHistorial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2111893');
        });
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-tabs').contains('DERIVACIONES ENTRANTES').click({ force: true });
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.contains('solicitada').click({ force: true });
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 2);
        cy.get('.card').contains('Actualizado por');
        cy.get('small').contains('Natalia Huenchuman de HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON');
        cy.get('.card').contains('nueva nota');

    });

    it('crear nueva derivacion y control de derivación en curso', () => {
        seleccionarPaciente('2001294');
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2001294');
        });
        cy.toast('success', 'Derivación guardada');
        cy.plexButton('Nueva derivación').click({ force: true });
        seleccionarPaciente('2001294');
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexButton("Guardar").click({ force: true });
        cy.toast('error', 'Ya existe una derivación en curso para el paciente seleccionado');
    });

    it('crear derivacion, aprobarla, asignarla, aceptarla, finalizarla', () => {
        seleccionarPaciente('2504195');
        cy.wait('@profesionalSolicitante').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getOrganizacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTextArea('label="Detalle"', 'a aceptar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'NATALIA HUENCHUMAN', '@profesionalSolicitante', 0);
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2504195');
        });
        cy.toast('success', 'Derivación guardada');

        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });

        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('a aceptar');
        cy.plexTextArea('label="Observacion"', 'derivación aprobada');
        cy.plexSelect('label="Nuevo estado"', 1).click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexSelectType('label="Estado"').click().get('.option').contains('HABILITADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('habilitada').should('have.length', 1);
        cy.contains('habilitada').click();
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 2);
        cy.get('.card').contains('Pasa a habilitada por');
        cy.get('small').contains('Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
        cy.get('plex-options div div button').contains('DERIVACIÓN').click({ force: true });
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('asignada').click({ force: true });
        cy.plexTextArea('label="Observacion"', 'derivación asignada');
        cy.plexSelectType('label="Organización destino"').click().get('.option').contains('HOSPITAL AÑELO').click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.plexSelectType('label="Estado"').click().get('.option').contains('ASIGNADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('asignada').should('have.length', 1);
        cy.login('30643636', 'asd', '5bae6b7b9677f95a425d9ee8').then(t => {
            token = t;
            cy.goto('/com', token);
        });

        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('aceptada').click();
        cy.plexTextArea('label="Observacion"', 'derivación aceptada');
        cy.plexButton("Guardar").click();
        cy.toast('success');

        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });

        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-item').last().click();
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('finalizada').click();
        cy.plexTextArea('label="Observacion"', 'derivación finalizada');
        cy.plexButton("Guardar").click();
        cy.plexSelectType('label="Estado"').click().get('.option').contains('FINALIZADA').click();
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').first().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 5);
    });

    it('crear derivacion, aprobarla, asignarla, rechazarla, finalizarla', () => {
        seleccionarPaciente('2504195');
        cy.wait('@profesionalSolicitante').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getOrganizacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTextArea('label="Detalle"', 'a aceptar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'ALICIA PRUEBA', '@profesionalSolicitante', 0);
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2504195');
        });
        cy.toast('success', 'Derivación guardada');
        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('a aceptar');
        cy.plexTextArea('label="Observacion"', 'derivación habilitada');
        cy.plexSelect('label="Nuevo estado"', 1).click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexSelectType('label="Estado"').click().get('.option').contains('HABILITADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('habilitada').should('have.length', 1);
        cy.contains('habilitada').click();
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 2);
        cy.get('.card').contains('Pasa a habilitada por');
        cy.get('small').contains('Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
        cy.get('plex-options div div button').contains('DERIVACIÓN').click({ force: true });
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('asignada').click({ force: true });
        cy.plexTextArea('label="Observacion"', 'derivación asignada');
        cy.plexSelectType('label="Organización destino"').click().get('.option').contains('HOSPITAL AÑELO').click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.plexSelectType('label="Estado"').click().get('.option').contains('ASIGNADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('asignada').should('have.length', 1);
        cy.login('30643636', 'asd', '5bae6b7b9677f95a425d9ee8').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('rechazada').click();
        cy.plexTextArea('label="Observacion"', 'derivación rechazada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-badge').contains('rechazada').should('have.length', 1);
        cy.get('plex-item').contains('rechazada').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('finalizada').click();
        cy.plexTextArea('label="Observacion"', 'derivación finalizada');
        cy.plexButton("Guardar").click();
        cy.plexSelectType('label="Estado"').click().get('.option').contains('FINALIZADA').click();
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').first().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 5);
    });

    it('crear derivacion traslado especial', () => {
        seleccionarPaciente('2504196');
        cy.wait('@profesionalSolicitante').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getOrganizacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTextArea('label="Detalle"', 'a aceptar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'ALICIA PRUEBA', '@profesionalSolicitante', 0);
        cy.plexSelectType('name="trasladoEspecial"', 'VUELO SANITARIO');
        cy.wait('@getOrganizaciones');
        cy.plexSelectType('name="organizacionTraslado"', 1);

        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2504196');
        });
        cy.toast('success', 'Derivación guardada');

        cy.login('30643636', 'asd', '5ef7ae883e3de57c0a429797').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('small').contains('VUELO SANITARIO');
        cy.get('span').contains('Traslado');
        cy.get('small').contains('SIEN - SISTEMA INTEGRADO DE EMERGENCIA DE NEUQUEN');
        cy.contains(' ACTUALIZAR ').click();
        cy.plexTextArea('label="Observacion"', 'vuelo sanitario no disponible');
        cy.plexButton("Guardar").click();
        cy.wait('@updateHistorial').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2504196');
        });

        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });

        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('small').contains('VUELO SANITARIO');
        cy.get('span').contains('Traslado');

        cy.plexSelect('label="Nuevo estado"', 1).click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexSelectType('label="Estado"').click().get('.option').contains('HABILITADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('habilitada').should('have.length', 1);
        cy.contains('habilitada').click({ force: true });
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 3);
        cy.get('.card').contains('Pasa a habilitada por');
        cy.get('small').contains('Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
        cy.get('.card').contains('vuelo sanitario no disponible');
        cy.get('plex-options div div button').contains('DERIVACIÓN').click({ force: true });
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('asignada').click({ force: true });
        cy.plexTextArea('label="Observacion"', 'derivación asignada');
        cy.plexSelectType('label="Organización destino"').click().get('.option').contains('HOSPITAL AÑELO').click();

        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.plexSelectType('label="Estado"').click().get('.option').contains('ASIGNADA').click();
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-badge').contains('asignada').should('have.length', 1);
        cy.login('30643636', 'asd', '5bae6b7b9677f95a425d9ee8').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('rechazada').click();
        cy.plexTextArea('label="Observacion"', 'derivación rechazada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.login('30643636', 'asd', '5f68c547cbd0db303ac4aee9').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-badge').contains('rechazada').should('have.length', 1);
        cy.get('plex-item').contains('rechazada').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('finalizada').click();
        cy.plexTextArea('label="Observacion"', 'derivación finalizada');
        cy.plexButton("Guardar").click();
        cy.plexSelectType('label="Estado"').click().get('.option').contains('FINALIZADA').click();
        cy.plexText('name="paciente"', '2504196');
        cy.wait('@getDerivaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-badge').contains('finalizada').should('have.length', 1);
        cy.get('plex-item').last().click({ force: true });
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('plex-panel').should('have.length', 6);
    });

    it('crear derivacion y descargar historial', () => {


        seleccionarPaciente('2504196');
        cy.wait('@profesionalSolicitante').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@getOrganizacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.plexTextArea('label="Detalle"', 'a aceptar');
        cy.plexSelectType('name="profesionalOrigen"').clearSelect();
        cy.plexSelectAsync('label="Profesional solicitante"', 'ALICIA PRUEBA', '@profesionalSolicitante', 0);
        cy.plexSelectType('name="trasladoEspecial"', 'VUELO SANITARIO');
        cy.wait('@getOrganizaciones');
        cy.plexSelectType('name="organizacionTraslado"', 1);

        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq('2504196');
        });
        cy.toast('success', 'Derivación guardada');

        cy.login('30643636', 'asd', '5ef7ae883e3de57c0a429797').then(t => {
            token = t;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        // cy.plexButtonIcon("printer").click();
        // cy.route2('POST', '**/api/modules/descargas/reporteDerivacion', {
        //     statusCode: 200
        // }).as('reporteDerivacion');
        // cy.wait('@reporteDerivacion').then((xhr) => {
        //     expect(xhr.status).to.be.eq(200);
        // });
    });
});
