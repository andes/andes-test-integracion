
const mongo = require('mongodb');
const moment = require('moment');
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

module.exports.seedAgenda = async (mongoUri, params) => {
    try {
        await connectToDB(mongoUri);
        const AgendaDB = await client.db().collection('agenda');

        const templateName = params.template || 'default';
        const dto = require('./data/agendas/agenda-' + templateName);

        const agenda = JSON.parse(JSON.stringify(dto));

        if (params.estado) {
            agenda.estado = params.estado;
        }
        if (params.organizacion) {
            const OrganizacionDB = await client.db().collection('organizacion');
            const orgData = await OrganizacionDB.findOne({ _id: new ObjectId(params.organizacion) }, { projection: { nombre: 1 } });
            agenda.organizacion = orgData;
        } else {
            agenda.organizacion._id = new ObjectId(agenda.organizacion._id)
        }

        if (params.profesionales) {
            const ProfesionalesDB = await client.db().collection('profesional');

            const profIds = encapsulateArray(params.profesionales).map(p => new ObjectId(p));
            const profesionales = await ProfesionalesDB.find({ _id: { $in: profIds } }, { projection: { nombre: 1, apellido: 2 } }).toArray();
            agenda.profesionales = profesionales.map((p) => {
                return {
                    ...p,
                    id: p._id,
                    nombreCompleto: `${p.nombre} ${p.nombre}`
                };
            })
        } else {
            agenda.profesionales.forEach((prof) => {
                prof._id = new ObjectId(prof._id);
                prof.id = new ObjectId(prof.id);
            })
        }

        if (params.tipoPrestaciones) {
            const ConceptosTurneablesDB = await client.db().collection('conceptoTurneable');
            const tipoPrestacionesIds = encapsulateArray(params.tipoPrestaciones).map(ObjectId);
            const prestaciones = await ConceptosTurneablesDB.find({ _id: { $in: tipoPrestacionesIds } }).toArray();
            agenda.tipoPrestaciones = prestaciones;
            agenda.bloques[0].tipoPrestaciones = prestaciones;
        } else {
            agenda.tipoPrestaciones[0].id = new ObjectId(agenda.tipoPrestaciones[0].id);
            agenda.tipoPrestaciones[0]._id = new ObjectId(agenda.tipoPrestaciones[0]._id);
            agenda.bloques[0].tipoPrestaciones[0]._id = new ObjectId(agenda.bloques[0].tipoPrestaciones[0]._id);
            agenda.bloques[0].tipoPrestaciones[0].id = new ObjectId(agenda.bloques[0].tipoPrestaciones[0].id);

        }

        let horaInicio = moment().startOf('hour');
        let horaFin = moment().startOf('hour').add(2, 'h');

        if (params.fecha !== undefined) {
            horaInicio.add(params.fecha, 'd');
            horaFin.add(params.fecha, 'd');
        }

        if (params.inicio !== undefined) {
            horaInicio.add(params.inicio, 'h');
        }

        if (params.fin !== undefined) {
            horaFin.add(params.inicio, 'h');
        }
        agenda.horaInicio = horaInicio.toDate();
        agenda.horaFin = horaFin.toDate();
        agenda.bloques[0].horaInicio = horaInicio.toDate();
        agenda.bloques[0].horaFin = horaFin.toDate();

        const cantTurnos = horaFin.diff(horaInicio, 'hours') * 2;
        agenda.bloques[0].accesoDirectoDelDia = cantTurnos;
        agenda.bloques[0].restantesDelDia = cantTurnos;
        agenda.bloques[0].cantidadTurnos = cantTurnos;

        const pacientesIDs = encapsulateArray(params.pacientes);

        for (let i = 0; i < cantTurnos; i++) {
            const turnoID = new ObjectId();
            if (!pacientesIDs[i]) {
                const turno = {
                    "_id": turnoID,
                    "id": turnoID,
                    "estado": "disponible",
                    "horaInicio": horaInicio.clone().add(i * 30, 'minutes').toDate()
                };
                agenda.bloques[0].turnos.push(turno);
            } else {
                const PacientesDB = await client.db().collection('paciente');
                const paciente = await PacientesDB.findOne({ _id: new ObjectId(pacientesIDs[i]) }, { projection: { documento: 1, nombre: 1, apellido: 1, sexo: 1, fechaNacimiento: 1 } });
                const turno = {
                    "_id": turnoID,
                    "id": turnoID,
                    "estado": "asignado",
                    "emitidoPor": "Gestión de pacientes",
                    "tipoTurno": "delDia", // A mejorar
                    "horaInicio": horaInicio.clone().add(i * 30, 'minutes').toDate(),
                    "paciente": {
                        ...paciente,
                        id: paciente._id,
                        telefono: "",
                        obraSocial: {},
                        carpetaEfectores: []
                    },
                    "tipoPrestacion": agenda.tipoPrestaciones[0]
                };
                agenda.bloques[0].turnos.push(turno);
            }
        }

        const data = await AgendaDB.insertOne(agenda);
        agenda._id = data.insertedId;
        return agenda;

    } catch (e) {
        return e;
    }
}