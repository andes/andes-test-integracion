Cypress.Commands.add('swal', (acction, message = null) => {
    if (message) {
        cy.get('div.swal2-modal').contains(message);
    }
    return cy.get('div.swal2-modal').find(`.swal2-${acction}`).click({ force: true });
});

Cypress.Commands.add('introjsTooltip', () => {
    return cy.get('div.introjs-tooltip').find('.introjs-donebutton').click({ force: true });
});

/**
 * selectize no renderiza las opciones hasta que no interactuas. Por esos en los select que son fijas
 * hay que hacer un click o escribir antes.
 */

Cypress.Commands.add('plexSelect', { prevSubject: 'optional' }, (subject, label, option) => {
    const selector = `plex-select[${label}]`;
    let element;
    if (subject) {
        element = cy.wrap(subject).find(selector)
    } else {
        element = cy.get(selector);
    }
    if (option !== null && option !== undefined) {
        if (typeof option === 'string') {
            element = element.children()
                .children('.selectize-control')
                .find('.selectize-dropdown-content')
                .find(`div[data-value="${option}"]`, { force: true });
        } else {
            element.children().children('.selectize-control').click();
            element.find('.selectize-dropdown-content').children().eq(option);
        }
    } else {
        return element.children().eq(0);
    }



    return element;
});

Cypress.Commands.add('plexSelectType', { prevSubject: 'optional' }, (subject, label, data = null, clicked = true, first = false) => {
    const selector = `plex-select[${label}] input`;
    let element;
    if (subject) {
        element = cy.wrap(subject).find(selector);
    } else {
        element = cy.get(selector);
    }
    if (first) {
        element = element.first();

    }
    if (data && typeof data === 'string') {
        const textForType = clicked ? `${data}{enter}` : data;
        element = element.type(textForType, {
            force: true
        });
    } else if (data) {
        if (data.clear) {
            element.type('{backspace}', { force: true });
        }
        if (data.text) {
            const textForType = clicked ? `${data.text}{enter}` : data.text;
            element = element.type(textForType, {
                force: true
            });
        }
    }
    return element.parent().parent().parent();
});

Cypress.Commands.add('plexSelectAsync', { prevSubject: 'optional' }, (subject, label, text, alias, option) => {
    if (subject) {
        cy.wrap(subject).plexSelectType(label, text, false);
        cy.wait(alias);
        cy.wrap(subject).plexSelect(label, option).click({ force: true });
    } else {
        cy.plexSelectType(label, text, false);
        cy.wait(alias);
        cy.plexSelect(label, option).click({ force: true });
    }
});

Cypress.Commands.add('plexSelectTypeDinamico', { prevSubject: 'optional' }, (subject, label, text = null) => {

    const element = cy.get('plex-select', { prevSubject: subject })
        .find('label').contains(label)
        .parent().parent()
        .find('input');
    if (text) {
        element.type(text);
    }

    return element;
});

Cypress.Commands.add('isSelectedID', { prevSubject: 'element' }, (subject, value) => {
    return cy.wrap(subject).find(`.selectize-input .item[data-value="${value}"]`);
});

Cypress.Commands.add('isSelectedLabel', { prevSubject: 'element' }, (subject, label) => {
    return cy.wrap(subject).find(`.selectize-input .item`).contains(label);
});

Cypress.Commands.add('clearSelect', { prevSubject: 'element' }, (subject, id) => {
    if (!id) {
        return cy.wrap(subject).find('.adi-close-circle').click({ force: true });
    } else {
        return cy.wrap(subject).find(`.selectize-input .item[data-value="${id}"]`).find('.adi-close-circle').click({ force: true });

    }
});

Cypress.Commands.add('plexInt', { prevSubject: 'optional' }, (subject, label, text = null) => {
    cy.log(`GET plex-int[${label}]`);
    const element = cy.get(`plex-int[${label}] input`, { withinSubject: subject, log: false });
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexFloat', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-float[${label}] input`);
    } else {
        element = cy.get(`plex-float[${label}] input`);
    }
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexRadio', { prevSubject: 'optional' }, (subject, label, option) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-radio[${label}] mat-radio-button`);
    } else {
        element = cy.get(`plex-radio[${label}] mat-radio-button`);
    }
    if (option !== undefined && option !== null) {

        element.eq(option).click();

    }
    return element;
});

