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
import './commands'
import './http'
import './plex'
import './seed'
import './time'


const addContext = require('mochawesome/addContext')

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