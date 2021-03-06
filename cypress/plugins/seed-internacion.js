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

        dtoCama.organizacion = params.organizacion || dtoCama.organizacion;
        dtoCama.organizacion._id = ObjectId(dtoCama.organizacion._id);
        dtoCama.nombre = params.nombre || ('CAMA ' + faker.random.number({ min: 0, max: 9999 }));

        if (params.unidadOrganizativa) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoCama.organizacion._id });
            organizacion.unidadesOrganizativas.map(unidadOrg => {
                if (unidadOrg.conceptId === params.unidadOrganizativa) {
                    dtoCama.unidadOrganizativaOriginal = unidadOrg;
                }
            });
        }

        if (params.sector) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoCama.organizacion._id });
            dtoCama.sectores = getRuta(organizacion, params.sector);
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

        // dtoCama.equipamiento = params.equipamiento || dtoCama.equipamiento;
        dtoCama._id = new ObjectId();
        await camaDB.insertOne(dtoCama);

        let paciente = null;
        let dtoPrestacion = {};
        const fechaEgreso = params.fechaEgreso || null;
        // PRESTACION
        if (params.estado === 'ocupada') {
            const prestacionesDB = await client.db().collection('prestaciones');
            dtoPrestacion = require('./data/prestacion/prestacion-internacion');
            dtoPrestacion = JSON.parse(JSON.stringify(dtoPrestacion));
            dtoPrestacion._id = new ObjectId();
            dtoPrestacion.solicitud.organizacion.id = ObjectId(dtoCama.organizacion._id) || ObjectId(dtoPrestacion.solicitud.organizacion.id);
            dtoPrestacion.ejecucion.organizacion.id = ObjectId(dtoCama.organizacion._id) || ObjectId(dtoPrestacion.ejecucion.organizacion.id);
            dtoPrestacion.ejecucion.fecha = moment(params.fechaIngreso).toDate() || moment().startOf('hour').toDate();
            dtoPrestacion.ejecucion.registros[0].valor.informeIngreso.fechaIngreso = moment(params.fechaIngreso).toDate() || moment().startOf('hour').toDate();

            if (params.paciente) {
                const pacientesDB = await client.db().collection('paciente');
                paciente = await pacientesDB.findOne({ documento: params.paciente.documento });
            } else {
                paciente = dtoPrestacion.paciente;
            }

            if (fechaEgreso && moment(fechaEgreso).isAfter(params.fechaIngreso)) {
                dtoPrestacion.ejecucion.registros.push(prestacionEgreso);
                dtoPrestacion.ejecucion.registros[1].valor.InformeEgreso.fechaEgreso = fechaEgreso;
                dtoPrestacion.ejecucion.registros[1].valor.InformeEgreso.diasDeEstada = moment(fechaEgreso).diff(moment(params.fechaIngreso), 'days');
            }

            if (params.validada) {
                dtoPrestacion.estados.push({
                    "idOrigenModifica": null,
                    "motivoRechazo": null,
                    "observaciones": null,
                    "tipo": "validada",
                });
            }

            dtoPrestacion.estadoActual = dtoPrestacion.estados[dtoPrestacion.estados.length - 1];

            paciente._id = ObjectId(paciente._id);
            paciente.id = ObjectId(paciente._id);
            dtoPrestacion.paciente.id = ObjectId(paciente._id)
            await prestacionesDB.insertOne(dtoPrestacion);
        }

        // ESTADOS DE CAMA
        const camaEstadosDB = await client.db().collection('internacionCamaEstados');
        let dtoEstadistica = require('./data/internacion/cama-estado');

        dtoEstadistica = JSON.parse(JSON.stringify(dtoEstadistica));
        dtoEstadistica.idCama = ObjectId(dtoCama._id);
        dtoEstadistica.idOrganizacion = ObjectId(dtoCama.organizacion._id);

        const index = dtoEstadistica.estados.length - 1;
        const unidadOrg = dtoEstadistica.estados[index].unidadOrganizativa;
        const especialidades = dtoEstadistica.estados[index].especialidades;
        dtoEstadistica.estados[index].estado = params.estado;
        dtoEstadistica.estados[index].extras = params.extras;
        dtoEstadistica.estados[index].paciente = paciente;
        dtoEstadistica.estados[index].unidadOrganizativa = dtoCama.unidadOrganizativaOriginal || unidadOrg;
        dtoEstadistica.estados[index].especialidades = dtoCama.especialidades || especialidades;
        dtoEstadistica.estados[index].idInternacion = dtoPrestacion._id || null;
        dtoEstadistica.estados[index].esCensable = (params.esCensable !== undefined) ? params.esCensable : true;
        dtoEstadistica.estados[index].esMovimiento = true;
        dtoEstadistica.estados[index].fecha = moment(params.fechaIngreso).toDate() || moment().startOf('hour').toDate();
        dtoEstadistica.estados[index].equipamiento = params.equipamiento || dtoCama.equipamiento;

        if (paciente) {
            dtoEstadistica.estados.unshift({
                estado: 'disponible',
                fecha: moment(dtoEstadistica.estados[index].fecha).subtract(2, 'hours').toDate(),
                esMovimiento: true,
                paciente: null,
                unidadOrganizativa: dtoCama.unidadOrganizativaOriginal || unidadOrg,
                especialidades: especialidades,
                idInternacion: null,
                esCensable: (params.esCensable !== undefined) ? params.esCensable : true,
                equipamiento: dtoCama.equipamiento || dtoEstadistica.estados[index].equipamiento
            });
        }

        dtoEstadistica.start = moment(params.fechaIngreso).startOf('month').toDate() || moment().startOf('month').toDate();
        dtoEstadistica.end = moment(params.fechaIngreso).endOf('month').toDate() || moment().endOf('month').toDate();

        if (fechaEgreso && moment(fechaEgreso).isAfter(params.fechaIngreso)) {
            dtoEstadistica.estados.push({
                estado: 'disponible',
                fecha: moment(fechaEgreso).toDate(),
                esMovimiento: true,
                paciente: null,
                unidadOrganizativa: dtoCama.unidadOrganizativaOriginal || unidadOrg,
                especialidades: especialidades,
                idInternacion: null,
                esCensable: (params.esCensable !== undefined) ? params.esCensable : true,
                equipamiento: dtoCama.equipamiento || dtoEstadistica.estados[index].equipamiento
            });
        }

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

