/// <reference types="Cypress" />

context('Vacunacion Listado', () => {
    let token;
    let validado1;
    let validado2;
    let validado3;
    let validado4;
    let validado5;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
            cy.task('database:seed:paciente');
        });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => { validado1 = p; });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => { validado2 = p; });
        cy.task('database:create:paciente', { template: 'validado' }).then(p => { validado3 = p; });
        cy.task('database:create:paciente', { template: 'validado', fechaNacimiento: "1991-02-16T04:00:00.000Z" }).then(p => { validado4 = p; });
        cy.task('database:create:paciente', { template: 'validado', fechaNacimiento: "1971-03-18T04:00:00.000Z" }).then(p => { validado5 = p; });
    })

    beforeEach(() => {
        cy.server();
        cy.goto('/vacunacion/listado', token);
        cy.route('GET', '**/api/core/tm/grupo-poblacional').as('getGrupoPoblacional');
        cy.route('GET', '**/api/core-v2/mpi/pacientes/**').as('getPaciente');
        cy.route('GET', '**/api/core-v2/mpi/pacientes?**').as('busquedaPaciente');
        cy.route('GET', '**/api/core/tm/grupo-poblacional?**').as('getGrupos');
        cy.route('PATCH', '**/api/modules/vacunas/inscripcion-vacunas/**').as('patchPaciente');
        cy.route('POST', '**/api/modules/vacunas/inscripcion-vacunas').as('postInscripcion');
    })

    it('Filtros - grupos', () => {
        cy.get('plex-layout-main').plexSelect('name="grupo"', 0).click();
        cy.get('table tbody tr').should('length', 0);
        cy.get('plex-layout-main').plexSelect('name="grupo"', 1).click();
        cy.get('table tbody tr').should('length', 1);
        cy.get('plex-layout-main').plexSelect('name="grupo"', 2).click();
        cy.get('table tbody tr').should('length', 0);
        cy.get('plex-layout-main').plexSelect('name="grupo"', 3).click();
        cy.get('table tbody tr').should('length', 0);
        cy.get('plex-layout-main').plexSelect('name="grupo"', 4).click();
        cy.get('table tbody tr').should('length', 1);
    });

    it('Filtros - paciente', () => {
        cy.get('plex-layout-main').plexText('name="paciente"', '10000000');
        cy.get('table tbody tr').should('length', 1);
        cy.get('plex-layout-main').plexText('name="paciente"', `{selectall}{backspace}andes paciente validado`);
        cy.get('table tbody tr').should('length', 1);
    });

    it('Verifica datos en listado y sidebar', () => {
        cy.get('tbody tr').eq(0).contains(' Personas mayores entre 18 y 59 .. ');
        cy.get('tbody tr').eq(0).contains(' 10000000 ');
        cy.get('tbody tr').eq(0).contains(' ANDES, PACIENTE VALIDADO ');
        cy.get('tbody tr').eq(0).contains(' M ');
        cy.get('tbody tr').eq(0).contains(' 30 años ');
        cy.get('tbody tr').eq(0).contains(' Neuquén ');
        cy.get('tbody tr').eq(0).contains(' 28/04/2021 ');
        cy.get('tbody tr').eq(0).plexBadge('pendiente', 'warning');
        cy.get('tbody tr').eq(0).plexIcon('close').first();
        cy.get('tbody tr').eq(0).plexIcon('close').last();
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('ANDES');
            expect(xhr.response.body.nombre).to.be.eq('PACIENTE VALIDADO');
            expect(xhr.response.body.nombreCompleto).to.be.eq('PACIENTE VALIDADO ANDES');
            expect(xhr.response.body.documento).to.be.eq('10000000');
            expect(xhr.response.body.estado).to.be.eq('validado');
        });
        cy.get('plex-detail section').plexBadge('Pendiente', 'default');
        cy.get('plex-detail section').contains(' Grupo: Personas mayores entre 18 y 59 años, con factores de riesgo ');
        cy.get('plex-detail plex-grid').plexLabel('Neuquén');
        cy.get('plex-detail plex-grid').plexLabel('Si');
        cy.get('tbody tr').eq(1).contains(' Personal de Salud ');
        cy.get('tbody tr').eq(1).contains(' 20000000 ');
        cy.get('tbody tr').eq(1).contains(' ANDES, PACIENTE TEMPORAL ');
        cy.get('tbody tr').eq(1).contains(' F ');
        cy.get('tbody tr').eq(1).contains(' Neuquén ');
        cy.get('tbody tr').eq(1).contains(' 28/04/2021 ');
        cy.get('tbody tr').eq(1).plexBadge('pendiente', 'warning');
        cy.get('tbody tr').eq(1).plexIcon('check');
        cy.get('tbody tr').eq(1).contains(' No corresponde ');
        cy.get('tbody tr').eq(1).contains(' 20000000 ').click();
        cy.wait('@getPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.apellido).to.be.eq('ANDES');
            expect(xhr.response.body.nombre).to.be.eq('PACIENTE TEMPORAL');
            expect(xhr.response.body.nombreCompleto).to.be.eq('PACIENTE TEMPORAL ANDES');
            expect(xhr.response.body.documento).to.be.eq('20000000');
            expect(xhr.response.body.estado).to.be.eq('temporal');

        });
    });

    it('Cambiar paciente a inhabilitado', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexButton('GUARDAR').should('have.prop', 'disabled', true);
        cy.get('plex-layout-sidebar').plexText('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-sidebar').plexText('name="email"', '{selectall}{backspace}prueba@gmail.com');
        cy.get('plex-layout-sidebar').plexSelect('label="Estado"', 1).click();
        cy.get('plex-layout-sidebar plex-title').plexButton('GUARDAR').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('inhabilitado');
        });
    })

    it('Cambiar de grupo factor-riesgo a discapacidad', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexSelect('label="Grupo"', 1).click();
        cy.get('plex-layout-sidebar').plexSelect('label="Estado"', 3).click();
        cy.get('plex-layout-sidebar').plexText('label="Certificado Único de Discapacidad"', '22222');
        cy.get('plex-layout-sidebar').plexSelect('name="diaseleccionados"', 1).click();
        cy.get('plex-layout-sidebar plex-title').plexButton('GUARDAR').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.grupo.nombre).to.be.eq('discapacidad');
            expect(xhr.response.body.morbilidades.length).to.be.eq(0);
            expect(xhr.response.body.alergia).to.be.eq(true);
            expect(xhr.response.body.cud).to.be.eq('22222');
            expect(xhr.response.body.diaseleccionados).to.be.eq('martes');
            expect(xhr.response.body.estado).to.be.eq('habilitado');
        });
        cy.get('tbody tr').eq(0).plexBadge('habilitado', 'success');
    });

    it('Cambiar de factor-riesgo a personal de salud', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexSelect('label="Grupo"', 0).click();
        cy.get('plex-layout-sidebar').plexSelect('label="Estado"', 3).click();
        cy.get('plex-layout-sidebar').plexText('name="establecimiento"', 'prueba');
        cy.get('plex-layout-sidebar').plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.get('plex-layout-sidebar plex-title').plexButton('GUARDAR').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.grupo.nombre).to.be.eq('personal-salud');
            expect(xhr.response.body.morbilidades.length).to.be.eq(0);
            expect(xhr.response.body.alergia).to.be.eq(true);
            expect(xhr.response.body.establecimiento).to.be.eq('prueba');
            expect(xhr.response.body.estado).to.be.eq('habilitado');

        });
    });

    it('Cambiar de factor-riesgo a policia', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexSelect('label="Grupo"', 2).click();
        cy.get('plex-layout-sidebar').plexSelect('label="Estado"', 3).click();
        cy.get('plex-layout-sidebar').plexBool('name="condicion"', false).click({ force: true });
        cy.get('plex-layout-sidebar plex-title').plexButton('GUARDAR').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.grupo.nombre).to.be.eq('policia');
            expect(xhr.response.body.alergia).to.be.eq(true);
            expect(xhr.response.body.condicion).to.be.eq(true);
            expect(xhr.response.body.morbilidades.length).to.be.eq(0);
            expect(xhr.response.body.estado).to.be.eq('habilitado');
        });
    });

    it('Agregar notas a paciente', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('comment-outline').click();
        cy.get('plex-layout-sidebar').plexSelect('name="nota"', 0).click();
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('Turno asignado');
        });
        cy.get('plex-layout-sidebar plex-title').plexIcon('comment').click();
        cy.get('plex-layout-sidebar').plexSelect('name="nota"', 1).click();
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('No quiere vacunarse');
        });
        cy.get('plex-layout-sidebar plex-title').plexIcon('comment').click();
        cy.get('plex-layout-sidebar').plexSelect('name="nota"', 2).click();
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('Ya se vacunó');
        });
        cy.get('plex-layout-sidebar plex-title').plexIcon('comment').click();
        cy.get('plex-layout-sidebar').plexSelect('name="nota"', 3).click();
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('No contesta');
        });
        cy.get('plex-layout-sidebar plex-title').plexIcon('comment').click();
        cy.get('plex-layout-sidebar').plexSelect('name="nota"', 4).click();
        cy.get('plex-layout-sidebar').plexTextArea('name="notaText"', 'prueba');
        cy.get('plex-layout-sidebar').plexButton('Guardar').click();
        cy.toast('success', 'Nota agregada con éxito');
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.nota).to.be.eq('prueba');
        });
    });

    function format(s) {
        return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
    }

    it('Personal salud - nueva inscripción', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado1.documento)).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 1).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexBool('name="alergia"', false).click({ force: true });
        cy.get('plex-layout-main').plexText('name="establecimiento"', 'prueba establecimiento');
        cy.get('plex-layout-main').plexSelectType('label="Localidad del establecimiento"', 'neuquen');
        cy.get('plex-layout-main').plexRadio('name="relacion"', 5);
        cy.get('plex-layout-main').plexSelectType('name="profesiones"', 'enfermero');
        cy.get('plex-layout-main').plexInt('name="matricula"', 2222);
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.toast('success', 'Inscripción guardada');
        cy.wait('@postInscripcion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('pendiente');
            expect(xhr.response.body.alergia).to.be.eq(true);
            expect(xhr.response.body.establecimiento).to.be.eq('prueba establecimiento');
            expect(xhr.response.body.localidadEstablecimiento.id).to.be.eq('57f538a472325875a199a82d');
            expect(xhr.response.body.localidadEstablecimiento.nombre).to.be.eq('Neuquén');
            expect(xhr.response.body.grupo.nombre).to.be.eq('personal-salud');
            expect(xhr.response.body.relacion).to.be.eq('otros');
            expect(xhr.response.body.matricula).to.be.eq('2222');
        });
    });

    it('Mayores de 60 - nueva inscripción', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado2.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado2.documento)).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 0).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexBool('name="vacuna"', false).click({ force: true });
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.toast('success', 'Inscripción guardada');
        cy.wait('@postInscripcion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('pendiente');
            expect(xhr.response.body.vacuna).to.be.eq(true);
            expect(xhr.response.body.grupo.nombre).to.be.eq('mayores60');
        });
    });

    it('Policia - nueva inscripción', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado3.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado3.documento)).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 3).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexBool('name="convaleciente"', false).click({ force: true });
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.toast('success', 'Inscripción guardada');
        cy.wait('@postInscripcion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('pendiente');
            expect(xhr.response.body.convaleciente).to.be.eq(true);
            expect(xhr.response.body.grupo.nombre).to.be.eq('policia');
        });
    });

    it('Adultos mayores de 18 años con discapacidad y factores de riesgos - nueva inscripción', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado4.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado4.documento)).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 1).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexText('name="cud"', '111222333');
        cy.get('plex-layout-main').plexSelect('name="diaseleccionados"', 1).click();
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.toast('success', 'Inscripción guardada');
        cy.wait('@postInscripcion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('pendiente');
            expect(xhr.response.body.grupo.nombre).to.be.eq('discapacidad');
            expect(xhr.response.body.diaseleccionados).to.be.eq('martes');
            expect(xhr.response.body.cud).to.be.eq('111222333');
        });
    });

    it('Personas mayores entre 18 y 59 años, con factores de riesgo - nueva inscripción', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado5.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado5.documento)).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 3).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexRadioMultiple('name="plex-morbilidades"', 0);
        cy.get('plex-layout-main').plexRadioMultiple('name="plex-morbilidades"', 1);
        cy.get('plex-layout-main').plexRadioMultiple('name="plex-morbilidades"', 2);
        cy.get('plex-layout-main').plexBool('name="convaleciente"', false).click({ force: true });
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.toast('success', 'Inscripción guardada');
        cy.wait('@postInscripcion').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('pendiente');
            expect(xhr.response.body.grupo.nombre).to.be.eq('factores-riesgo');
            expect(xhr.response.body.convaleciente).to.be.eq(true);
            expect(xhr.response.body.morbilidades.length).to.be.eq(3);
            expect(xhr.response.body.morbilidades[0]).to.be.eq('diabetes');
            expect(xhr.response.body.morbilidades[1]).to.be.eq('obesidad');
            expect(xhr.response.body.morbilidades[2]).to.be.eq('cardiovascular');
        });
    });


    it('Cartel de paciente ya inscripto', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', '10000000');
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format('10000000')).click();
        cy.get('plex-layout-main').plexSelect('name="grupo"', 3).click();
        cy.plexPhone('name="telefono"', '{selectall}{backspace}2999999999');
        cy.get('plex-layout-main').plexText('name="email"', 'prueba@gmail.com');
        cy.get('plex-layout-main').plexBool('name="convaleciente"', false).click({ force: true });
        cy.get('plex-layout-main plex-title').plexButton('Guardar').click();
        cy.swal('confirm', 'Ya existe una inscripción activa para el paciente seleccionado');
    });

    it('Verificar cantidad de grupos pacientes entre 18 y 59 años', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado5.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado5.documento)).click();
        cy.wait('@getGrupos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(6);
        });
    });

    it('Verificar cantidad de grupos pacientes mayores de 60', () => {
        cy.get('plex-layout-main plex-title').plexButton('NUEVA INSCRIPCIÓN').click();
        cy.get('plex-layout-sidebar').plexText('name="buscador"', validado1.documento);
        cy.wait('@busquedaPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
        });
        cy.get('plex-layout-sidebar paciente-listado').contains(format(validado1.documento)).click();
        cy.wait('@getGrupos').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.length).to.be.eq(5);
        });
    });

    it('Cambiar paciente a fallecido', () => {
        cy.get('tbody tr').eq(0).contains(' 10000000 ').click();
        cy.get('plex-layout-sidebar plex-title').plexIcon('pencil').click();
        cy.get('plex-layout-sidebar').plexSelect('name="estado"', 2).click();
        cy.get('plex-layout-sidebar').plexButton('GUARDAR').click();
        cy.wait('@patchPaciente').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            expect(xhr.response.body.estado).to.be.eq('fallecido');
        });
        cy.toast('success', 'La inscripción ha sido actualizada exitosamente');
    });

})