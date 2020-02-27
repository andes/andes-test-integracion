const request = require('request');
const faker = require('faker');
const { connectToDB, ObjectId, encapsulateArray } = require('./database');


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

module.exports.seedPaciente = async (mongoUri, elasticUri, types) => {
    try {
        const client = await connectToDB(mongoUri);
        const PacienteDB = await client.db().collection('paciente');
        types = types || ['validado', 'temporal', 'sin-documento'];
        const pacientes = encapsulateArray(types).map(async (type) => {
            let dto = require('./data/paciente/paciente-' + type);
            dto = JSON.parse(JSON.stringify(dto));
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

module.exports.createPaciente = async (mongoUri, elasticUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const PacienteDB = await client.db().collection('paciente');

        const templateName = params.template || 'validado';
        let dto = require('./data/paciente/paciente-' + templateName);
        dto = JSON.parse(JSON.stringify(dto));

        dto.nombre = params.nombre || faker.name.firstName().toLocaleUpperCase();
        dto.apellido = params.apellido || faker.name.lastName().toLocaleUpperCase();

        if (dto.documento) {
            dto.documento = params.documento || ('' + faker.random.number({ min: 40000000, max: 49999999 }));
        }

        dto.contacto[0].valor = params.telefono || faker.phone.phoneNumber().replace('-', '').replace('-', '');

        dto._id = new ObjectId();
        await PacienteDB.insertOne(dto);
        await postPacienteElastic(elasticUri, dto);

        return dto;
    } catch (e) {
        return e;
    }
}