const { date } = require('faker');
const faker = require('faker');
const { ObjectID } = require('mongodb');
const { connectToDB, ObjectId } = require('./database');

module.exports.createCarnetPerinatal = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const PerinatalDB = await client.db().collection('carnet-perinatal');
        const dto = require('./data/carnet-perinatal/carnet-perinatal');
        const cp = JSON.parse(JSON.stringify(dto));
        cp.controles = (params.controles) ? params.controles : cp.controles;
        cp.controles[0].fechaControl = new Date(cp.controles[0].fechaControl);
        cp.controles[0].profesional.id = new ObjectId(cp.controles[0].profesional.id);
        cp.controles[0].organizacion.id = new ObjectId(cp.controles[0].organizacion.id);
        cp.fecha = (params.fecha) ? new Date(params.fecha) : cp.fecha;
        cp.fechaUltimoControl = (params.fechaUltimoControl) ? new Date(params.fechaUltimoControl) : new Date(cp.fechaUltimoControl);
        cp.fechaProximoControl = (params.fechaProximoControl) ? new Date(params.fechaProximoControl) : new Date(cp.fechaProximoControl);
        cp.embarazo = (params.embarazo) ? params.embarazo : cp.embarazo;
        cp._id = new ObjectId();
        await PerinatalDB.insertOne(cp);
        return carnet;
    } catch (e) {
        return e;
    }
}