

context('MPI - Pacientes', () => {
    let token;
    let id;
    before(() => {
          cy.login('38906735', 'asd').then(t => {
            token = t;
            cy.fixture('pacientes/paciente-validado').then(paciente => {
                cy.post('/api/core_v2/mpi/pacientes', paciente, token).then((xhr) => {
                    id = xhr.body.id;  
                });
            });
        })
    })


    after(() => {
        cy.delete('/api/core_v2/mpi/pacientes/' + id, token);
    });

    it('GET Paciente ', () => {
        const request = cy.get('/api/core_v2/mpi/pacientes/59de0ecb96027d180fc4d8d4', token); 
        request.its('status').should('equal', 400);
    });

    it('GET paciente - fields query', () => {  
         
        cy.get('/api/core_v2/mpi/pacientes/' + id, token, { fields: 'nombre apellido' }).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.property('id', id);
            expect(xhr.body).to.have.property('nombre', 'MARIA');
            expect(xhr.body).to.not.have.property('documento');
            cy.log(xhr.body)
        });

        cy.get('/api/core_v2/mpi/pacientes/' + id, token).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body).to.have.property('id', id) 
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


    it('debe fallar con paciente repetido', () => {
        cy.fixture('pacientes/paciente-validado').then(paciente => {
            cy.post('/api/core_v2/mpi/pacientes', paciente, token).then((xhr) => {
                expect(xhr.status).to.gte(400);
            });
        });
    });

    it('search paciente by documento', () => {
        cy.patch('/api/core_v2/mpi/pacientes/' + id, { genero: 'masculino', documento: '12312312' }, token).then(xhr => {
            expect(xhr.status).to.eq(200);
            expect(xhr.body.genero).to.be.equal('masculino');
            expect(xhr.body.documento).to.be.equal('54379999');
        });
    });
});