Cypress.Commands.add('plexRadioMultiple', { prevSubject: 'optional' }, (subject, label, option) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-radio[${label}] mat-checkbox`);
    } else {
        element = cy.get(`plex-radio[${label}] mat-checkbox`);
    }
    if (option !== undefined && option !== null) {

        element.eq(option).click();

    }
    return element;
});

Cypress.Commands.add('plexInputDinamico', { prevSubject: 'optional' }, (subject, tipo, label, text = null) => {

    const element = cy.get(`plex-${tipo}`, { prevSubject: subject })
        .find('label').contains(label)
        .parent().parent()
        .find('input');

    if (text) {
        element.type(text);
    }

    return element;
});


Cypress.Commands.add('plexPhone', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-phone[${label}] input`);
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
        element = cy.wrap(subject).find(`plex-text[${label}] input`).first();
    } else {
        element = cy.get(`plex-text[${label}] input`).first();
    }
    if (text) {
        element.type(text);
    }
    return element;
});

Cypress.Commands.add('plexHtml', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-text[${label}] quill-editor div[class="ql-container ql-snow"] div p`).first();
    } else {
        element = cy.get(`plex-text[${label}] quill-editor div[class="ql-container ql-snow"] div p`).first();
    }
    if (text) {
        element.type(text, { force: true });
    }
    return element;
})

Cypress.Commands.add('plexLabel', { prevSubject: 'optional' }, (subject, label) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find('plex-label', { timeout: 30000 }).contains(label);
    } else {
        element = cy.get('plex-label', { timeout: 30000 }).contains(label);
    }
    return element;
});

Cypress.Commands.add('plexBadge', { prevSubject: 'optional' }, (subject, label, type = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find('plex-badge', { timeout: 30000 })
    } else {
        element = cy.get('plex-badge', { timeout: 30000 });
    }
    if (type) {
        element = element.find(`.badge-${type}`, { timeout: 30000 }).contains(label);
    } else {
        element = element.contains(label);
    }
    return element;
});

Cypress.Commands.add('plexOptions', { prevSubject: 'optional' }, (subject, label) => {
    return cy.get('plex-options button', { prevSubject: subject }).contains(label);
})

Cypress.Commands.add('plexTextArea', { prevSubject: 'optional' }, (subject, label, text = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-text[${label}] textarea`).first();
    } else {
        element = cy.get(`plex-text[${label}] textarea`).first();
    }
    if (text) {
        element.type(text, { delay: 0 });
    }
    return element.parent().parent().parent();
});

Cypress.Commands.add('plexButton', { prevSubject: 'optional' }, (subject, label) => {
    let element;
    if (subject) {

        element = cy.wrap(subject).find('plex-button', { timeout: 10000 }).contains(label);
    } else {
        element = cy.get('plex-button', { timeout: 10000 }).contains(label);
    }
    return element;
});

Cypress.Commands.add('plexButtonIcon', { prevSubject: 'optional' }, (subject, icon) => {
    let element;
    if (subject) {

        element = cy.wrap(subject).find(`plex-button i.adi.adi-${icon}`, { timeout: 10000 }).parent();
    } else {
        element = cy.get(`plex-button i.adi.adi-${icon}`, { timeout: 10000 }).parent();
    }
    return element;
});

Cypress.Commands.add('plexLayoutMain', () => {
    return cy.get('plex-layout-main');
});

Cypress.Commands.add('plexLayoutSidebar', () => {
    return cy.get('plex-layout-sidebar');
});

Cypress.Commands.add('plexLayout', (name) => {
    return cy.get('plex-layout-' + name);
});

