/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
        /**
         * Refresca la base de datos
         * @example
         * cy.seed()
         */
        seed(): Chainable<void>

        goto(url: string, token?: string): Chainable<void>

        /**
         * Mapa de camas Helper para crear los usuarios según cama
         * Devuelve un array con el usuario, el token y los pacientes creados
         */
        loginCapa(capa: string): Chainable<[any, string, any[]]>

        /**
         * crea camas en el modulo de mapas de cama
         */
        factoryInternacion(config: any): Chainable<any>;


        /**
         * Busca una cama según un texto en el listado de camas
         */
        getCama(lable: string): Chainable<Element>

        getRegistrosMedicos(): Chainable<Element>


        /**
         * Interactura con el modal de privacidad
         */
        modalPrivacidad(opt?: Boolean | String): Chainable<Element>;


        plexTab(label: string): Chainable<Element>;

        plexOptions(label: string): Chainable<Element>;

        plexLayoutSidebar(): Chainable<Element>;
        plexLayoutMain(): Chainable<Element>;
        plexLayout(label: 'main' | 'sidebar'): Chainable<Element>;

        plexButton(label: string): Chainable<Element>;
        plexButtonIcon(icon: string): Chainable<Element>;


    }
}