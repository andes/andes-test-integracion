const { cleanDB, connectToDB } = require('./database');

const InitDatabase = async (mongoUri) => {
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

module.exports = {
    InitDatabase
}