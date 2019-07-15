

context('MPI - Pacientes', () => {
    let token;
    let id;
    let paciente_a;
    let paciente_b;
    let paciente_c;

    before(() => {
        cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.fixture('pacientes/paciente-validado').then(paciente => {
                cy.post('/api/core_v2/mpi/pacientes', paciente, token).then((xhr) => {
                    id = xhr.body.id;
                });
            });

            cy.fixture('pacientes/paciente-match-a').then(pac_a => {
                cy.post('/api/core_v2/mpi/pacientes', pac_a, token).then((xhr) => {
                    paciente_a = xhr.body;
                });
            });

            cy.fixture('pacientes/paciente-match-c').then(pac_c => {
                cy.post('/api/core_v2/mpi/pacientes', pac_c, token).then((xhr) => {
                    paciente_c = xhr.body;
                });
            });

        })
    })


    after(() => {
        cy.delete('/api/core_v2/mpi/pacientes/' + id, token);
        cy.delete('/api/core_v2/mpi/pacientes/' + paciente_a.id, token);
        cy.delete('/api/core_v2/mpi/pacientes/' + paciente_c.id, token);
    });

    it('get paciente ', () => {
        const request = cy.get('/api/core_v2/mpi/pacientes/59de0ecb96027d180fc4d8d4', token);
        request.its('status').should('equal', 400);
    });

    it('get paciente - fields query', () => {
        cy.get('/api/core_v2/mpi/pacientes/' + id, token, { fields: 'nombre apellido' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.property('id', id);
            expect(xhr.body).to.have.property('nombre', 'MARIA');
            expect(xhr.body).to.not.have.property('documento');
        });
        cy.get('/api/core_v2/mpi/pacientes/' + id, token, { fields: '-financiador' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.property('id', id)
        });
    });

    it('get paciente - subrecurso contacto', () => {
        cy.get('/api/core_v2/mpi/pacientes/' + paciente_a.id + '/contactos', token).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.lengthOf(1);
        });
    });

    it('search paciente partial name', () => {
        cy.get('/api/core_v2/mpi/pacientes', token, { nombre: '^ELIZABETH' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.lengthOf(2);
            // expect(xhr.body[0]).to.have.property('nombre', 'MARIA');
        });
    });

    it('search paciente by email', () => {
        cy.get('/api/core_v2/mpi/pacientes', token, { email: 'hola@andes.gob.ar' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.lengthOf(1);
            // expect(xhr.body[0]).to.have.property('nombre', 'MARIA');
        });
    });

    it('search paciente by documento', () => {
        cy.get('/api/core_v2/mpi/pacientes', token, { search: '54379999' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.lengthOf(1);
            expect(xhr.body[0]).to.have.property('nombre', 'MARIA');
        });
    });

    it('search paciente by nombre', () => {
        cy.get('/api/core_v2/mpi/pacientes', token, { search: 'maria chavez' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.lengthOf(1);
            expect(xhr.body[0]).to.have.property('nombre', 'MARIA');
        });
    });


    it('match paciente -debe matchear a 85%', () => {
        let paciente_match;
        cy.fixture('pacientes/paciente-match').then(pac => {
            paciente_match = pac;
            cy.post('/api/core_v2/mpi/pacientes/match', paciente_match, token).then((xhr) => {
                expect(xhr.status).to.eq(200);
                expect(xhr.body).to.have.lengthOf(1);
                expect(xhr.body[0]._score).to.be.equal(0.85);
            });
        });
    });

    it('match paciente - debe obtener una lista de pacientes ordenados por score', () => {
        cy.fixture('pacientes/paciente-match-b').then(pac_b => {
            paciente_b = pac_b;
            cy.post('/api/core_v2/mpi/pacientes/match', paciente_b, token).then((xhr) => {
                expect(xhr.status).to.eq(200);
                expect(xhr.body).to.have.lengthOf(2);

            });
        });
    });

    it('post paciente - debe fallar con paciente repetido', () => {
        cy.fixture('pacientes/paciente-validado').then(paciente => {
            cy.post('/api/core_v2/mpi/pacientes', paciente, token).then((xhr) => {
                expect(xhr.status).to.gte(400);
            });
        });
    });

    it('patch paciente - debe modificar el documento y género de un paciente', () => {
        cy.patch('/api/core_v2/mpi/pacientes/' + id, { genero: 'masculino', documento: '12312312' }, token).then(xhr => {
            cy.log('LOG', xhr.body);
            expect(xhr.status).to.eq(200);
            expect(xhr.body.genero).to.be.equal('masculino');
            expect(xhr.body.documento).to.be.equal('54379999');
        });
    });


});


