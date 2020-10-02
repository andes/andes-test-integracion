/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable<Subject> {
        /**
         * Refresca la base de datos
         * @example
         * cy.seed()
         */
        seed(): Chainable<void>;

        /**
         * Borra todos los elementos de uno o mas colecciones
         * @param colecciones 
         */

        cleanDB(colecciones?: string[]): Chainable<void>;

        goto(url: string, token?: string, hudsToken?: string): Chainable<void>;

        login(user: string, password: string, orgId?: string): Chainable<string>;

        /**
         * Crea un stub de la busqueda de conceptos de SNOMED
         * @param searchText Campo a buscar en rup-buscador
         * @param conceptos Array de resultados o nombre del fixture
         * @param alias Alias para hacer un wait si es necesario
         */
        snomedSearchStub(searchText: string, conceptos: any[] | string, alias: string): Chainable<void>;

        /**
         * Stub automatico de frecuentes rup
         * @param conceptos 
         */
        snomedFrecuentesStub(conceptos: any[] | string): Chainable<void>;

        /**
         * Realiza una busqueda de SNOMED en la ejecución de rup
         * @param searchText Campo a buscar en rup-buscador 
         * @param alias Alias para hacer un wait si es necesario
         */
        RupBuscarConceptos(term: string, type?: 'SUGERIDOS' | 'BUSCADOR BÁSICO' | 'MIS FRECUENTES' | 'FRECUENTES POR PRESTACION', alias?: string): Chainable<void>;

        /**
         * Chequea el estado de un registro, termino y semantic tags.
         * @param index 
         * @param params 
         */
        assertRupCard(index: number, params: { semanticTag?: string, term?: string }): Chainable<void>;

        /**
         * Agrega un item de la lista de busqueda.
         * @param term 
         */
        seleccionarConcepto(term: number | string): Chainable<void>;

        /**
         * Setea filtros del buscador RUP
         * @param search 
         */
        RupSetearFiltros(search: number | 'todos' | 'hallazgo' | 'trastorno' | 'procedimiento' | 'producto' | 'solicitud');

        /**
         * Setea filtros de busqueda HUDS
         * @param search 
         */
        HudsBusquedaFiltros(search: number | 'prestaciones' | 'solicitudes' | 'hallazgo' | 'trastorno' | 'procedimiento' | 'producto' | 'vacunas' | 'laboratorios');

        /**
         * Elimina un registro
         * @param index 
         */
        removeRupCard(index: number);

        relacionarRUPCard(cardIndex: number, relIndex: number | string);

        /**
         * Crea una prestacion 
         * @param name 
         * @param params paciente, tipoPrestacion ,etc
         */

        task(name: 'database:seed:prestacion', params: any): Chainable<any>;

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
         * Corre N veces la misma tarea una por cada argumento que se le pase
         * Devuelve un arrray con las N respuestas
         */
        taskN(name: string, argumentos: any[]): Chainable<any[]>;

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

        /**
         * Algunos plex "input" tienen el label dinamico así que no se puede
         * seleccionar por atributo, así que este "InputDinamico" busca el label tal cual
         * y escribe sobre el.
         * Permite configurar el tipo 
         */
        plexInputDinamico(tipo: 'text' | 'float' | 'phone' | 'int', label: string, texto?: string): Chainable<Element>;

        /**
         * Plex badge
         */
        plexBadge(texto: string): Chainable<Element>;

        /**
         * Plex Select
         */
        plexSelect(label: string, texto?: string): Chainable<Element>;

        /**
         * Plex Select Async 
         */
        plexSelectAsync(label: string, texto: string, route: string, position: any): Chainable<Element>;

        /**
         * Plex Select Type 
         */
        plexSelectType(label: string, texto: string): Chainable<Element>;

        /**
         * Plex Toast
         */
        plexToast(tipo: 'info' | 'success' | 'warning' | 'danger', texto?: string): Chainable<Element>;

        /**
         * Plex DateTime
         */
        plexDatetime(label: string, texto?: string): Chainable<Element>;

        /**
         * Plex Bool
         */
        plexBool(label: string, texto: boolean): Chainable<Element>;

        /**
         * Plex Dropdown
         */
        plexDropdown(label: string, texto?: string): Chainable<Element>;

        /**
         * Plex TextArea
         */
        plexTextArea(label: string, texto?: string);

        /**
         * Plex TextArea
         */
        plexHtml(label: string, texto?: string);

        plexText(label: string, texto?: string);
        plexInt(label: string, texto?: string);

        toast(type: 'success' | 'danger' | 'warning' | 'alert');

        swal(action: 'confirm' | 'cancel');
    }
}