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

module.exports.seedUsuario = async (mongoUri, params) => {
    params = params || {};
    try {

        const client = await connectToDB(mongoUri);
        const usuarioDB = await client.db().collection('authUsers');

        const templateName = params.template || 'default';
        let dto = require('./data/gestor-usuarios/usuario-' + templateName);
        dto = JSON.parse(JSON.stringify(dto));

        dto.nombre = params.nombre || faker.name.firstName().toLocaleUpperCase();
        dto.apellido = params.apellido || faker.name.lastName().toLocaleUpperCase();
        dto.usuario = params.usuario || (faker.random.number({ min: 40000000, max: 49999999 }));
        dto.documento = '' + dto.usuario

        if (params.organizaciones && params.organizaciones.length > 0) {
            dto.organizaciones = params.organizaciones;
        }

        if (params.organizacion) {
            const OrganizacionDB = await client.db().collection('organizacion');
            const orgData = await OrganizacionDB.findOne({ _id: new ObjectId(params.organizacion) }, { projection: { nombre: 1 } });
            dto.organizaciones.push({
                _id: ObjectId(orgData._id),
                nombre: orgData.nombre
            })
        }

        if (params.permisos) {
            dto.organizaciones[0]['permisos'] = params.permisos;
        }

        for (const organizacion of dto.organizaciones) {
            organizacion._id = new ObjectId(organizacion._id)
        }

        dto._id = new ObjectId();
        await usuarioDB.insertOne(dto);
        return dto;
    } catch (e) {
        return e;
    }
}
