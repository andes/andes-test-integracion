
Cypress.Commands.add('snomedSearchStub', (searchtext, response, alias) => {
    const url = `/api/core/term/snomed?search=${searchtext}&semanticTag=hallazgo&semanticTag=trastorno&semanticTag=procedimiento&semanticTag=entidad observable&semanticTag=producto&semanticTag=situación&semanticTag=régimen/tratamiento&semanticTag=elemento de registro&semanticTag=objeto físico&semanticTag=medicamento clínico&semanticTag=fármaco de uso clínico&semanticTag=evento`
    if (typeof response === 'string') {
        cy.fixture(response).as(alias + 'Fixture');
        return cy.route(url, alias + 'Fixture').as(alias);
    } else {
        return cy.route(url, response).as(alias);
    }
});