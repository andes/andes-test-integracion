const { connectToDB } = require('./database');

module.exports.seedNomivac = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const NomivacDB = await client.db().collection('nomivac');

        const templateName = params.template || 'default';
        const dto = require('../fixtures/nomivac/vacuna');

        const vacuna = JSON.parse(JSON.stringify(dto));
        const data = await NomivacDB.insertOne(vacuna);
        vacuna._id = data.insertedId;
        return vacuna;

    } catch (e) {
        console.log(e)
        return e;
    }
}