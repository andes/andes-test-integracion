/// <reference types="Cypress" />

const complete = (dto) => {
    if (dto.nombre) {
        cy.plexText('label="Nombre"', dto.nombre);
    }

    if (dto.apellido) {
        cy.plexText('label="Apellido"', dto.apellido);
    }

    if (dto.sexo) {
        cy.plexSelectType('label="Sexo"', dto.sexo);
    }

    if (dto.documento) {
        cy.plexInt('label="Número de Documento"', dto.documento);
    }

    if (dto.fechaNacimiento) {
        cy.plexDatetime('label="Fecha de nacimiento"', dto.fechaNacimiento);
    }
}

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

    })

    it('crear profesional no matriculado, sin validar', () => {
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.route('POST', '**/core/tm/profesionales**').as('create');

        complete({
            nombre: 'Pedro',
            apellido: 'Ramirez',
            sexo: 'femenino',
            fechaNacimiento: '05/11/1991',
            documento: '11111111'
        });

        cy.plexPhone('label="Número"', '29945876as12').should('have.value', '2994587612');

        cy.plexButton("Guardar").click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('Ramirez');
            expect(xhr.response.body.nombre).to.be.eq('Pedro');
            expect(xhr.response.body.documento).to.be.eq('11111111');
        });
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional no matriculado existente en renaper', () => {
        cy.goto('/tm/profesional/create', token);
        cy.server();
        cy.route('POST', '**/core/tm/profesionales**').as('create');
        cy.fixture('renaper-1').as('fxRenaper')
        cy.route('GET', '**/api/modules/fuentesAutenticas/renaper?documento=26487951&sexo=M', '@fxRenaper').as('renaper');

        complete({
            sexo: 'masculino',
            documento: '26487951'
        });

        cy.get('plex-layout-sidebar').plexButton('Validar con servicios de Renaper').click();
        cy.wait('@renaper').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.datos.apellido).to.be.eq('TEST');
            expect(xhr.response.body.datos.nombres).to.be.eq('PROFESIONAL');
        });

        check({
            nombre: 'PROFESIONAL',
            apellido: 'TEST',
            fechaNacimiento: '09/03/1990',
            sexo: 'Masculino'
        })

        cy.plexPhone('label="Número"', '2994557612');

        cy.plexButton("Guardar").click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('TEST');
            expect(xhr.response.body.nombre).to.be.eq('PROFESIONAL');
            expect(xhr.response.body.documento).to.be.eq('26487951');

        });
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional no matriculado no existente en renaper', () => {
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.fixture('renaper-error').as('fxRenaper')
        cy.route('GET', '**/api/modules/fuentesAutenticas/renaper?documento=15654898&sexo=F', '@fxRenaper').as('renaper');
        cy.route('POST', '**/core/tm/profesionales**').as('create');

        cy.plexInt('label="Número de Documento"', '15654898');
        cy.get('plex-layout-sidebar').should('not.contain', 'plex-button[label="Validar con servicios de Renaper"]');

        cy.plexSelectType('label="Sexo"', 'femenino');

        cy.get('plex-layout-sidebar').plexButton('Validar con servicios de Renaper').click();
        cy.wait('@renaper').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.datos.apellido).to.be.eq('');
            expect(xhr.response.body.datos.nombres).to.be.eq('');
        });

        cy.contains('El profesional no se encontró en RENAPER');
        cy.swal('confirm');

        cy.plexText('label="Nombre"', 'Julieta');
        cy.plexText('label="Apellido"', 'Rodriguez');
        cy.plexDatetime('label="Fecha de nacimiento"', '05/12/1987');

        cy.plexBool('label="No posee ningún tipo de contacto"', true).should('be.checked');

        cy.plexButton('Guardar').click();

        cy.wait('@create').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('Rodriguez');
            expect(xhr.response.body.nombre).to.be.eq('Julieta');
            expect(xhr.response.body.documento).to.be.eq('15654898');
        });
        cy.contains('¡El profesional se creó con éxito!');
    });

    it('crear profesional duplicado', () => {
        cy.goto('/tm/profesional/create', token);

        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales?documento=4163782').as('get');

        cy.plexText('label="Nombre"', 'ALICIA BEATRIZ');
        cy.plexText('label="Apellido"', 'ESPOSITO');
        cy.plexInt('label="Número de Documento"', '4163782');

        cy.plexSelectType('label="Sexo"', 'femenino');
        cy.plexDatetime('label="Fecha de nacimiento"', '12/12/1995');

        cy.plexPhone('label="Número"', '2994587612');

        cy.plexButton('Guardar').click();

        cy.wait('@get').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0].nombre).to.be.eq('ALICIA BEATRIZ');
            expect(xhr.response.body[0].apellido).to.be.eq('ESPOSITO');
            expect(xhr.response.body[0].documento).to.be.eq('4163782');
        });
        cy.contains('El profesional que está intentando guardar ya se encuentra cargado');
    });

    it('búsqueda de profesional matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales**').as('get');

        // ingreso los valores en cada uno de los filtros
        cy.plexInt('label="Documento"', '4466777');
        cy.plexText('label="Nombre"', 'MARIA');
        cy.plexText('label="Apellido"', 'PEREZ');
        cy.wait('@get').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0].nombre).to.be.eq('MARIA');
            expect(xhr.response.body[0].apellido).to.be.eq('PEREZ');
            expect(xhr.response.body[0].documento).to.be.eq('4466777');
        });

        // selecciono a Nilda Bethy Judzik de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'PEREZ, MARIA');
        cy.get('plex-layout-sidebar').should('contain', '4466777');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-info"]').should('contain', 'Matriculado');

        // TEST INVIABLE cambia el valor con el paso del tiempo
        // cy.get('plex-layout-sidebar').should('contain', '11/01/1941 | ' + Cypress.moment().diff('11/01/1941', 'years') + ' años');

        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '27041637825');
        // cy.get('plex-layout-sidebar').should('contain', 'FARMACEUTICO - Matrícula: 681');
    });

    it('búsqueda de profesional no matriculado', () => {
        cy.goto('/tm/profesional', token);

        cy.server();
        cy.route('GET', '**/api/core/tm/profesionales**').as('get');
        cy.plexText('label="Nombre"', 'ALICIA');
        cy.plexText('label="Apellido"', 'PRUEBA');
        cy.wait('@get').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body).to.have.length(1);
            expect(xhr.response.body[0].nombre).to.be.eq('ALICIA');
            expect(xhr.response.body[0].apellido).to.be.eq('PRUEBA');
        });

        // seleccionó a Usuario Prueba de la tabla de resultados (primer resultado)
        cy.get('tbody').find('tr').first().click();

        // valido que el sidebar haya traído todos los datos
        cy.get('plex-layout-sidebar strong').should('contain', 'PRUEBA, ALICIA');
        cy.get('plex-layout-sidebar').should('contain', '1711999');
        cy.get('plex-layout-sidebar div[class="row mb-1"] div[class="col"]').find('span[class="badge badge-warning"]').should('contain', 'No Matriculado');
        cy.get('plex-layout-sidebar').should('contain', 'Femenino');
        cy.get('plex-layout-sidebar').should('contain', '1217429393');
        // cy.get('plex-layout-sidebar').should('contain', 'Médico - Matrícula: 2');
        // cy.get('plex-layout-sidebar').should('contain', 'Citogenética (R) - Matrícula: 412');
        // cy.get('plex-layout-sidebar').should('contain', 'Bioquímica y Nutrición (R) - Matrícula: 533');

    });

})