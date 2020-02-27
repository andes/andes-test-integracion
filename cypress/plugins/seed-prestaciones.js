
const moment = require('moment');
const request = require('request');
const { connectToDB, ObjectId, encapsulateArray } = require('./database');

module.exports.seedPrestacion = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const PrestacionDB = await client.db().collection('prestaciones');

        const templateName = params.template || 'default';
        const dto = require('./data/prestacion/prestacion-' + templateName);

        const prestacion = JSON.parse(JSON.stringify(dto));

        if (params.estado) {
            prestacion.estados[0].tipo = params.estado;
        }

        if (params.turno) {
            prestacion.solicitud.turno = new ObjectId(params.turno);
        } else {
            prestacion.solicitud.turno = null;
        }

        if (params.ambito) {
            prestacion.solicitud.ambitoOrigen = params.ambito;
        }

        prestacion.noNominalizada = false;

        let fechaPrestacion = moment().startOf('hour');
        if (params.fecha) {
            fechaPrestacion.add(params.fecha, 'd');
        }

        if (params.hora) {
            fechaPrestacion.add(params.hora, 'h');
        }

        prestacion.ejecucion.fecha = fechaPrestacion.toDate();
        prestacion.solicitud.fecha = fechaPrestacion.toDate();
        prestacion.estados[0].createdAt = fechaPrestacion.toDate();
        prestacion.createdAt = fechaPrestacion.toDate();

        if (params.organizacion) {
            const OrganizacionDB = await client.db().collection('organizacion');
            const orgData = await OrganizacionDB.findOne({ _id: new ObjectId(params.organizacion) }, { projection: { nombre: 1 } });
            prestacion.solicitud.organizacion = orgData;
            prestacion.ejecucion.organizacion = orgData;
        } else {
            prestacion.solicitud.organizacion._id = new ObjectId(prestacion.solicitud.organizacion._id);
            prestacion.solicitud.organizacion.id = new ObjectId(prestacion.solicitud.organizacion._id);
            prestacion.ejecucion.organizacion._id = new ObjectId(prestacion.ejecucion.organizacion._id);
        }

        if (params.tipoPrestacion) {
            const ConceptosTurneablesDB = await client.db().collection('conceptoTurneable');
            const tipoPrestacion = await ConceptosTurneablesDB.findOne({ _id: new ObjectId(params.tipoPrestacion) });
            prestacion.solicitud.tipoPrestacion = tipoPrestacion;
        } else {
            prestacion.solicitud.tipoPrestacion._id = new ObjectId(prestacion.solicitud.tipoPrestacion._id);
        }

        if (params.profesional) {
            const ProfesionalDB = await client.db().collection('profesional');
            const profesional = await ProfesionalDB.findOne({ _id: new ObjectId(params.profesional) });
            prestacion.solicitud.profesional = profesional;
        } else {
            prestacion.solicitud.profesional._id = new ObjectId(prestacion.solicitud.profesional._id);
        }

        if (params.paciente) {
            const PacientesDB = await client.db().collection('paciente');
            const paciente = await PacientesDB.findOne({ _id: new ObjectId(params.paciente) }, { projection: { documento: 1, nombre: 1, apellido: 1, sexo: 1, fechaNacimiento: 1 } });
            prestacion.paciente = paciente;
            prestacion.paciente.id = prestacion.paciente._id;
        }

        const data = await PrestacionDB.insertOne(prestacion);
        prestacion._id = data.insertedId;

        return prestacion;

    } catch (e) {
        throw e;
    }
}