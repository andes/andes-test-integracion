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

const addWholePhrase = (arr, text) => {
    if (text.split(' ').length > 1) {
        return [...arr, text.toLowerCase()];
    }
    return arr;
};

const nGrams = (constants) => (text, minSize, prefixOnly) => {
    if (minSize == null) {
        minSize = 2;
    }

    const set = new Set();
    let index;

    if (minSize <= 0) {
        throw new Error('minSize must be greater than 0.');
    }

    if (!text) {
        return [];
    }

    text = text.slice ? text.toLowerCase() : String(text);
    index = prefixOnly ? 0 : text.length - minSize + 1;

    if (text.length <= minSize) {
        return [text];
    }

    if (prefixOnly) {
        while (minSize < text.length + 1) {
            set.add(text.slice(index, index + minSize));
            minSize++;
        }

        return Array.from(set);
    }

    while (minSize <= text.length + 1) {
        if (index !== 0) {
            set.add(text.slice(--index, index + minSize));
        } else {
            minSize++;
            index = text.length - minSize + 1;
        }
    }

    return Array.from(set);
};

const makeNGrams = (constants) => (
    text,
    minSize,
    prefixOnly,
) => {
    if (!text) {
        return [];
    }
    const result = text
        .split(' ')
        .map((q) =>
            nGrams(constants)(
                minSize || 2,
                prefixOnly || false,
            ),
        )
        .reduce((acc, arr) => acc.concat(arr), []);
    return addWholePhrase(Array.from(new Set(result)), text);
};

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
    const config = {
        DEFAULT_MIN_SIZE: 3,
        DEFAULT_PREFIX_ONLY: false,
        validMiddlewares: [
            'preSave',
            'preUpdate',
            'preFindOneAndUpdate',
            'preInsertMany',
            'preUpdateMany',
            'preUpdateOne',
        ]
    };
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
            dto.documento_fuzzy = makeNGrams(config, dto.documento);
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