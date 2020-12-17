const faker = require('faker');
const { connectToDB, ObjectId, encapsulateArray } = require('./database');


function generarTokens(dto) {
    let words = [];
    if (dto.documento) {
        words.push(dto.documento.toLowerCase());
    }
    if (dto.apellido) {
        dto.apellido.trim().toLowerCase().split(' ').forEach(doc => {
            words.push(doc.toLowerCase());
        });
    }
    if (dto.nombre) {
        dto.nombre.trim().toLowerCase().split(' ').forEach(doc => {
            words.push(doc.toLowerCase());
        });
    }
    if (dto.alias) {
        words.push(dto.alias.trim().toLowerCase());
    }
    if (dto.numeroIdentificacion) {
        words.push(dto.numeroIdentificacion.trim().toLowerCase());
    }
    return words;
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

module.exports.seedPaciente = async (mongoUri, types) => {
    try {
        const client = await connectToDB(mongoUri);
        const PacienteDB = await client.db().collection('paciente');
        types = types || ['validado', 'temporal', 'sin-documento', 'extranjero'];
        const pacientes = encapsulateArray(types).map(async (type) => {
            let dto = require('./data/paciente/paciente-' + type);
            dto = JSON.parse(JSON.stringify(dto));
            if (dto) {
                dto._id = new ObjectId(dto._id);
                await PacienteDB.insertOne(dto);
            }
            return dto;
        });

        return Promise.all(pacientes);

    } catch (e) {
        return e;
    }
}

module.exports.createPaciente = async (mongoUri, params) => {
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
        dto.sexo = params.sexo || 'masculino';
        dto.genero = dto.sexo;
        // si no tiene scan y no se envió en params se le asigna null
        dto.scan = (params.scan) ? params.scan : (dto.scan) ? dto.scan : null;

        // si no tiene reporte de error y no se envió en params se le asigna false
        dto.reportarError = (params.reportarError) ? params.reportarError : (dto.reportarError) ? dto.reportarError : false;
        // si no tiene notaError y no se envió en params se le asigna string vacío
        dto.notaError = (params.notaError) ? params.notaError : (dto.notaError) ? dto.notaError : '';


        if (dto.documento) {
            dto.documento = (params.documento) ? params.documento + '' : ('' + faker.random.number({ min: 40000000, max: 49999999 }));
            dto.documento_fuzzy = makeNGrams(config, dto.documento);
        }
        dto.tokens = generarTokens(dto);

        dto.contacto[0].valor = params.telefono || faker.phone.phoneNumber().replace('-', '').replace('-', '');

        dto._id = new ObjectId();
        await PacienteDB.insertOne(dto);

        return dto;
    } catch (e) {
        return e;
    }
}