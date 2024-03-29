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

        cleanDB(colecciones?: string | string[]): Chainable<void>;

        goto(url: string, token?: string, hudsToken?: string, location?: any): Chainable<void>;

        login(user: string, password: string, orgId?: string): Chainable<string>;

        today(format?: any);

        /**
         * Crea un stub de la busqueda de conceptos de SNOMED
         * @param searchText Campo a buscar en rup-buscador
         * @param conceptos Array de resultados o nombre del fixture
         * @param alias Alias para hacer un wait si es necesario
         */
        snomedSearchStub(searchText: string, conceptos: any[] | string, alias?: string): Chainable<void>;

        /**
         * Stub automatico de frecuentes rup
         * @param conceptos 
         */
        snomedFrecuentesStub(conceptos: any[] | string): Chainable<void>;

        /**
         * Stub automatico de una busqueda de expresion Snomed
         * @param expression  experssion a buscar
         * @param conceptos  array de conceptos o string de fixture
         * @param alias 
         */
        expressionStub(expression: string, conceptos: any[] | string, alias?: string)
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


        getHUDSItems(): Chainable<Element>;
        assertRUPMiniCard(params: any): Chainable<Element>;

        /**
         * Chequea el numero elementos en los filtros en la HUDS
         * @param search 
         * @param count 
         */
        assertHudsBusquedaFiltros(search: number | 'prestaciones' | 'solicitudes' | 'hallazgo' | 'trastorno' | 'procedimiento' | 'producto' | 'vacunas' | 'laboratorios', count: number);

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
         * [TODO] completar interfaces
         */

        task(name: 'database:seed:prestacion', params: any): Chainable<any>;
        task(name: 'database:fetch', params: { collection: string, params: any }): Chainable<any>;
        task(name: 'database:seed:elemento-rup', params: any): Chainable<any>;
        task(name: 'database:seed:agenda', params: any): Chainable<any>;
        task(name: 'database:create:paciente', params: any): Chainable<any>;



        task(name: 'database:seed:paciente', params?: any): Chainable<any[]>;
        task(name: 'database:create:paciente-app', params: any): Chainable<any>;
        task(name: 'database:seed:nomivac', params: { paciente: string }): Chainable<any>;
        task(name: 'database:seed:campania'): Chainable<any>;





        /**
         * Mapa de camas Helper para crear los usuarios según cama
         * Devuelve un array con el usuario, el token y los pacientes creados
         */
        loginCapa(capa: string | string[], documento?: Number): Chainable<[any, string, any[]]>


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

        plexMenu(icon: string): Chainable<Element>;

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
        plexBadge(texto: string, type?: 'info' | 'success' | 'warning' | 'danger' | 'default'): Chainable<Element>;

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
        plexSelectType(label: string, data: { text: string, clear: boolean }): Chainable<Element>;

        /**
         * Plex Select Type Dinámico
         */
        plexSelectTypeDinamico(label: string, texto?: string): Chainable<Element>;

        /**
         * Plex Toast
         */
        plexToast(tipo: 'info' | 'success' | 'warning' | 'danger', texto?: string): Chainable<Element>;

        /**
         * Plex DateTime
         */
        plexDatetime(label: string, data?: string | { text?: string, clear?: Boolean, skipEnter?: Boolean }): Chainable<Element>;

        /**
         * Plex DateTime Dinámico
         */
        plexDateTimeDinamico(label: string, data?: string | { text?: string, clear?: Boolean, skipEnter?: Boolean }): Chainable<Element>;

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
        plexPhone(label: string, texto?: string);
        plexFloat(label: string, texto?: string);
        plexLabel(texto: string);
        plexTitle(texto: string);
        plexIcon(icon: string);

        plexRadio(label: string, index: number);
        plexRadioMultiple(label: string, index: number);
        plexHelp(label: string);

        toast(type: 'success' | 'danger' | 'warning' | 'alert' | 'error', texto?: string);

        swal(action: 'confirm' | 'cancel', texto?: string);

        /**
         * HTTP
         */
        patch(path: string, body: any, token: string);
        post(path: string, body: any, token: string);
        put(path: string, body: any, token: string);
        fetch(path: string, body: any, token: string);
        delete(path: string, body: any, token: string);
    }
}