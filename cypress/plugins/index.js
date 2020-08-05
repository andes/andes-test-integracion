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
const { createMaquinaEstados, createCama, createEstadosCama, factoryInternacion } = require('./seed-internacion');
const { createPacienteApp } = require('./seed-paciente-app');
const { seedPerfil, seedUsuario } = require('./seed-gestor-usuarios');
const { createModulo } = require('./seed-modulo');

const { cleanDB, connectToDB } = require('./database');

module.exports = (on, config) => {
    // ref: https://docs.cypress.io/api/plugins/browser-launch-api.html#Usage
    // on('before:browser:launch', (browser = {}, args) => {
    //     if (browser.name === 'chrome') {
    //         args.push('--disable-dev-shm-usage')
    //         return args
    //     }

    //     return args
    // });

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
        'database:create:perfil': (dto) => {
            return seedPerfil(mongoUri, dto);
        },
        'database:create:usuario': (dto) => {
            return seedUsuario(mongoUri, dto);
        },
        'database:create:modulo': (params = {}) => {
            return createModulo(mongoUri, params);
        },
        'database:initial': async () => {
            // Borra todas las collecciones y carga el dataset inicial en la carpeta ./data
            // [NEXT] Poder elegir la carpeta y las colleccionara borrar. Podría ayudar a preparar ciertos scenarios. 
            // [NEXT] También es util para test unitarios en la APi. Debería estar todo en un monorepo. 

            const client = await connectToDB(mongoUri);
            await cleanDB(client.db());

            const { Seeder } = require('mongo-seeding');
            const config = {
                database: mongoUri,
                dropDatabase: false,
            };
            const seeder = new Seeder(config);
            const path = require('path');
            const collections = seeder.readCollectionsFromPath(path.resolve("./data"));
            await seeder.import(collections);
            return true;
        }
    });

    require('cypress-plugin-retries/lib/plugin')(on);

}
