// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import 'cypress-file-upload';

Cypress.Commands.add("login", (usuario, password, id) => {
    let token;
    return cy.request('POST', Cypress.env('API_SERVER') + '/api/auth/login', {
        usuario,
        password
    }).then((response) => {
        token = response.body.token;
        return response = cy.request({
            url: Cypress.env('API_SERVER') + '/api/auth/organizaciones',
            method: 'GET',
            headers: {
                Authorization: 'JWT ' + token
            },
        }).then((response) => {
            //Si no se especifica id de organizacion, por defecto se usa el id del HPN
            const defaultId = '57e9670e52df311059bc8964';
            return response = cy.request({
                url: Cypress.env('API_SERVER') + '/api/auth/v2/organizaciones',
                method: 'POST',
                headers: {
                    Authorization: 'JWT ' + token
                },
                body: {
                    organizacion: id ? id : defaultId
                }
            }).then((response) => {
                return response.body.token;
            });
        });
    });
});

Cypress.Commands.add('goto', (url, token, hudsToken) => {
    if (token) {
        cy.server();
        cy.route('GET', '**/api/auth/sesion**').as('sesion');
    }
    cy.visit(url, {
        onBeforeLoad: (win) => {
            if (token) {
                win.sessionStorage.setItem('jwt', token);
            } else {
                win.sessionStorage.removeItem('jwt');
            }
            if (hudsToken) {
                win.sessionStorage.setItem('huds-token', hudsToken);
            } else {
                win.sessionStorage.removeItem('huds-token');
            }
        }
    });
    if (token) {
        return cy.wait('@sesion');
    }
});

Cypress.Commands.add('buscarPaciente', (pacienteDoc, cambiarPaciente = true) => {
    cy.plexButton("Buscar Paciente").click();
    cy.plexText('name="buscador"', pacienteDoc);
    cy.server();
    cy.route('GET', '**/api/core/mpi/pacientes**').as('listaPacientes');
    cy.wait('@listaPacientes');
    const documento = pacienteDoc.substr(0, pacienteDoc.length - 6) + '.' + pacienteDoc.substr(-6, 3) + '.' + pacienteDoc.substr(-3);
    cy.get('plex-item').contains(documento).click();
    if (cambiarPaciente) {
        cy.plexButton("Cambiar Paciente").click();
        cy.plexText('name="buscador"', pacienteDoc);
        cy.wait('@listaPacientes');
        cy.get('plex-item').contains(documento).click();
    }
});

Cypress.Commands.add('taskN', (name, argumentos) => {
    function runTask(name, argumentos, resultado) {
        if (argumentos.length > 0) {
            return cy.task(name, argumentos[0]).then((taskResponse) => {
                const [_, ...args] = argumentos;
                return runTask(name, args, [...resultado, taskResponse]);
            })
        } else {
            return resultado;
        }
    }
    return runTask(name, argumentos, []);
});