const faker = require('faker');
const { ObjectID } = require('mongodb');
const { connectToDB, ObjectId } = require('./database');

module.exports.createPacienteApp = async (mongoUri, params) => {
    params = params || {};
    try {
        const client = await connectToDB(mongoUri);
        const PacienteDB = await client.db().collection('pacienteApp');


        const templateName = params.template || 'default';
        const dto = require('./data/pacienteApp/paciente-app-' + templateName);
        const pacienteApp = JSON.parse(JSON.stringify(dto));

        if (params.fromPaciente || params.fromProfesional) {
            const PacienteDB = await client.db().collection(params.fromPaciente ? 'paciente' : 'profesional');
            const paciente = await PacienteDB.findOne({ _id: new ObjectId(params.fromPaciente || params.fromProfesional) });

            if (params.fromProfesional) {
                pacienteApp.profesionalId = paciente._id;
            }

            pacienteApp.documento = paciente.documento;
            pacienteApp.nombre = paciente.nombre;
            pacienteApp.apellido = paciente.apellido;
            pacienteApp.sexo = paciente.sexo;
            pacienteApp.fechaNacimiento = paciente.fechaNacimiento;

            if (pacienteApp.pacientes && pacienteApp.pacientes[0].id) {
                pacienteApp.pacientes[0].id = paciente._id;
                pacienteApp.pacientes[0]._id = paciente._id;
            }

            if (params.device) {
                pacienteApp.devices = [
                    params.device
                ]
            }

        } else {
            //recibe un paciente en params o vacio y usa datos propios
            pacienteApp.documento = (pacienteApp.documento) ? (pacienteApp.documento) : ('' + faker.random.number({ min: 40000000, max: 49999999 }));
            pacienteApp.nombre = (pacienteApp.nombre) ? pacienteApp.nombre : faker.name.firstName().toLocaleUpperCase();
            pacienteApp.apellido = (pacienteApp.apellido) ? pacienteApp.apellido : faker.name.lastName().toLocaleUpperCase();

            if (pacienteApp.id) {
                pacienteApp.idPaciente = params.id;
            }
            //contacto
            pacienteApp.email = (pacienteApp.email) ? pacienteApp.email.replace(' ', '') : faker.email;
            pacienteApp.telefono = (pacienteApp.telefono) ? pacienteApp.telefono : faker.phone.phoneNumber().replace('-', '').replace('-', '');

            pacienteApp.fechaNacimiento = (pacienteApp.fechaNacimiento) ? pacienteApp.fechaNacimiento : '1956-08-28T04:00:00.000Z';
            pacienteApp.sexo = (pacienteApp.sexo) ? pacienteApp.sexo : 'femenino';
            pacienteApp.genero = (pacienteApp.genero) ? pacienteApp.genero : 'femenino';

            if (pacienteApp.pacientes && pacienteApp.pacientes[0].id) {
                pacienteApp.pacientes[0].id = new ObjectId(pacienteApp.pacientes[0].id);
                pacienteApp.pacientes[0]._id = new ObjectId();
            };

        }

        pacienteApp._id = new ObjectId();
        await PacienteDB.insertOne(pacienteApp);
        return pacienteApp;
    } catch (e) {
        return e;
    }
}