module.exports.createSala = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const salaDB = await client.db().collection('internacionSalaComun');

        let dtoSala = require('./data/internacion/sala-default');
        dtoSala = JSON.parse(JSON.stringify(dtoSala));

        dtoSala.organizacion = params.organizacion || dtoSala.organizacion;
        dtoSala.organizacion._id = ObjectId(dtoSala.organizacion._id);
        dtoSala.organizacion.id = ObjectId(dtoSala.organizacion._id);
        dtoSala.nombre = params.nombre || ('SALA ' + faker.random.number({ min: 0, max: 9999 }));

        if (params.unidadesOrganizativas) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoSala.organizacion._id });
            dtoSala.unidadOrganizativas = [];
            organizacion.unidadesOrganizativas.map(unidadOrg => {
                if (unidadOrg.conceptId === params.unidadOrganizativa) {
                    dtoSala.unidadOrganizativas.push(unidadOrg);
                }
            });
        }

        if (params.sectores) {
            const organizacionDB = await client.db().collection('organizacion');
            const organizacion = await organizacionDB.findOne({ _id: dtoCama.organizacion._id });
            dtoSala.sectores = [];
            params.sectores.map(sector => {
                dtoSala.sectores.push(getRuta(organizacion, sector));
            });
        }

        dtoSala._id = new ObjectId();
        await salaDB.insertOne(dtoSala);

        // SNAPSHOT DE SALA
        const salaSnapshotDB = await client.db().collection('internacionSalaComunSnapshot');
        let dtoSnapshot = require('./data/internacion/sala-snapshot');

        dtoSnapshot = JSON.parse(JSON.stringify(dtoSnapshot));
        dtoSnapshot['idSalaComun'] = ObjectId(dtoSala._id);
        dtoSnapshot['organizacion'] = dtoSala.organizacion;
        dtoSnapshot.organizacion['id'] = ObjectId(dtoSala.organizacion._id);
        dtoSnapshot['nombre'] = dtoSala.nombre;
        dtoSnapshot['capacidad'] = dtoSala.capacidad;
        dtoSnapshot['unidadOrganizativas'] = dtoSala.unidadOrganizativas || dtoSnapshot.unidadOrganizativas;
        dtoSnapshot['sectores'] = dtoSala.sectores || dtoSnapshot.sectores;
        dtoSnapshot['fecha'] = moment().startOf('month').toDate();

        await salaSnapshotDB.insertOne(dtoSnapshot);

        // MOVIMIENTO SALA
        if (params.paciente) {
            const salaMovimientoDB = await client.db().collection('internacionSalaComunMovimientos');
            let dtoMovimiento = {
                accion: 'IN',
                idSalaComun: ObjectId(dtoSala._id),
                organizacion: dtoSala.organizacion,
                paciente: {
                    id: ObjectId(params.paciente._id),
                    documento: params.paciente.documento,
                    nombre: params.paciente.nombre,
                    apellido: params.paciente.apellido,
                    sexo: params.paciente.sexo,
                    genero: params.paciente.genero,
                    fechaNacimiento: params.paciente.fechaNacimiento
                },
                idInternacion: new ObjectId(),
                fecha: moment(params.fechaIngreso).toDate(),
                extras: {
                    ingreso: true
                },
                unidadOrganizativas: dtoSala.unidadOrganizativas,
                createdAt: moment(params.fechaIngreso).toDate(),
            }

            await salaMovimientoDB.insertOne(dtoMovimiento);
        }

        return dtoSnapshot;
    }
    catch (e) {
        return e;
    }
}

