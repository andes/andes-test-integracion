/// <reference types="Cypress" />

context('MPI-Relaciones entre pacientes', () => {
    let token;
    let validado1;
    let validado2;
    before(() => {
        cy.seed();
        cy.cleanDB()
        cy.task('database:seed:paciente', 'relacionHijo').then(pacientes => {
            validado1 = pacientes[0];
        });
        cy.task('database:seed:paciente', 'relacionPadre').then(pacientes => {
            validado2 = pacientes[0];
        });
        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.goto('/apps/mpi/busqueda', token);
        cy.server();
        cy.route('POST', '**api/core-v2/mpi/pacientes**').as('guardar');
        cy.route('GET', '**api/core-v2/mpi/pacientes**').as('getPaciente');
        cy.route('PATCH', '**api/core-v2/mpi/pacientes/**').as('patchPaciente');
    });

    it('Verificar que exista el boton de relaciones y mostrar la relacion', () => {
        cy.plexText('name="buscador"', validado1.documento);
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(validado1.nombre);
        cy.get('paciente-listado').contains(validado1.apellido);
        cy.get('paciente-listado').contains(formatDoc(validado1.documento));
        const edad = Math.floor(((Cypress.moment() - Cypress.moment(validado1.fechaNacimiento)) / (1000 * 60 * 60 * 24) / 365));
        cy.get('paciente-listado').contains(edad+' años');
        cy.get('paciente-listado').contains(Cypress.moment(validado1.fechaNacimiento).format('DD/MM/YYYY'));
        cy.get('paciente-listado').plexButtonIcon('usuarios').click();
        cy.get('paciente-listado').contains(validado1.relaciones[0].apellido+', '+validado1.relaciones[0].nombre);
        cy.get('paciente-listado').contains(formatDoc(validado1.relaciones[0].documento));
        cy.get('paciente-listado').contains(validado1.relaciones[0].relacion.nombre);
        cy.get('paciente-listado').contains(formatDoc(validado1.documento)).click();
        cy.get('plex-layout-sidebar plex-item').contains(validado1.relaciones[0].relacion.nombre);
        cy.get('plex-layout-sidebar plex-item').contains(validado1.relaciones[0].apellido+', '+validado1.relaciones[0].nombre);
        cy.get('plex-layout-sidebar plex-item').contains(formatDoc(validado1.relaciones[0].documento));
    });

    it('Seleccionar el boton de relaciones y verificar todos sus datos del hijo en el sidebar', () => {
        cy.plexText('name="buscador"', validado1.documento);
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('paciente-listado').contains(validado1.nombre);
        cy.get('paciente-listado').contains(validado1.apellido);
        cy.get('paciente-listado').contains(formatDoc(validado1.documento));
        const edad = Math.floor(((Cypress.moment() - Cypress.moment(validado1.fechaNacimiento)) / (1000 * 60 * 60 * 24) / 365));
        cy.get('paciente-listado').contains(edad+' años');
        cy.get('paciente-listado').contains(Cypress.moment(validado1.fechaNacimiento).format('DD/MM/YYYY'));
        cy.get('paciente-listado').plexButtonIcon('usuarios').click();
        cy.get('paciente-listado').contains(validado1.relaciones[0].apellido+', '+validado1.relaciones[0].nombre);
        cy.get('paciente-listado').contains(formatDoc(validado1.relaciones[0].documento));
        cy.get('paciente-listado').contains(validado1.relaciones[0].relacion.nombre).click();
        cy.get('plex-layout-sidebar plex-detail').find('plex-badge').contains(validado2.estado.toUpperCase());
        cy.get('plex-layout-sidebar plex-detail').find('plex-badge').contains(formatDoc(validado2.documento));
        cy.get('plex-layout-sidebar plex-detail').contains(validado2.apellido+', '+validado2.nombre);
        cy.get('plex-layout-sidebar plex-detail').contains(formatDoc(validado2.relaciones[0].documento));
        cy.get('plex-layout-sidebar plex-detail').contains(validado2.relaciones[0].apellido+', '+validado2.relaciones[0].nombre);
        cy.get('plex-layout-sidebar plex-detail').contains(formatSexo(validado2.sexo));
        cy.get('plex-layout-sidebar plex-detail').contains(Cypress.moment(validado2.fechaNacimiento).format('DD/MM/YYYY'));
        const edadRelacion = Math.floor(((Cypress.moment() - Cypress.moment(validado2.fechaNacimiento)) / (1000 * 60 * 60 * 24) / 365));
        cy.get('plex-detail').contains(edadRelacion+' años');
        cy.get('plex-layout-sidebar plex-item').contains(validado2.relaciones[0].relacion.nombre);
        cy.get('plex-layout-sidebar plex-item').contains(validado2.relaciones[0].apellido+', '+validado2.relaciones[0].nombre);
        cy.get('plex-layout-sidebar plex-item').contains(formatDoc(validado2.relaciones[0].documento));
    })
});

function formatDoc(s) {
    if(!s || s === ''){
        return 'Sin DNI'
    }
    return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}

function formatSexo(genero) {
    return genero.charAt(0).toUpperCase() + genero.substr(1).toLowerCase();
}
