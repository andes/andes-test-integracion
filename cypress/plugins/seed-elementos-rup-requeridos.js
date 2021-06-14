
const { connectToDB, ObjectId } = require('./database');

module.exports.createElementosRequeridos = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const ServicesDB = await client.db().collection('elementos-rup-requeridos');

        await ServicesDB.insertOne(params);

        return {};

    } catch (e) {
        console.log(e);
        return e;
    }
}