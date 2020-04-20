const request = require('request');
const faker = require('faker');
const { connectToDB, ObjectId } = require('./database');


function postModuloElastic(elasticUri, modulo) {
    const mod = { ...modulo };
    mod.id = mod._id;
    delete mod._id;
    return new Promise((resolve, reject) => {
        request({
            method: 'POST',
            url: elasticUri + '/andes/modulos/' + mod.id,
            body: JSON.stringify(mod),
            headers: {
                'content-type': 'application/json; charset=UTF-8'
            }
        }, () => {
            return resolve();
        });
    })
}

module.exports.createModulo = async (mongoUri, elasticUri, params) => {
    //recibe un modulo en params o vacio y usa datos propios
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const ModuloDB = await client.db().collection('modulos');
        let modulo = params;
        let nombre = '' + faker.random.arrayElement(['CITAS', 'MPI', 'HUDS', 'PRESTAMOS DE CARPETAS', 'INTERNACION', 'GESTOR DE USUARIOS']);
        modulo.nombre = (modulo.nombre) ? modulo.nombre.replace(' ', '') : nombre.toLocaleUpperCase();
        //se pordría usar faker.lorem.sentence(5);
        modulo.descripcion = (modulo.descripcion) ? modulo.descripcion : 'módulo que representa blabla de ' + nombre.toLocaleLowerCase();
        modulo.subtitulo = (modulo.subtitulo) ? modulo.subtitulo : 'subtitulo de ' + nombre.toLocaleLowerCase();
        modulo.linkAcceso = (modulo.linkAcceso) ? modulo.linkAcceso : '/' + nombre.toLowerCase() + '/' + faker.lorem.word();

        modulo.color = (modulo.color) ? (modulo.color).replace(' ', '') : '#' + faker.random.number({ min: 40000000, max: 49999999, precision: 16 });
        modulo.icono = (modulo.icono) ? (modulo.icono).replace(' ', '') :
            'mdi-' + faker.random.arrayElement(['calendar', 'hotel', 'account-key', 'folder', 'contacts', 'account-multiple-outline']);
        // permisos: si no contiee permisos se vincula el permiso de acuerdo al nombre del módulo
        if (!modulo.permisos) {
            modulo.permisos =
                (modulo.nombre.toLocaleUpperCase() == 'CITAS') ? [faker.random.arrayElement(['turnos:planificarAgenda:?', 'turnos:darTurnos:?'])] :
                    (modulo.nombre.toLocaleUpperCase() == 'MPI') ? ['mpi:?'] :
                        (modulo.nombre.toLocaleUpperCase() == 'HUDS') ? ['rup:?', 'huds:?'] :
                            (modulo.nombre.toLocaleUpperCase() == 'PRESTAMOS DE CARPETAS') ? ['prestamos:?'] :
                                (modulo.nombre.toLocaleUpperCase() == 'INTERNACION') ?
                                    [faker.random.arrayElement(['internacion:mapaDeCamas:?', 'internacion:inicio:?'])] :
                                    (modulo.nombre.toLocaleUpperCase() == 'PRESTAMOS DE CARPETAS') ? ['prestamos:?'] :
                                        (modulo.nombre.toLocaleUpperCase() == 'GESTOR DE USUARIOS') ? ['usuarios:?'] : [];
        }

        modulo._id = new ObjectId();
        let ins = await ModuloDB.insertOne(modulo);
        await postModuloElastic(elasticUri, modulo);
        return modulo;
    } catch (e) {
        return e;
    }
}