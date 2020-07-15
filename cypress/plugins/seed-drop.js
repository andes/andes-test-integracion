
const { connectToDB } = require('./database');


module.exports.dropCollection = async (mongoUri, collection) => {
    try {
        const client = await connectToDB(mongoUri);
        await client.db().collection(collection).deleteMany({});
        return true;
    } catch (e) {
        return e;
    }
};