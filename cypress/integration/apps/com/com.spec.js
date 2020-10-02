/// <reference types="Cypress" />

context('CENTRO OPERATIVO MÉDICO', () => {
    let token, tokenOriginal, dni;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            tokenOriginal = t;
            token = t;
            cy.createPaciente('apps/solicitud/paciente-nueva-solicitud', token);
            dni = "2006890";
        })
    });

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/mpi/pacientes**').as('searchPaciente');
        cy.route('GET', '**/core/tm/profesionales**').as('profesionalSolicitante');
        cy.route('GET', '**/modules/com/derivaciones**').as('getDerivaciones');
        cy.route('POST', '**/modules/com/derivaciones**').as('createDerivacion');
        cy.route('PATCH', '**/modules/com/derivaciones/**').as('editDerivacion');
        cy.route('POST', '/api/auth/v2/organizaciones').as('selectOrg');
        cy.route('GET', '**/api/auth/organizaciones').as('getOrganizaciones');
        cy.route('GET', '**/api/core/tm/disclaimer?**').as('disclaimer');
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
        seleccionarPaciente(dni);
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación a rechazar');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
        });
        cy.toast('success', 'Derivación guardada');
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('CENTRO OPERATIVO MEDICO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: CORTES, JAZMIN').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('prueba de nueva derivación a rechazar');
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('denegada').click();
        cy.plexTextArea('label="Observacion"', 'derivación denegada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-badge').contains('denegada').should('have.length', 1);
        cy.contains('denegada').click();
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('tbody tr').should('have.length', 2);
        cy.get('tbody tr').contains('Pasa a denegada por Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
    });

    it('crear nueva derivacion y cancelarla', () => {
        seleccionarPaciente(dni);
        cy.plexSelectAsync('label="Profesional solicitante"', 'TEST PRUEBA', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación para cancelar');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
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

    it('crear nueva derivacion', () => {
        seleccionarPaciente(dni);
        cy.plexSelectAsync('label="Profesional solicitante"', 'CORTES JAZMIN', '@profesionalSolicitante', '58f74fd3d03019f919e9fff2');
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
        });
        cy.toast('success', 'Derivación guardada');
    });

    it('crear derivacion, aprobarla, asignarla, aceptarla, finalizarla', () => {
        seleccionarPaciente(dni);
        cy.plexSelectAsync('label="Profesional solicitante"', 'NATALIA HUENCHUMAN', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación a aceptar');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
        });
        cy.toast('success', 'Derivación guardada');
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('CENTRO OPERATIVO MEDICO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('prueba de nueva derivación a aceptar');
        cy.plexTextArea('label="Observacion"', 'derivación aprobada');
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('aprobada').click({ force: true });
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-badge').contains('aprobada').should('have.length', 1);
        cy.contains('aprobada').click();
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('tbody tr').should('have.length', 2);
        cy.get('tbody tr').contains('Pasa a aprobada por Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
        cy.get('plex-options div div button').contains('DERIVACIÓN').click({ force: true });
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('asignada').click({ force: true });
        cy.plexTextArea('label="Observacion"', 'derivación asignada');
        cy.plexSelectType('label="Organización destino"').click().get('.option').contains('HOSPITAL AÑELO').click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-badge').contains('asignada').should('have.length', 1);
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('HOSPITAL AÑELO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('aceptada').click();
        cy.plexTextArea('label="Observacion"', 'derivación aceptada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('CENTRO OPERATIVO MEDICO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('finalizada').click();
        cy.plexTextArea('label="Observacion"', 'derivación finalizada');
        cy.plexButton("Guardar").click();
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 0);
        cy.plexSelectType('label="Estado"').click().get('.option').contains('FINALIZADA').click();
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').should('have.length', 1);
        cy.get('plex-label').contains('Solicitante: Huenchuman, Natalia').first().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('tbody tr').should('have.length', 5);
    });

    it('crear derivacion, aprobarla, asignarla, rechazarla, finalizarla', () => {
        seleccionarPaciente(dni);
        cy.plexSelectAsync('label="Profesional solicitante"', 'ALICIA PRUEBA', '@profesionalSolicitante', 0);
        cy.plexTextArea('label="Detalle"', 'prueba de nueva derivación a aceptar');
        cy.plexButton("Guardar").click({ force: true });
        cy.wait('@createDerivacion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.paciente.documento).to.be.eq(dni);
        });
        cy.toast('success', 'Derivación guardada');
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('CENTRO OPERATIVO MEDICO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.get('plex-grid').contains('prueba de nueva derivación a aceptar');
        cy.plexTextArea('label="Observacion"', 'derivación aprobada');
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('aprobada').click({ force: true });
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-badge').contains('aprobada').should('have.length', 1);
        cy.contains('aprobada').click();
        cy.get('plex-item').last().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('tbody tr').should('have.length', 2);
        cy.get('tbody tr').contains('Pasa a aprobada por Natalia Huenchuman de CENTRO OPERATIVO MEDICO');
        cy.get('plex-options div div button').contains('DERIVACIÓN').click({ force: true });
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('asignada').click({ force: true });
        cy.plexTextArea('label="Observacion"', 'derivación asignada');
        cy.plexSelectType('label="Organización destino"').click().get('.option').contains('HOSPITAL AÑELO').click();
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-badge').contains('asignada').should('have.length', 1);
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('HOSPITAL AÑELO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-item').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('rechazada').click();
        cy.plexTextArea('label="Observacion"', 'derivación rechazada');
        cy.plexButton("Guardar").click();
        cy.toast('success');
        cy.plexMenu('home');
        cy.wait('@getOrganizaciones').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.wait('@disclaimer').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('.list-group-item').contains('CENTRO OPERATIVO MEDICO').click();
        cy.wait('@selectOrg').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(typeof xhr.responseBody.token === 'string').to.be.eq(true);
            token = xhr.responseBody.token;
            cy.goto('/com', token);
        });
        cy.get('plex-tabs').contains('DERIVACIONES SOLICITADAS').click({ force: true });
        cy.get('plex-badge').contains('rechazada').should('have.length', 1);
        cy.get('plex-item').contains('rechazada').last().click();
        cy.plexSelectType('label="Nuevo estado"').click().get('.option').contains('finalizada').click();
        cy.plexTextArea('label="Observacion"', 'derivación finalizada');
        cy.plexButton("Guardar").click();
        cy.get('plex-label').contains('rechazada').should('have.length', 0);
        cy.plexSelectType('label="Estado"').click().get('.option').contains('FINALIZADA').click();
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').should('have.length', 1);
        cy.get('plex-label').contains('Solicitante: PRUEBA, ALICIA').first().click();
        cy.get('plex-options div div button').contains('HISTORIAL').click({ force: true });
        cy.get('tbody tr').should('have.length', 5);
    });
});