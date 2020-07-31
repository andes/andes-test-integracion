const { Seeder } = require('mongo-seeding');
const config = {
    database: process.env.MONGO_URI || 'mongodb://localhost:27066/andes',
    dropDatabase: false,
};
const seeder = new Seeder(config);
const path = require('path');
const collections = seeder.readCollectionsFromPath(path.resolve("./data"));
seeder.import(collections).then(() => process.exit());



/**

mongo --quiet andes --eval "db.getCollectionNames().join('\n')" | \
grep -v system.indexes | \
xargs -L 1 -I {} sh -c 'mkdir {} && mongoexport --jsonArray --pretty -d andes -c {} --out {}/{}_basic.json'


 */