function getRuta(organizacion, item) {
    for (let sector of organizacion.mapaSectores) {
        let res = makeTree(sector, item);
        if (res) {
            return res;
        }
    }
    return [];
}


function makeTree(sector, item) {
    if (sector.hijos && sector.hijos.length > 0) {
        for (let sec of sector.hijos) {
            let res = makeTree(sec, item);
            if (res) {
                let r = clone(sector);
                return [r, ...res];
            }
        }
        return null;
    } else {
        if (item._id === sector._id) {
            let r = clone(sector);
            return [r];
        } else {
            return null;
        }
    }
}

function clone(item) {
    let r = Object.assign({}, item);
    delete r['hijos'];
    return r;
}

var prestacionEgreso = {
    privacy: {
        scope: 'public'
    },
    destacado: false,
    esSolicitud: false,
    esDiagnosticoPrincipal: true,
    relacionadoCon: [],
    registros: [],
    esPrimeraVez: true,
    nombre: 'alta del paciente',
    concepto: {
        fsn: 'alta del paciente (procedimiento)',
        semanticTag: 'procedimiento',
        refsetIds: [
            '900000000000497000'
        ],
        conceptId: '58000006',
        term: 'alta del paciente'
    },
    valor: {
        InformeEgreso: {
            fechaEgreso: moment(new Date()).add(1, 'days'),
            nacimientos: [
                {
                    pesoAlNacer: null,
                    condicionAlNacer: null,
                    terminacion: null,
                    sexo: null
                }
            ],
            procedimientosQuirurgicos: [],
            causaExterna: {
                producidaPor: null,
                lugar: null,
                comoSeProdujo: null
            },
            diasDeEstada: 1.0,
            tipoEgreso: {
                id: 'Alta médica',
                nombre: 'Alta médica'
            },
            diagnosticoPrincipal: {
                idCie10: 1187.0,
                idNew: 3568.0,
                capitulo: '10',
                grupo: '02',
                causa: 'J12',
                subcausa: '9',
                codigo: 'J12.9',
                nombre: '(J12.9) Neumonía viral, no especificada',
                sinonimo: 'Neumonia viral, no especificada',
                descripcion: '10.Enfermedades del sistema respiratorio (J00-J99)',
                c2: true,
                reporteC2: 'Neumonia',
            }
        }
    }
}