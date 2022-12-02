/// <reference types="Cypress" />

const check = (dto) => {
    if (dto.nombre) {
        cy.plexText('label="Nombre"').should('have.value', dto.nombre);
    }

    if (dto.apellido) {
        cy.plexText('label="Apellido"').should('have.value', dto.apellido);
    }

    if (dto.sexo) {
        cy.plexSelectType('label="Sexo"').contains(dto.sexo);
    }

    if (dto.documento) {
        cy.plexInt('label="Número de Documento"').should('have.value', dto.documento);
    }

    if (dto.fechaNacimiento) {
        cy.plexDatetime('label="Fecha de nacimiento"').find('input').should('have.value', dto.fechaNacimiento);
    }
}

context('TM Profesional', () => {
    let token
    before(() => {
        cy.seed();

        cy.login('38906735', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.server();
        cy.route('POST', '**/core/tm/profesionales**').as('create');
        cy.route('POST', '**/core-v2/mpi/validacion').as('renaper');

    })

    it('crear profesional no matriculado, sin validar', () => {
        cy.goto('/tm/profesional/create', token);

        cy.plexText('label="Nombre"', 'Pedro');
        cy.plexText('label="Apellido"', 'Ramirez');
        cy.plexInt('label="Número de Documento"', '11111111');
        cy.plexSelectType('label="Sexo"', 'masculino');
        cy.plexDatetime('label="Fecha de nacimiento"', { text: '05/11/1991', skipEnter: true });

        cy.plexPhone('label="Número"', '2994587612').should('have.value', '2994587612');

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.apellido).to.be.eq('Ramirez');
            expect(response.body.nombre).to.be.eq('Pedro');
            expect(response.body.documento).to.be.eq('11111111');
        });

        cy.swal('confirm', '¡El profesional se creó con éxito!');
    });

    it('crear profesional no matriculado existente en renaper', () => {
        cy.goto('/tm/profesional/create', token);
        cy.fixture('renaper-1').as('fxRenaper')
        cy.route('POST', '**/core-v2/mpi/validacion', '@fxRenaper').as('renaper');

        cy.plexInt('label="Número de Documento"', '26487951');
        cy.plexSelectType('label="Sexo"', 'masculino');

        cy.get('plex-layout-sidebar').plexButton(" Validar Renaper ").click();
        cy.wait('@renaper').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.apellido).to.be.eq('TEST');
            expect(response.body.nombre).to.be.eq('PROFESIONAL');
        });

        check({
            nombre: 'PROFESIONAL',
            apellido: 'TEST',
            fechaNacimiento: '09/03/1990',
            sexo: 'Masculino'
        })

        cy.swal('confirm', 'El profesional ha sido validado con RENAPER');

        cy.plexPhone('label="Número"', '2994587612').should('have.value', '2994587612');

        cy.plexButton("Guardar").click();

        cy.wait('@create').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body.apellido).to.be.eq('TEST');
            expect(response.body.nombre).to.be.eq('PROFESIONAL');
            expect(response.body.documento).to.be.eq('26487951');

        });

        cy.swal('confirm', '¡El profesional se creó con éxito!');
    });

    it('se intenta validar nuevo profesional que no existente en renaper', () => {
        cy.goto('/tm/profesional/create', token);

        cy.fixture('renaper-error').as('fxRenaperError')
        cy.route('POST', '**/core-v2/mpi/validacion', '@fxRenaperError').as('renaperError');

        cy.plexInt('label="Número de Documento"', '15654898');

        cy.plexSelectType('label="Sexo"', 'femenino');

        cy.get('plex-layout-sidebar').plexButton(" Validar Renaper ").click();
        cy.wait('@renaperError').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body).to.have.property('message', 'ciudadano no encontrado');
        });

        cy.swal('confirm', 'El profesional no se encontró en RENAPER');
    });

    it('crear profesional duplicado', () => {
        cy.goto('/tm/profesional/create', token);

        cy.route('GET', '**/api/core/tm/profesionales?documento=4163782').as('get');

        cy.plexText('label="Nombre"', 'ALICIA BEATRIZ');
        cy.plexText('label="Apellido"', 'ESPOSITO');
        cy.plexInt('label="Número de Documento"', '4163782');

        cy.plexSelectType('label="Sexo"', 'femenino');
        cy.plexDatetime('label="Fecha de nacimiento"', { text: '12/12/1995', skipEnter: true });

        cy.plexPhone('label="Número"', '2994587612').should('have.value', '2994587612');

        cy.plexButton('Guardar').click();

        cy.wait('@get').then(({ response }) => {
            expect(response.statusCode).to.be.eq(200);
            expect(response.body).to.have.length(1);
            expect(response.body[0].nombre).to.be.eq('ALICIA BEATRIZ');
            expect(response.body[0].apellido).to.be.eq('ESPOSITO');
            expect(response.body[0].documento).to.be.eq('4163782');
        });
        cy.swal('confirm', 'El profesional que está cargando ya existe en el sistema');
    });

    it('búsqueda de profesional matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.plexInt('label="Documento"', '4466777');
        cy.plexText('label="Apellido"', 'PEREZ');
        cy.plexText('label="Nombre"', 'MARIA');

        cy.get('tbody').find('td').first().click({ force: true });

        cy.get('plex-layout-sidebar').should('contain', 'PEREZ, MARIA');
        cy.get('plex-layout-sidebar').should('contain', '4466777');
        cy.plexBadge('Matriculado');

        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '27041637825');
        cy.get('plex-layout-sidebar').should('contain', 'FARMACEUTICO');
        cy.get('plex-layout-sidebar').should('contain', '681')
    });

    it('búsqueda de profesional no matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.plexText('label="Apellido"', 'PRUEBA');
        cy.plexText('label="Nombre"', 'ALICIA');


        cy.get('tbody').find('td').first().click({ force: true });

        cy.get('plex-layout-sidebar').should('contain', 'PRUEBA, ALICIA');
        cy.get('plex-layout-sidebar').should('contain', '1711999');
        cy.plexBadge('No Matriculado');
        cy.get('plex-layout-sidebar').should('contain', 'femenino');
        cy.get('plex-layout-sidebar').should('contain', '1217429393');
    });

})