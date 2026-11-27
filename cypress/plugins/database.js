const mongo = require('mongodb');

const client = {};

module.exports.ObjectId = mongo.ObjectId;

module.exports.encapsulateArray = function (item) {
    return Array.isArray(item) ? item : [item];
}

const connectToDB = async (uri) => {

    let connectionString = 'mongodb://localhost/seed_db';

    const hasScheme = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');

    if (uri && !hasScheme) {
        connectionString = `mongodb://${uri}`;
    } else if (uri && hasScheme) {
        connectionString = uri;
    }

    if (client[uri]) {
        return client[uri];
    }

    try {
        client[connectionString] = await mongo.MongoClient.connect(connectionString, {
            useNewUrlParser: true,
        });
        return client[connectionString];
    } catch (e) {
        throw new Error(
            `No se pudo conectar a MongoDB (${connectionString}): ${e.message}. `
            + 'Para develop: npm run dev:up (puerto 27066) o MONGO_URI=mongodb://localhost:27017/andes',
        );
    }
};

module.exports.connectToDB = connectToDB;

module.exports.ensurePacienteTextIndex = async (db) => {
    const col = db.collection('paciente');
    const indexes = await col.indexes().catch(() => []);
    const names = indexes.map((idx) => idx.name);
    if (!names.includes('fuzzy_text')) {
        await col.createIndex(
            { documento_fuzzy: 'text' },
            { name: 'fuzzy_text', background: true, default_language: 'english' },
        );
        return true;
    }
    return false;
}

module.exports.cleanDB = async (db) => {
    const colections = await db.collections();
    for (const colection of colections) {
        await colection.deleteMany({});
    }
    await module.exports.ensurePacienteTextIndex(db);
}

const getObjectId = (name) => {
    const sha1 = require('sha1');
    if (name === '') {
        throw new Error('Name cannot be empty');
    }
    const hash = sha1(name);
    return new mongo.ObjectID(hash.substring(0, 24));
};

module.exports.getObjectId = getObjectId

module.exports.checkObjectId = (id) => {
    try {
        if (mongo.ObjectID.isValid(id)) {
            return new mongo.ObjectID(id);
        }
        return getObjectId(id);

    } catch (e) {
        console.error(e);
    }
}

module.exports.fetch = async (mongoUri, collection, params) => {
    const client = await connectToDB(mongoUri);
    const coll = await client.db().collection(collection);
    const data = await coll.find(params).toArray();
    return data;
}