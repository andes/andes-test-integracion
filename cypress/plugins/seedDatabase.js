
const mongo = require('mongodb');
const request = require('request');

const ObjectId = mongo.ObjectID;

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
        return false;
    }
};

function postPacienteElastic(elasticUri, paciente) {
    const dto = { ...paciente };
    dto.id = dto._id;
    delete dto._id;
    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: elasticUri + '/andes/paciente/' + dto.id,
            body: JSON.stringify(dto),
            headers: {
                'content-type': 'application/json; charset=UTF-8'
            }
        }, () => {
            return resolve();
        });
    })
}

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


function encapsulateArray(item) {
    return Array.isArray(item) ? item : [item];
}

module.exports.seedPaciente = async (mongoUri, elasticUri, types) => {
    try {
        await connectToDB(mongoUri);
        const PacienteDB = await client.db().collection('paciente');
        types = types || ['validado', 'temporal', 'sin-documento'];

        const pacientes = encapsulateArray(types).map(async (type) => {
            const dto = require('./data/paciente/paciente-' + type);
            if (dto) {
                dto._id = new ObjectId(dto._id);
                await PacienteDB.insertOne(dto);
                await postPacienteElastic(elasticUri, dto);
            }
            return dto;
        });

        return Promise.all(pacientes);

    } catch (e) {
        return e;
    }
}