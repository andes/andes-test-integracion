const faker = require('faker');
const { connectToDB, ObjectId } = require('./database');

module.exports.createElementoRup = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const ElementosRUP = await client.db().collection('elementosRUP');

        const templateName = params.template || 'atomo';
        let dto = require('./data/elemento-rup/elemento-rup-' + templateName);
        dto = JSON.parse(JSON.stringify(dto));

        if (params.componente) {
            dto.componente = params.componente;
        }

        if (params.params) {
            dto.params = params.params;
        }

        dto.permiteRepetidos = params.permiteRepetidos || false;

        if (params.conceptos) {
            dto.conceptos = params.conceptos;
        }

        if (params.requeridos) {
            dto.requeridos = params.requeridos;
            dto.requeridos.forEach(req => req.elementoRUP = new ObjectId(req.elementoRUP))
        }

        if (params.frecuentes) {
            dto.frecuentes = params.frecuentes;
        }

        if (params.esSolicitud !== undefined && params.esSolicitud !== null) {
            dto.esSolicitud = params.esSolicitud;
        }


        dto._id = new ObjectId();
        await ElementosRUP.insertOne(dto);

        return dto;
    } catch (e) {
        console.log(e)
        throw e;
    }
}

module.exports.deleteElementoRup = async (mongoUri, id) => {

    try {

        const client = await connectToDB(mongoUri);
        const ElementosRUP = await client.db().collection('elementosRUP');

        ElementosRUP.remove({ _id: ObjectId(id) });

        return true;
    } catch (e) {
        return e;
    }
}