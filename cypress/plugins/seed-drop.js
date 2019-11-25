
const request = require('request');
const { connectToDB } = require('./database');

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
        const client = await connectToDB(mongoUri);
        await client.db().collection(collection).deleteMany({});

        if (collection === 'paciente') {
            await deletePacienteElastic(elasticUri);
        }
        return true;
    } catch (e) {
        return e;
    }
};