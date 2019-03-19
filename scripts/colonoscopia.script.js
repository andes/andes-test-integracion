var fechaInicio = new Date();
fechaInicio.setHours(15,0,0);
var fechaFin = new Date();
fechaFin.setHours(16,0,0);
db.agenda.insertOne({
    "intercalar" : false,
    "estado" : "publicada",
    "nominalizada" : true,
    "dinamica" : false,
    "bloques" : [ 
        {
            "accesoDirectoDelDia" : 1,
            "accesoDirectoProgramado" : 0,
            "reservadoGestion" : 0,
            "reservadoProfesional" : 0,
            "restantesDelDia" : 1,
            "restantesProgramados" : 0,
            "restantesGestion" : 0,
            "restantesProfesional" : 0,
            "pacienteSimultaneos" : false,
            "citarPorBloque" : false,
            "_id" : ObjectId("5c33639bba0d4011386857bb"),
            "cantidadTurnos" : 1,
            "horaInicio" : fechaInicio,
            "horaFin" : fechaFin,
            "duracionTurno" : 60,
            "cantidadSimultaneos" : null,
            "cantidadBloque" : null,
            "tipoPrestaciones" : [ 
                {
                    "_id" : ObjectId("5a26e113291f463c1b982d98"),
                    "fsn" : "colonoscopia (procedimiento)",
                    "semanticTag" : "procedimiento",
                    "conceptId" : "73761001",
                    "term" : "colonoscopia"
                }
            ],
            "turnos" : [ 
                {
                    "diagnostico" : {
                        "codificaciones" : []
                    },
                    "estado" : "disponible",
                    "_id" : ObjectId("5c33639bba0d4011386857bd"),
                    "horaInicio" : fechaInicio
                }
            ]
        }
    ],
    "horaInicio" : fechaInicio,
    "horaFin" : fechaFin,
    "tipoPrestaciones" : [ 
        {
            "_id" : ObjectId("5a26e113291f463c1b982d98"),
            "fsn" : "colonoscopia (procedimiento)",
            "semanticTag" : "procedimiento",
            "conceptId" : "73761001",
            "term" : "colonoscopia"
        }
    ],
    "organizacion" : {
        "_id" : ObjectId("57e9670e52df311059bc8964"),
        "nombre" : "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON"
    },
    "profesionales" : [],
    "avisos" : [],
    "sobreturnos" : [],
    "createdAt" : new Date(),
    "createdBy" : {
        "id" : "5b4ddac1bd7c1f8e591300d2",
        "nombreCompleto" : "38906735 38906735",
        "nombre" : "38906735",
        "apellido" : "38906735",
        "username" : 38906735,
        "documento" : 38906735,
        "organizacion" : {
            "_id" : "57e9670e52df311059bc8964",
            "nombre" : "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON",
            "id" : "57e9670e52df311059bc8964"
        }
    },
    "updatedAt" : new Date(),
    "updatedBy" : {
        "id" : "5bbe1e0abd7c1f8e593b03f1",
        "nombreCompleto" : "36429722 36429722",
        "nombre" : "36429722",
        "apellido" : "36429722",
        "username" : 36429722,
        "documento" : 36429722,
        "organizacion" : {
            "_id" : "57e9670e52df311059bc8964",
            "nombre" : "HOSPITAL PROVINCIAL NEUQUEN - DR. EDUARDO CASTRO RENDON",
            "id" : "57e9670e52df311059bc8964"
        }
    }
})
