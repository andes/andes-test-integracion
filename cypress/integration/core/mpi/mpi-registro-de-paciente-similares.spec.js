context('MPI-Registro de Pacientes Similares', () => {
    let token
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente');
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();

        // Intercepta la llamada a la ruta validar y devuelve paciente_validado
        cy.route('POST', '**api/core-v2/mpi/pacientes**').as('postPaciente');
        cy.route('PATCH', '**api/core-v2/mpi/pacientes/**').as('patchPaciente');
        cy.route('GET', '**api/core-v2/mpi/pacientes/**').as('getPaciente');
    })

    function irANuevoPaciente() {
        // Buscador
        cy.plexText('name="buscador"', 'xxx');
        cy.get('div').contains('NUEVO PACIENTE').click();
        cy.get('div').contains('CON DNI ARGENTINO').click();
    }

    it('Match >=94%, dni repetido', () => {

        irANuevoPaciente();
        // Se completa datos básicos
        cy.plexInt('name="documento"', '10000000');
        cy.plexDatetime('name="fechaNacimiento"', '26/12/1956');
        cy.plexSelectType('name="sexo"', 'Masculino');
        cy.plexText('name="apellido"', 'ANDES');
        cy.plexText('name="nombre"', 'VALIDADO');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexBool('name="viveProvActual"', true);
        cy.plexBool('name="viveLocActual"', true);
        cy.plexButton('Guardar').click();

        cy.wait('@postPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.sugeridos.length).to.be.eq(1);
            expect(xhr.response.body.sugeridos[0]._score).to.be.gte(0.94);
            expect(xhr.response.body.sugeridos[0].paciente._id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        // Popup alert

        cy.swal('confirm');
        cy.plexButton('Guardar').should('have.prop', 'disabled', true);
        cy.plexButton('Seleccionar').click();
        cy.plexButton('Guardar').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('Match <94%, dni repetido, selecciona match', () => {

        irANuevoPaciente();
        // Se completa datos básicos
        cy.plexInt('name="documento"', '10000000');
        cy.plexDatetime('name="fechaNacimiento"', Cypress.moment().format('DD/MM/YYYY'));
        cy.plexSelectType('name="sexo"', 'Masculino');
        cy.plexText('name="apellido"', 'X');
        cy.plexText('name="nombre"', 'X');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexSelectType('name="provincia"', 'CABA');
        cy.plexButton('Guardar').click();

        cy.wait('@postPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.sugeridos.length).to.be.eq(1);
            expect(xhr.response.body.sugeridos[0]._score).to.be.lt(0.94);
            expect(xhr.response.body.sugeridos[0].paciente._id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        // Popup alert

        cy.swal('confirm');
        cy.plexButton('Seleccionar').click();
        cy.plexButton('Guardar').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

    it('Match <94%, dni distinto, ignora match', () => {

        irANuevoPaciente();
        // Se completa datos básicos
        cy.plexInt('name="documento"', '10000001');
        cy.plexDatetime('name="fechaNacimiento"', '26/12/1956');
        cy.plexSelectType('name="sexo"', 'Masculino');
        cy.plexText('name="apellido"', 'ANDES');
        cy.plexText('name="nombre"', 'PACIENTE VALIDADO');
        cy.contains('datos de contacto').click()
        cy.plexBool('label="Sin datos de contacto"', true);
        cy.plexSelectType('name="provincia"', 'CABA');
        cy.plexButton('Guardar').click();

        cy.wait('@postPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.sugeridos.length).to.be.eq(1);
            expect(xhr.response.body.sugeridos[0]._score).to.be.lt(0.94);
            expect(xhr.response.body.sugeridos[0].paciente._id).to.be.eq('586e6e8627d3107fde116cdb');
        });
        // Popup alert

        cy.swal('confirm');
        cy.plexButton('Ignorar y Guardar').click();
        cy.wait('@postPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
    });

});