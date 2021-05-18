/// <reference types="Cypress" />

context('Ficha Epidemiológica', () => {
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:create:paciente',
            {
                _id: '605ddc37b2f5356afea60a05',
                template: 'validado',
                nombre: 'PRUEBA',
                apellido: 'EPIDEMIO',
                documento: 33650500
            });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/epidemiologia/buscador-ficha-epidemiologica', token);
        cy.route('GET', '**api/modules/forms/forms-epidemiologia/formEpidemiologia?**').as('getFicha');
        cy.route('GET', '**api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('PATCH', '**/api/modules/forms/forms-epidemiologia/formEpidemiologia/?**').as('patchFicha');
        cy.route('GET', '**/api/modules/forms/forms-epidemiologia/formsHistory?**').as('getHistory')
    });

    it('Buscar ficha entre dos fechas', () => {
        cy.plexDatetime('name="fechaDesde"', '25/03/2021');
        cy.plexDatetime('name="fechaHasta"', '26/03/2021');
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });

    it('Buscar ficha por tipo', () => {
        cy.plexSelectType('label="Tipo de ficha"', 'covid19').click()
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });

    it('Buscar ficha por paciente', () => {
        cy.plexText('name="buscador"', '33650500');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].apellido).to.be.eq('EPIDEMIO');
            expect(xhr.response.body[0].nombre).to.be.eq('PRUEBA');
        });
        cy.get('paciente-listado plex-item').contains("33.650.500").click();
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });

    it('Agregar y limpiar código SISA a una ficha', () => {
        cy.plexDatetime('name="fechaDesde"', '25/03/2021');
        cy.plexDatetime('name="fechaHasta"', '26/03/2021');
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
        cy.plexBadge('SIN REGISTRO').parent().plexButtonIcon('pencil').click();
        cy.plexInt('label="Código SISA"', '2244');
        cy.plexButton('Guardar').click();
        cy.toast('success', 'Código SISA registrado correctamente');
        cy.wait('@patchFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.secciones[5].fields[0].codigoSisa).to.be.eq(2244);
        })
        cy.plexBadge(' SISA 2244 ').parent().plexButtonIcon('pencil').click();
        cy.plexInt('label="Código SISA"', '{selectall}{backspace}');
        cy.plexButton('Guardar').click();
        cy.swal('confirm', 'Está a punto de blanquear el código SISA de la ficha.');
        cy.wait('@patchFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.secciones[5].fields[0].codigoSisa).to.be.eq(null);
        })
    });

    it('Buscar ficha sin registro en SISA', () => {
        cy.plexSelectType('label="Regitrado en SISA"', 'Sin Registro SISA').click()
        cy.plexButton('Buscar Fichas').click();
        cy.wait('@getFicha').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body[0].paciente.documento).to.be.eq('33650500');
            expect(xhr.response.body[0].paciente.id).to.be.eq('605ddc37b2f5356afea60a05');
            expect(xhr.response.body[0].type.name).to.be.eq('covid19');
            expect(xhr.response.body[0]._id).to.be.eq('605ddc8966231e538584ee3c');
        });
    });
})