Cypress.Commands.add('plexDatetime', { prevSubject: 'optional' }, (subject, label, data = null) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-datetime[${label}] input`)
    } else {
        element = cy.get(`plex-datetime[${label}] input`);
    }
    if (data && typeof data === 'string') {
        element.type(`${data}{enter}`);
    } else if (data) {
        if (data.clear) {
            element.clear();
        }
        if (data.text) {
            element.type(`${data.text}${!data.skipEnter ? '{enter}' : ''}`);
        }
    }
    element = element.parent().parent().parent();
    return element;
});

Cypress.Commands.add('plexDateTimeDinamico', { prevSubject: 'optional' }, (subject, label, text = null) => {

    const element = cy.get('plex-datetime', { prevSubject: subject })
        .find('label').contains(label)
        .parent().parent()
        .find('input');

    if (text) {
        element.type(text);
    }

    return element;
});

Cypress.Commands.add('plexBool', { prevSubject: 'optional' }, (subject, label, checked = false) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-bool[${label}] input[type="checkbox"]`)
    } else {
        element = cy.get(`plex-bool[${label}] input[type="checkbox"]`);
    }
    if (checked !== undefined) {
        if (checked) {
            element = element.check({ force: true });
        } else {
            element = element.uncheck({ force: true });
        }
    }
    return element;
});

Cypress.Commands.add('plexBoolDinamico', { prevSubject: 'optional' }, (subject, label, checked = false) => {

    let element = cy.get('plex-bool', { prevSubject: subject })
        .find('label').contains(label)
        .parent().parent()
        .find('input[type="checkbox"]');
    if (checked !== undefined) {
        if (checked) {
            element = element.check({ force: true });
        } else {
            element = element.uncheck({ force: true });
        }
    }

    return element;
});

Cypress.Commands.add('plexTab', { prevSubject: 'optional' }, (subject, label) => {
    let element;
    if (subject) {

        element = cy.wrap(subject).find(`plex-tabs li`).contains(label);
    } else {
        element = cy.get(`plex-tabs li`).contains(label);
    }
    return element;
});

Cypress.Commands.add('plexDropdown', { prevSubject: 'optional' }, (subject, label, option) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-dropdown[${label}] button`);
    } else {
        element = cy.get(`plex-dropdown[${label}] button`);
    }
    if (option !== undefined && option !== null) {
        element.click();

        if (typeof option === 'string') {
            element.parent().find('ul.dropdown-menu').children().contains(option).click();
        } else {
            element.parent().find('ul.dropdown-menu').children().eq(option).click();
        }
    }
    return element;
});

Cypress.Commands.add('validationMessage', { prevSubject: true }, (subject, text) => {
    text = text || 'Valor requerido';
    return cy.wrap(subject).find('div[class="form-control-feedback"]').should('contain', text);
})

Cypress.Commands.add('toast', (option, label) => {

    if (label) {
        return cy.get(`div[class="simple-notification toast ${option}"]`).contains(label).click();
    } else {
        return cy.get(`div[class="simple-notification toast ${option}"]`).click();
    }


})

Cypress.Commands.add('plexHelp', (label) => {
    return cy.get(`plex-help`).contains(label);
})

Cypress.Commands.add('plexAccordion', { prevSubject: 'optional' }, (subject, index) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-accordion >div`);
    } else {
        element = cy.get(`plex-accordion >div`);
    }
    if (index !== undefined) {
        element.find('plex-panel .card .card-header').eq(index).click();
    }
    return element;
});

Cypress.Commands.add('plexPanel', { prevSubject: 'optional' }, (subject, index) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-panel`);
    } else {
        element = cy.get(`plex-panel`);
    }
    if (index !== undefined) {
        return element.eq(index).children().eq(0);
    }
    return element;
});

Cypress.Commands.add('plexMenu', (icon) => {
    cy.get('plex-app .navbar-inverse .adi.adi-menu').click({ force: true });
    return cy.get('plex-app .navbar-inverse .dropdown-menu').find(`.adi.adi-${icon}`).first().click({ force: true });
})

Cypress.Commands.add('plexIcon', { prevSubject: 'optional' }, (subject, icon) => {
    let element;
    if (subject) {
        element = cy.wrap(subject).find(`plex-icon i.adi.adi-${icon}`);
    } else {
        element = cy.get(`plex-icon i.adi.adi-${icon}`);
    }
    return element;
});

/**
 * @decrecated
 */
Cypress.Commands.add('selectOption', (label, value) => {
    return cy.get(`plex-select[${label}]`).children().children('.selectize-control').click()
        .find(`div[data-value=${value}]`).click({
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

