const faker = require('faker');
const { connectToDB, ObjectId } = require('./database');

module.exports.createUsuario = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const usuarioDB = await client.db().collection('authUsers');

        const templateName = params.template || 'default';
        let dto = require('./data/usuario/usuario-' + templateName);
        dto = JSON.parse(JSON.stringify(dto));

        dto.nombre = params.nombre || faker.name.firstName().toLocaleUpperCase();
        dto.apellido = params.apellido || faker.name.lastName().toLocaleUpperCase();
        dto.usuario = params.usuario || (faker.random.number({ min: 40000000, max: 49999999 }));

        if (params.organizaciones && params.organizaciones.length > 0) {
            dto.organizaciones = params.organizaciones;
        }

        if (params.permisos) {
            dto.organizaciones[0].permisos = params.permisos;
        }

        for (const organizacion of dto.organizaciones) {
            organizacion._id = new ObjectId(organizacion._id)
        }

        dto._id = new ObjectId();
        await usuarioDB.insertOne(dto);

        return dto;
    } catch (e) {
        console.log(e)
        return e;
    }
}
