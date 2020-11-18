const { connectToDB, ObjectId } = require('./database');

module.exports.seedCampania = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const campaniasDB = await client.db().collection('campanias');

        const dto = require('./data/campanias/campanias-default.json');

        const campanias = JSON.parse(JSON.stringify(dto));

        campanias._id = new ObjectId(campanias._id);
        campanias.vigencia.desde = new Date(campanias.vigencia.desde);
        campanias.vigencia.hasta = new Date(campanias.vigencia.hasta);
        campanias.fechaPublicacion = new Date(campanias.fechaPublicacion);

        await campaniasDB.insertOne(campanias);
        return campanias;

    } catch (e) {
        console.log(e)
        return e;
    }
}