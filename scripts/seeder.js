const path = require('path');
const { cleanDB, connectToDB } = require('../cypress/plugins/database');
const { Seeder } = require('mongo-seeding');


const config = {
    database: process.env.MONGO_URI || 'mongodb://localhost:27066/andes',
    dropDatabase: false,
};


async function main() {
    // Clean DATABASE
    const client = await connectToDB(config.database);
    await cleanDB(client.db());

    // SEED DATABASE
    const seeder = new Seeder(config);
    const collections = seeder.readCollectionsFromPath(path.resolve("./data"));
    await seeder.import(collections)

    process.exit();
}
main();




/**

mongo --quiet andes --eval "db.getCollectionNames().join('\n')" | \
grep -v system.indexes | \
xargs -L 1 -I {} sh -c 'mkdir {} && mongoexport --jsonArray --pretty -d andes -c {} --out {}/{}_basic.json'


 */