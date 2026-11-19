
const { connectToDB, ensurePacienteTextIndex } = require('./database');


module.exports.dropCollection = async (mongoUri, collection) => {
    try {
        const client = await connectToDB(mongoUri);
        await client.db().collection(collection).deleteMany({});
        if (collection === 'paciente') {
            await ensurePacienteTextIndex(client.db());
        }
        return true;
    } catch (e) {
        return e;
    }
};