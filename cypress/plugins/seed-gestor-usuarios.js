const faker = require('faker');
const {
    connectToDB,
    ObjectId
} = require('./database');

module.exports.seedPerfil = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const PerfilDB = await client.db().collection('authPerfiles');

        const templateName = params.template || 'default';
        const dto = require(`./data/gestor-usuarios/perfil-${templateName}`);
        let perfil = JSON.parse(JSON.stringify(dto));

        perfil.nombre = params.nombre || faker.name.jobTitle();

        if (params.activo !== undefined && params.activo !== null) {
            perfil.activo = params.activo;
        }

        perfil.organizacion = new ObjectId(params.organizacion ? params.organizacion : perfil.organizacion);

        if (params.permisos) {
            perfil.permisos = params.permisos;
        }

        perfil._id = new ObjectId();
        await PerfilDB.insertOne(perfil);

        return perfil;

    } catch (e) {
        return e;
    }
}