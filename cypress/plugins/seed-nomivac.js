
const { connectToDB, ObjectId } = require('./database');

module.exports.seedNomivac = async (mongoUri, params) => {
    try {
        const client = await connectToDB(mongoUri);
        const NomivacDB = await client.db().collection('nomivac');

        const PacienteDB = await client.db().collection('paciente');
        const paciente = await PacienteDB.findOne({ _id: new ObjectId(params.paciente) });
        const nombreVacuna = params.vacuna;
        const dosis = params.dosis;

        const vacuna = {
            "_id": new ObjectId(),
            "idvacuna": 3,
            "documento": paciente.documento,
            "nombre": paciente.nombre,
            "apellido": paciente.apellido,
            "fechaNacimiento": paciente.fechaNacimiento,
            "sexo": paciente.sexo,
            "vacuna": nombreVacuna,
            "dosis": dosis,
            "fechaAplicacion": new Date("2014-07-26T21:00:00.000-03:00"),
            "efector": "CENTRO DE SALUD SAN LORENZO SUR"
        }

        await NomivacDB.insertOne(vacuna);

        return vacuna;

    } catch (e) {
        console.log(e)
        return e;
    }
}