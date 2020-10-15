
Cypress.Commands.add('snomedSearchStub', (searchtext, response, alias = 'rup-buscador') => {
    const url = `/api/core/term/snomed?search=${searchtext}&semanticTag=hallazgo&semanticTag=trastorno&semanticTag=procedimiento&semanticTag=entidad observable&semanticTag=producto&semanticTag=situación&semanticTag=régimen/tratamiento&semanticTag=elemento de registro&semanticTag=objeto físico&semanticTag=medicamento clínico&semanticTag=fármaco de uso clínico&semanticTag=evento`
    if (typeof response === 'string') {
        return cy.fixture(response).then(response => {
            return cy.route(url, response).as(alias);
        });
    } else {
        return cy.route(url, response).as(alias);
    }
});

Cypress.Commands.add('snomedFrecuentesStub', (response) => {
    const url = '**/api/modules/rup/frecuentesProfesional**';
    if (typeof response === 'string') {
        return cy.fixture(response).then(response => {
            return cy.route(url, response).as('rup-frecuentes');
        });
    } else {
        return cy.route(url, response).as('rup-frecuentes');
    }
});

Cypress.Commands.add('expressionStub', (expression, response, alias = 'snomed-expression') => {
    const url = '**/api/core/term/snomed/expression?expression=' + expression + '**';
    if (typeof response === 'string') {
        return cy.fixture(response).then(response => {
            return cy.route(url, response).as(alias);
        });
    } else {
        return cy.route(url, response).as(alias);
    }
});

Cypress.Commands.add('RupBuscarConceptos', (term, type = 'BUSCADOR BÁSICO', alias = 'rup-buscador') => {
    cy.log('BUSQUEDA SNOMED' + term);
    cy.get('rup-buscador button', { log: false }).contains(type, { log: false }).click();
    if (type === 'BUSCADOR BÁSICO') {
        cy.get('snomed-buscar', { log: false }).plexText('name="searchTerm"', term);
    } else {
        cy.get('rup-buscador', { log: false }).plexText('name="search"', term);
    }
});

Cypress.Commands.add('seleccionarConcepto', (term) => {
    if (typeof term === 'number') {
        return cy.get('plex-layout-sidebar .rup-card').eq(term).plexButtonIcon('plus').click();
    } else {
        return cy.get('plex-layout-sidebar .rup-card').contains(term).parentsUntil('.rup-card').plexButtonIcon('plus').click();
    }
});

Cypress.Commands.add('assertRupCard', (index, { semanticTag, term }) => {
    cy.get('plex-layout-main .rup-card').eq(index).then($elem => {
        if (semanticTag) {
            cy.wrap($elem).should('have.class', semanticTag);
            cy.wrap($elem).find('.icon-rup i').should('have.class', getCSSIcon(semanticTag));
        }
        if (term) {
            cy.wrap($elem).find('.title').contains(term);
        }
        cy.wrap($elem).parentsUntil('.rup-card');
    });
});

Cypress.Commands.add('removeRupCard', (index) => {
    cy.get('plex-layout-main .rup-card').eq(index).then($elem => {
        cy.wrap($elem).plexButtonIcon('delete').click();
        cy.wrap($elem).plexButton('Confirmar').click();
    });
});

Cypress.Commands.add('RupSetearFiltros', (search) => {
    const filtrosMap = {
        todos: 0,
        hallazgo: 1,
        trastorno: 2,
        procedimiento: 3,
        solicitud: 4,
        producto: 5
    }
    if (typeof search === 'number') {
        cy.get('rup-buscador .menu-buscador button').eq(search).click();
    } else {
        cy.get('rup-buscador .menu-buscador button').eq(filtrosMap[search]).click();
    }
});


const filtrosMap = {
    prestaciones: 0,
    solicitudes: 1,
    hallazgo: 2,
    trastorno: 3,
    procedimiento: 4,
    producto: 5,
    laboratorio: 6,
    vacunas: 7
}

Cypress.Commands.add('HudsBusquedaFiltros', (search) => {
    const index = typeof search === 'number' ? search : filtrosMap[search];
    cy.get('rup-hudsbusqueda .menu-buscador button').eq(index).click();
});

Cypress.Commands.add('assertHudsBusquedaFiltros', (search, count) => {
    const index = typeof search === 'number' ? search : filtrosMap[search];
    cy.get('rup-hudsbusqueda .menu-buscador li').eq(index).then(elem => {
        if (count > 0) {
            cy.wrap(elem).contains(count);
        } else {
            cy.wrap(elem).find('small').should('not.exist');
        }
    });
});



Cypress.Commands.add('relacionarRUPCard', (cardIndex, relIndex) => {
    cy.get('plex-layout-main .rup-card').eq(cardIndex).then($elem => {
        cy.wrap($elem).plexDropdown('icon="link-variant"', relIndex);
        cy.wrap($elem).plexBadge(relIndex, 'info')
    });
});

Cypress.Commands.add('getHUDSItems', () => {
    return cy.get('plex-layout-sidebar .rup-card.mini');
});

Cypress.Commands.add('assertRUPMiniCard', { prevSubject: true }, (subject, { term, profesional, fecha, badge }) => {
    if (term) {
        cy.wrap(subject).contains(term);
    }
    if (profesional) {
        cy.wrap(subject).contains(profesional);
    }
    if (fecha) {
        cy.wrap(subject).contains(fecha);
    }
    if (badge) {
        cy.wrap(subject).plexBadge(badge);
    }
});


export function getCSSIcon(semanticTag) {
    switch (semanticTag) {
        case 'solicitud':
            return 'adi-mano-corazon';
        case 'hallazgo':
        case 'evento':
        case 'situación':
            return 'adi-lupa-ojo';

        case 'trastorno':
            return 'adi-trastorno';

        case 'procedimiento':
        case 'entidad observable':
        case 'régimen/tratamiento':
            return 'adi-termometro';

        case 'producto':
        case 'objeto físico':
        case 'medicamento clínico':
        case 'fármaco de uso clínico':
            return 'adi-pildoras';

        case 'elemento de registro':
            return 'adi-documento-lapiz';
        default:
            // No debería
            return semanticTag;
    }
}
