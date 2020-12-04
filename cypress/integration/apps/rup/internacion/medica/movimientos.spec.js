const moment = require('moment');

['medica', 'enfermeria'].forEach((capa) => {
    describe(`Capa ${capa} - Movimientos`, () => {
        let token;
        let pacientes;
        let camas;
        let salas;
        before(() => {
            cy.seed();

            cy.loginCapa(capa).then(([user, t, pacientesCreados]) => {
                pacientes = pacientesCreados;
                token = t;
                cy.factoryInternacion({ maquinaEstados: { configPases: { sala: '5f6b820487dac8aa716f8c81', allowCama: true }}, 
                configCamas: [
                    { estado: 'disponible', count: 2}, 
                    { estado: 'ocupada', pacientes: [pacientes[1]], fechaIngreso: moment().subtract(1, 'hour').toDate()},
                    { estado: 'ocupada', pacientes: [pacientes[2]], fechaIngreso: moment().subtract(1, 'hour').toDate(), unidadOrganizativa: '309901009'}
                ]})
                    .then(camasCreadas => {
                        camas = camasCreadas;
                        cy.factoryInternacion({ sala: true, config: [{ idFijo: '5f6b820487dac8aa716f8c81', estado: 'ocupada', pacientes: [pacientes[0]], fechaIngreso: moment().subtract(1, 'hour').toDate() }] })
                            .then(salasCreadas => {
                                salas = salasCreadas;
                                return cy.goto('/mapa-camas', token);
                            });
                    });
            });
        });

        beforeEach(() => {
            cy.server();
            cy.route('GET', `**/api/modules/rup/internacion/${capa}/**`).as('getHistorial');
            cy.route('GET', '**/api/modules/rup/internacion/camas?**').as('getCamas');
            cy.route('PATCH', '**/api/modules/rup/internacion/camas/**').as('patchCamas');
            cy.route('POST', '**/api/modules/rup/internacion/sala-comun/**').as('ingresoSala');
            cy.route('PATCH', '**/api/modules/rup/internacion/sala-comun/**').as('egresoSalaComun');

            cy.viewport(1920, 1080);
        });

        it('Movimiento Sala -> Cama', () => {
            cy.getCama(pacientes[0].nombre).click();

            cy.wait('@getHistorial').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
            cy.plexButton('Pase de unidad organizativa').click();

            cy.plexSelectType('label="Cama"', camas[0].cama.nombre);

            cy.plexButtonIcon('check').click();

            cy.wait('@egresoSalaComun').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.wait('@patchCamas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.swal('confirm', 'Pase de unidad organizativa exitoso');

            cy.getCama().should('have.length', 5);
        });

        it('Movimiento Cama -> Sala Directamente', () => {
            cy.getCama(pacientes[1].nombre).click();

            cy.wait('@getHistorial').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
            cy.plexButton('Pase de unidad organizativa').click();

            cy.plexButtonIcon('check').click();

            cy.wait('@ingresoSala').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            
            cy.wait('@patchCamas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.swal('confirm', 'Pase de unidad organizativa exitoso');

            cy.getCama().should('have.length', 6);
        });

        it('Movimiento Cama -> Cama Seleccionada', () => {
            cy.getCama(pacientes[2].nombre).click();

            cy.wait('@getHistorial').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });

            cy.get('plex-title[titulo="DATOS DE CAMA"] div').eq(2).plexButtonIcon('menos').click();
            cy.plexButton('Pase de unidad organizativa').click();

            cy.plexBool('label="¿Desea elegir cama destino?"', true);
            
            cy.plexSelectType('label="Cama"', 'CAMA');
            
            cy.plexButtonIcon('check').click();
            
            cy.wait('@patchCamas').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            
            cy.swal('confirm', 'Pase de unidad organizativa exitoso');

            cy.getCama().should('have.length', 6);
        });
    });
});