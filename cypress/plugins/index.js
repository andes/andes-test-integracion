// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)


const selectTestsWithGrep = require('cypress-select-tests/grep')

const { seedAgenda } = require('./seed-agenda');
const { seedPrestacion } = require('./seed-prestaciones');
const { dropCollection } = require('./seed-drop');
const { seedPaciente, createPaciente } = require('./seed-paciente');
const { createElementoRup, deleteElementoRup } = require('./seed-elementos-rup');
const { createMaquinaEstados, createSala, createCama, createEstadosCama, factoryInternacion } = require('./seed-internacion');
const { createPacienteApp } = require('./seed-paciente-app');
const { seedPerfil, seedUsuario } = require('./seed-gestor-usuarios');
const { createModulo } = require('./seed-modulo');

const { cleanDB, connectToDB, fetch } = require('./database');
const { InitDatabase } = require('./database-initial');

module.exports = (on, config) => {

    on('file:preprocessor', selectTestsWithGrep(config))

    const mongoUri = config.env.MONGO_URI || 'mongodb://localhost:27066/andes';

    on('task', {
        'database:drop': (collection) => {
            return dropCollection(mongoUri, collection);
        },
        'database:create:usuario': (params) => {
            return seedUsuario(mongoUri, params);
        },
        'database:seed:paciente': (params) => {
            return seedPaciente(mongoUri, params);
        },
        'database:create:paciente': (params = {}) => {
            return createPaciente(mongoUri, params);
        },
        'database:create:paciente-app': (params = {}) => {
            return createPacienteApp(mongoUri, params);
        },
        'database:seed:agenda': (dto) => {
            return seedAgenda(mongoUri, dto);
        },
        'factory:internacion': (params) => {
            return factoryInternacion(params);
        },
        'database:seed:prestacion': (dto) => {
            return seedPrestacion(mongoUri, dto);
        },
        'database:seed:elemento-rup': (dto) => {
            return createElementoRup(mongoUri, dto);
        },
        'database:delete:elemento-rup': (dto) => {
            return deleteElementoRup(mongoUri, dto);
        },
        'database:create:maquinaEstados': (params) => {
            return createMaquinaEstados(mongoUri, params);
        },
        'database:create:camaEstados': (params) => {
            return createEstadosCama(mongoUri, params);
        },
        'database:create:cama': (params) => {
            return createCama(mongoUri, params);
        },
        'database:create:sala': (params) => {
            return createSala(mongoUri, params);
        },
        'database:create:perfil': (dto) => {
            return seedPerfil(mongoUri, dto);
        },
        'database:create:usuario': (dto) => {
            return seedUsuario(mongoUri, dto);
        },
        'database:create:modulo': (params = {}) => {
            return createModulo(mongoUri, params);
        },
        'database:initial': () => {
            return InitDatabase(mongoUri);
        },
        'database:fetch': ({ collection, params }) => {
            return fetch(mongoUri, collection, params);
        }
    });

}
