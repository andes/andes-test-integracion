

context('MPI - Pacientes', () => {
    let token;
    before(() => {
          cy.login('38906735', 'asd').then(t => {
           // cy.login('30643636', 'asd').then(t => {
            token = t;
        })
    })

    it('GET Paciente ', () => {
        const request = cy.get('/api/core_v2/mpi/pacientes/', '59de0ecb96027d180fc4d8d4', token); 
        request.its('status').should('equal', 400);
    });


    it.only('save paciente validado sin contacto, ', () => {   
        cy.fixture('pacientes/paciente-validado').then(paciente => {
            paciente.id = undefined;
            cy.post('/api/core_v2/mpi/pacientes', paciente, token).then((xhr) => {
                cy.log('XHR');
                expect(xhr.status).to.be.eq(200);
                let id = xhr.response.body.id;
                //Recupero el paciente
                const request = cy.get('/api/core_v2/mpi/pacientes', id, token);
                request.its('status').should('equal', 200);
                // Elimina el paciente Ingresado

            });

        })
        
    })

    it('DELETE Paciente', () => {
        const id = "5cdc5073909769760c0836bc";
        const request = cy.request({
            method: 'DELETE',
            url: Cypress.env('API_SERVER') + '/api/core_v2/mpi/pacientes/' + id,
            headers: {
                Authorization: `JWT ${token}`
            } 
        });
        request.its('status').should('equal', 200);
        

    })

})


