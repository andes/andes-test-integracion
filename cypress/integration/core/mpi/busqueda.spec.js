
context('MPI-Busqueda Paciente', () => {
    let token;
    let pacientes;
    before(() => {
        cy.seed();
        cy.task('database:seed:paciente').then(ps => {
            pacientes = ps;
        })
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });

    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
        cy.route('GET', '**api/core/mpi/pacientes**').as('busqueda');
    });

    ['validado', 'temporal', 'sin-documento'].forEach((type, i) => {
        it('busca paciente ' + type + ' por nombre', () => {
            cy.plexText('name="buscador"', pacientes[i].nombre);
            cy.wait('@busqueda').then((xhr) => {
                expect(xhr.status).to.be.eq(200);
            });
            cy.get('paciente-listado').find('td').contains(pacientes[i].nombre);
            cy.get('paciente-listado').find('td').contains(pacientes[i].apellido)
            if (pacientes[i].documento) {
                cy.get('paciente-listado').find('td').contains(pacientes[i].documento);
                // cy.get('paciente-listado').find('td').contains('01/01/1987');
                // cy.get('paciente-listado').find('td').contains('Femenino');        
            }
        });

        it('busca paciente ' + type + ' por documento', () => {
            if (pacientes[i].documento) {
                cy.plexText('name="buscador"', pacientes[i].documento);
                cy.wait('@busqueda').then((xhr) => {
                    expect(xhr.status).to.be.eq(200);
                });
                cy.get('paciente-listado').find('td').contains(pacientes[i].nombre);
                cy.get('paciente-listado').find('td').contains(pacientes[i].documento);
                cy.get('paciente-listado').find('td').contains(pacientes[i].nombre);
                cy.get('paciente-listado').find('td').contains(pacientes[i].apellido);
            }
        });
    })

    it('buscar paciente por documento y verificar que no existe', () => {
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', true);
        cy.plexText('name="buscador"', '52081206');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', false);
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar paciente por nombre/apellido y verificar que no existe', () => {
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', true);
        cy.plexText('name="buscador"', 'nopatient');
        cy.plexDropdown('label="NUEVO PACIENTE"').should('have.prop', 'disabled', false);
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(0);
        });
        cy.contains(' No se encontró ningún paciente..');
    });

    it('buscar paciente con scan y verificar precarga de datos básicos', () => {
        cy.plexText('name="buscador"', '00535248130@TEST@TEST@M@26108063@B@02/10/1977@14/02/2018@200');
        cy.wait('@busqueda').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            cy.plexInt('name="documento"').should('have.value', '26108063');
            cy.plexText('label="Nombre"').should('have.value', 'TEST');
            cy.plexText('label="Apellido"').should('have.value', 'TEST');
            cy.plexDatetime('label="Fecha de Nacimiento"').find('input').should('have.value', '02/10/1977');
            cy.plexSelectType('label="Sexo"').contains('Masculino');
        });
    });



})