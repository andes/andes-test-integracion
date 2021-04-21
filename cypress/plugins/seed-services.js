
const { connectToDB, ObjectId } = require('./database');

module.exports.seedServices = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const ServicesDB = await client.db().collection('andes-services');

        await ServicesDB.insertOne(params);

        return {};

    } catch (e) {
        console.log(e);
        return e;
    }
}