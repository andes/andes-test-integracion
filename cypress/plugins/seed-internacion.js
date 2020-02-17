const faker = require('faker');
const moment = require('moment')
const { connectToDB, ObjectId } = require('./database');

module.exports.createMaquinaEstados = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const maquinaEstadosDB = await client.db().collection('internacionEstados');

        let dto = require('./data/internacion/maquina-estados-default');
        dto = JSON.parse(JSON.stringify(dto));

        dto.organizacion = params.organizacion || ObjectId(dto.organizacion);
        dto.ambito = params.ambito || dto.ambito;
        dto.capa = params.capa || dto.capa;

        if (params.estados && params.estados.length > 0) {
            dto.estados.push(...params.estados);
        }

        if (params.relaciones && params.relaciones.length > 0) {
            dto.relaciones.push(...params.relaciones);
        }

        dto._id = new ObjectId();
        await maquinaEstadosDB.insertOne(dto);

        return dto;
    } catch (e) {
        return e;
    }
}

module.exports.createCama = async (mongoUri, params) => {
    params = params || {};
    try {
        // CAMA
        const client = await connectToDB(mongoUri);
        const camaDB = await client.db().collection('internacionCamas');

        let dtoCama = require('./data/internacion/cama-default');
        dtoCama = JSON.parse(JSON.stringify(dtoCama));

        dtoCama.organizacion = ObjectId(params.organizacion || dtoCama.organizacion);
        dtoCama.nombre = params.nombre || ('CAMA ' + faker.random.number({ min: 0, max: 9999 }));

        if (params.unidadOrganizativa) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoCama.organizacion });
            organizacion.unidadesOrganizativas.map(unidadOrg => {
                if (unidadOrg.conceptId === params.unidadOrganizativa) {
                    dtoCama.unidadOrganizativaOriginal = unidadOrg;
                }
            });
        }

        if (params.sector) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoCama.organizacion });
            organizacion.mapaSectores.map(sector => {
                if (String(sector._id) === String(params.sector)) {
                    dtoCama.sectores[0] = sector;
                }
            });
        }

        if (params.tipoCama) {
            let tiposCama = require('./data/internacion/tipos-cama');
            tiposCama = JSON.parse(JSON.stringify(tiposCama));

            tiposCama.map(tipoCama => {
                if (tipoCama.conceptId === params.tipoCama) {
                    dtoCama.tipoCama = tipoCama;
                }
            });
        }

        dtoCama.equipamiento = params.equipamiento || dtoCama.equipamiento;
        dtoCama._id = new ObjectId();
        await camaDB.insertOne(dtoCama);

        let paciente = null;
        let dtoPrestacion = {};
        // PRESTACION
        if (params.estado === 'ocupada') {
            const prestacionesDB = await client.db().collection('prestaciones');
            dtoPrestacion = require('./data/prestacion/prestacion-internacion');
            dtoPrestacion = JSON.parse(JSON.stringify(dtoPrestacion));
            dtoPrestacion._id = new ObjectId();
            dtoPrestacion.solicitud.organizacion.id = ObjectId(params.organizacion) || ObjectId(dtoPrestacion.solicitud.organizacion.id);
            dtoPrestacion.ejecucion.organizacion.id = ObjectId(params.organizacion) || ObjectId(dtoPrestacion.ejecucion.organizacion.id);
            dtoPrestacion.ejecucion.fecha = moment().startOf('hour').toDate();
            dtoPrestacion.ejecucion.registros[0].valor.informeIngreso.fechaIngreso = moment().startOf('hour').toDate();

            if (params.paciente) {
                const pacientesDB = await client.db().collection('paciente');
                paciente = await pacientesDB.findOne({ documento: params.paciente.documento });
            } else {
                paciente = dtoPrestacion.paciente;
            }

            paciente._id = ObjectId(paciente._id);
            dtoPrestacion.paciente.id = ObjectId(paciente._id)
            await prestacionesDB.insertOne(dtoPrestacion);
        }

        // ESTADOS DE CAMA
        const camaEstadosDB = await client.db().collection('internacionCamaEstados');
        let dtoEstadistica = require('./data/internacion/cama-estado');

        dtoEstadistica = JSON.parse(JSON.stringify(dtoEstadistica));
        dtoEstadistica.idCama = ObjectId(dtoCama._id);
        dtoEstadistica.idOrganizacion = ObjectId(dtoCama.organizacion);

        const index = dtoEstadistica.estados.length - 1;
        const unidadOrg = dtoEstadistica.estados[index].unidadOrganizativa;
        const especialidades = dtoEstadistica.estados[index].especialidades;
        dtoEstadistica.estados[index].paciente = params.paciente;
        dtoEstadistica.estados[index].estado = params.estado;
        dtoEstadistica.estados[index].paciente = paciente;
        dtoEstadistica.estados[index].unidadOrganizativa = dtoCama.unidadOrganizativaOriginal || unidadOrg;
        dtoEstadistica.estados[index].especialidades = dtoCama.especialidades || especialidades;
        dtoEstadistica.estados[index].idInternacion = dtoPrestacion._id || null;
        dtoEstadistica.estados[index].esCensable = (params.esCensable !== undefined) ? params.esCensable : true;
        dtoEstadistica.estados[index].fecha = moment().startOf('hour').toDate();
        dtoEstadistica.start = moment().startOf('month').toDate();
        dtoEstadistica.end = moment().endOf('month').toDate();

        let dtoMedica = Object.create(dtoEstadistica);
        dtoMedica.capa = 'medica';

        let dtoEnfermeria = Object.create(dtoEstadistica);
        dtoEnfermeria.capa = 'enfermeria';

        dtoEstadistica._id = new ObjectId();
        dtoMedica._id = new ObjectId();
        dtoEnfermeria._id = new ObjectId();

        await camaEstadosDB.insertOne(dtoEstadistica);
        await camaEstadosDB.insertOne(dtoMedica);
        await camaEstadosDB.insertOne(dtoEnfermeria);

        dtoEstadistica['cama'] = dtoCama;
        return dtoEstadistica;
    } catch (e) {
        console.log('error: ', e)
        return e;
    }
}
