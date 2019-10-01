Cypress.Commands.add('swal', (acction) => {
    return cy.get('div').then(($body) => {
        if ($body.hasClass('swal2-container')) {
            cy.get(`.swal2-${acction}`).click({
                force: true
            })
        }
    });
});

Cypress.Commands.add('plexSelect', { prevSubject: 'optional' }, (subject, label, option) => {
    const selector = `plex-select[${label}]`;
    let element;
    if (subject) {
        element = cy.wrap(subject).find(selector)
    } else {
        element = cy.get(selector);
    }
    element = element.children().children('.selectize-control').click().find(`.option[data-value=${option}]`).click({
        force: true
    });
    return element;
});

Cypress.Commands.add('plexSelectType', { prevSubject: 'optional' }, (subject, label, text = null) => {
    const selector = `plex-select[${label}] input`;
    let element;
    if (subject) {
        element = cy.wrap(subject).find(selector);
    } else {
        element = cy.get(selector);
    }
    element = element.first();
    if (text) {
        element = element.type(`${text}{enter}`, {
            force: true
        });
    }
    return element.parent();
});


Cypress.Commands.add('plexInt', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).get(`plex-int[${label}] input`);
    } else {
        element = cy.get(`plex-int[${label}] input`);
    }
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexPhone', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).get(`plex-phone[${label}] input`);
    } else {
        element = cy.get(`plex-phone[${label}] input`);
    }
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexText', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).get(`plex-text[${label}] input`).first();
    } else {
        element = cy.get(`plex-text[${label}] input`).first();
    }
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexTextArea', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).get(`plex-text[${label}] textarea`).first();
    } else {
        element = cy.get(`plex-text[${label}] textarea`).first();
    }
    if (text) {
        element.type(text);
    }
    return element;
});


Cypress.Commands.add('plexButton', { prevSubject: 'optional' }, (subject, label) => {
    let element;
    if (subject) {

        element = cy.wrap(subject).get('plex-button').contains(label);
    } else {
        element = cy.get('plex-button').contains(label);
    }
    return element;
});

Cypress.Commands.add('plexButtonIcon', { prevSubject: 'optional' }, (subject, icon) => {
    let element;
    if (subject) {

        element = cy.wrap(subject).get(`plex-button[icon="${icon}"]`);
    } else {
        element = cy.get(`plex-button[icon="${icon}"]`);
    }
    return element;
});

Cypress.Commands.add('plexDatetime', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject)
    } else {
        element = cy;
    }
    element = element.get(`plex-datetime[${label}] input`);
    if (text) {
        element.type(`${text}{enter}`);
    }
    return element;
});

Cypress.Commands.add('plexBool', { prevSubject: 'optional' }, (subject, label, checked = false) => {
    let element;
    if (subject) {
        element = cy.wrap(subject)
    } else {
        element = cy;
    }
    element = element.get(`plex-bool[${label}] input[type="checkbox"]`);
    if (checked) {
        element = element.check({ force: true });
    }
    return element;
});

/**
 * @decrecated
 */
Cypress.Commands.add('selectOption', (label, value) => {
    return cy.get(`plex-select[${label}]`).children().children('.selectize-control').click()
        .find(`.option[data-value=${value}]`).click({
            force: true
        });
});

/**
 * @decrecated
 */

Cypress.Commands.add('selectWrite', (label, value) => {
    return cy.get(`plex-select[${label}] input`).first().type(`${value}{enter}`, {
        force: true
    });
});