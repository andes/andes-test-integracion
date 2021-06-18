
const { connectToDB, ObjectId } = require('./database');

module.exports.seedServices = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const ServicesDB = await client.db().collection('andes-services');

        await ServicesDB.deleteOne({ name: params.name });

        convertDate(params);

        await ServicesDB.insertOne(params);

        return {};

    } catch (e) {
        console.log(e);
        return e;
    }
}


function convertDate(data) {
    const dateISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d+)?Z/i;
    const dateNet = /\/Date\((-?\d+)(?:-\d+)?\)\//i;
    const traverse = function (o, func) {
        for (let i of Object.keys(o)) {
            o[i] = func.apply(this, [i, o[i]]);
            if (o[i] !== null && typeof (o[i]) === 'object') {
                traverse(o[i], func);
            }
        }
    };
    const replacer = function (key, value) {
        if (typeof (value) === 'string') {
            if (dateISO.test(value)) {
                return new Date(value);
            }
            if (dateNet.test(value)) {
                return new Date(parseInt(dateNet.exec(value)[1], 10));
            }
        }
        return value;
    };

    if (data && typeof data === 'object') {
        traverse(data, replacer);
    }
    return data;
}