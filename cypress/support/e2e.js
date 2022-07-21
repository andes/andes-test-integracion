// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:

const moment = require('moment');
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.moment = moment;

import './commands'
import './http'
import './plex'
import './seed'
import './time'
import './gestorUsuario'
import './rup'
import './mapa-camas'
import './privacidad'

const addContext = require('mochawesome/addContext');

Cypress.on('uncaught:exception', (err) => {
    if (err.message.includes('ResizeObserver')) {
        return false
    }
})

Cypress.on('test:after:run', (test, runnable) => {
    const context = {
        title: 'Filename',
        value: Cypress.spec.name
    };
    addContext({ test }, context);
    if (test.state === 'failed') {
        const screenshotFileName = `${runnable.parent.title} -- ${test.title} (failed).png`
        addContext({ test }, `assets/${Cypress.spec.name}/${screenshotFileName}`);
    }
})

Cypress.on('uncaught:exception', (err) => {
    if (resizeObserverLoopErrRe.test(err.message)) {
        return false
    }
})

Cypress.on('window:before:load', win => {
    cy.stub(win.console, 'error', (error, mensaje) => {
        if (error.toString().includes('cordova_not_available')) {
           return;
        }
        throw mensaje;
    })

    
})