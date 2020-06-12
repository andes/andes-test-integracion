
const moment = require('moment');
const request = require('request');
const { connectToDB, ObjectId, encapsulateArray } = require('./database');

module.exports.seedAgenda = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const AgendaDB = await client.db().collection('agenda');

        const templateName = params.template || 'default';
        const dto = require('./data/agendas/agenda-' + templateName);

        const agenda = JSON.parse(JSON.stringify(dto));

        if (params.estado) {
            agenda.estado = params.estado;
        }

        if (params.dinamica) {
            agenda.dinamica = params.dinamica;
            agenda.cupo = -1;
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
        } else if (params.profesionales === null) {
            agenda.profesionales = [];
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
            if (prestaciones[0].noNominalizada) {
                agenda.nominalizada = false;
            }
        } else {
            agenda.tipoPrestaciones[0].id = new ObjectId(agenda.tipoPrestaciones[0].id);
            agenda.tipoPrestaciones[0]._id = new ObjectId(agenda.tipoPrestaciones[0]._id);
            agenda.bloques[0].tipoPrestaciones[0]._id = new ObjectId(agenda.bloques[0].tipoPrestaciones[0]._id);
            agenda.bloques[0].tipoPrestaciones[0].id = new ObjectId(agenda.bloques[0].tipoPrestaciones[0].id);
            agenda.nominalizada = true;
        }

        let labelTipoTurno = 'accesoDirectoDelDia';
        let labelTipoTurnoRestante = 'restantesDelDia';
        if (params.tipo) {
            switch (params.tipo) {
                case 'delDia':
                    labelTipoTurno = 'accesoDirectoDelDia';
                    labelTipoTurnoRestante = 'restantesDelDia';
                    break;
                case 'programado':
                    labelTipoTurno = 'accesoDirectoProgramado';
                    labelTipoTurnoRestante = 'restantesProgramados';
                    break;
                case 'profesional':
                    labelTipoTurno = 'reservadoProfesional';
                    labelTipoTurnoRestante = 'restantesProfesional';
                    break;
                case 'gestion':
                    labelTipoTurno = 'reservadoGestion';
                    labelTipoTurnoRestante = 'restantesGestion';
                    break;
            }
        }

        let horaInicio = moment().startOf('hour');
        let horaFin = moment().startOf('hour').add(2, 'h');

        if (params.fecha !== undefined) {
            horaInicio.add(params.fecha, 'd');
            horaFin.add(params.fecha, 'd');
        }

        if (params.inicio !== undefined) {
            const [hora, minutos] = params.inicio.split(':');
            horaInicio.set({ hour: hora, minute: minutos });
        }

        if (params.fin !== undefined) {
            const [hora, minutos] = params.fin.split(':');
            horaFin.set({ hour: hora, minute: minutos });
        }

        agenda.horaInicio = horaInicio.toDate();
        agenda.horaFin = horaFin.toDate();
        agenda.bloques[0]._id = new ObjectId();
        agenda.bloques[0].horaInicio = horaInicio.toDate();
        agenda.bloques[0].horaFin = horaFin.toDate();

        const cantTurnos = horaFin.diff(horaInicio, 'hours') * 2;
        agenda.bloques[0][labelTipoTurno] = cantTurnos;
        agenda.bloques[0][labelTipoTurnoRestante] = cantTurnos;
        agenda.bloques[0].cantidadTurnos = cantTurnos;

        const pacientesIDs = encapsulateArray(params.pacientes);

        if (!agenda.nominalizada) {
            const turnoID = new ObjectId();
            const turno = {
                "_id": turnoID,
                "id": turnoID,
                "estado": "disponible",
                "horaInicio": horaInicio.clone().toDate(),
                "tipoPrestacion": agenda.tipoPrestaciones[0]
            };
            agenda.bloques[0].turnos.push(turno);
        }

        for (let i = 0; i < cantTurnos; i++) {
            const turnoID = new ObjectId();
            if (!pacientesIDs[i]) {
                if (!agenda.dinamica && agenda.nominalizada) {
                    const turno = {
                        "_id": turnoID,
                        "id": turnoID,
                        "estado": "disponible",
                        "horaInicio": horaInicio.clone().add(i * 30, 'minutes').toDate()
                    };
                    agenda.bloques[0].turnos.push(turno);
                }
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
                    "diagnostico": {
                        codificaciones: []
                    },
                    "tipoPrestacion": agenda.tipoPrestaciones[0]
                };
                agenda.bloques[0].turnos.push(turno);
                agenda.bloques[0][labelTipoTurnoRestante]--;
            }
        }

        const data = await AgendaDB.insertOne(agenda);
        agenda._id = data.insertedId;

        return agenda;

    } catch (e) {
        console.log(e)
        return e;
    }
}