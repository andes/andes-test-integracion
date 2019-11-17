
const mongo = require('mongodb');
const request = require('request');


let client

const connectToDB = async (uri) => {
    let connectionString = 'mongodb://localhost/seed_db';

    const hasScheme =
        uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');

    if (uri && !hasScheme) {
        connectionString = `mongodb://${uri}`;
    } else if (uri && hasScheme) {
        connectionString = uri;
    }
    try {
        client = await mongo.MongoClient.connect(connectionString, {
            useNewUrlParser: true,
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};

function deletePacienteElastic(elasticUri) {
    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: elasticUri + '/andes/_delete_by_query',
            body: JSON.stringify({ "query": { "match_all": {} } }),
            headers: {
                'content-type': 'application/json; charset=UTF-8'
            }
        }, (a, b, c) => {
            return resolve();
        });
    })
}

module.exports.dropCollection = async (mongoUri, elasticUri, collection) => {
    try {
        await connectToDB(mongoUri);
        await client.db().collection(collection).deleteMany({});

        if (collection === 'paciente') {
            await deletePacienteElastic(elasticUri);
        }

        return true;
    } catch (e) {
        return e;
    }
};
