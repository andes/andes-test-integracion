const mongo = require('mongodb');

const client = {};

module.exports.ObjectId = mongo.ObjectID;

module.exports.encapsulateArray = function (item) {
    return Array.isArray(item) ? item : [item];
}

module.exports.connectToDB = async (uri) => {

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
        return false;
    }
};

module.exports.cleanDB = async (db) => {
    const colections = await db.collections();
    for (const colection of colections) {
        await colection.deleteMany({});
    }
}