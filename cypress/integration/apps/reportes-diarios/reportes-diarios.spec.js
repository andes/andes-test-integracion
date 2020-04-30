const moment = require('moment');

context('Reportes Diarios', () => {
    let token;
    let mesIndex = 0;
    const ahora = moment().startOf('hour');
    const ultimoAnioIndex = 2;
    const params = [
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(15, 'day'),    // Menos de un Año - dias
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour'),                        // Dia 1
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(6, 'month'),   // Menos de un Año - Meses
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(4, 'day'),          // Dia 5
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(2, 'year'),    // 1 a 4
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(8, 'day'),          // Dia 9
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(9, 'year'),    // 5 a 14
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(12, 'day'),         // Dia 13
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(17, 'year'),   // 15 a 19
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(16, 'day'),         // Dia 17
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(29, 'year'),   // 20 a 39
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(20, 'day'),         // Dia 21
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(54, 'year'),   // 40 a 69
            fechaPrestacion: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').add(24, 'day'),         // Dia 25
        },
        {
            fechaNacimiento: moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour').subtract(80, 'year'),   // 70 y mas
            fechaPrestacion:  moment().startOf('months').subtract(1, 'day').add(ahora.hour(), 'hour'),                          // Ultimo dia del mes
        },
    ]
    // const inicioMesAnterior = moment().startOf('months').subtract(1, 'months').add(ahora.hour(), 'hour');
    // const inicioMesActual = moment().startOf('months').subtract(ahora.hour(), 'hour');;
    // const mes = inicioMesActual - inicioMesAnterior;

    before(() => {
        cy.seed();

        // const rangoEtarios = [
        //     15,             // Menos de un Año - dias
        //     180,            // Menos de un Año - Meses
        //     365.25 * 2,     // 1 a 4
        //     365.25 * 9,     // 5 a 14
        //     365.25 * 17,    // 15 a 19
        //     365.25 * 29,    // 20 a 39
        //     365.25 * 54,    // 40 a 69
        //     365.25 * 80,    // 70 y mas
        // ];


        for(const param of params) {
            const diasPrestacion = moment.duration(param.fechaPrestacion - ahora).asDays();
            cy.task('database:create:paciente', {sexo: 'masculino', fechaNacimiento: param.fechaNacimiento })
                .then(p => cy.task('database:seed:prestacion', { 
                    paciente: p._id,
                    estado: 'validada',
                    fecha: diasPrestacion
                }));
            
            cy.task('database:create:paciente', {sexo: 'femenino', fechaNacimiento: param.fechaNacimiento })
                .then(p => cy.task('database:seed:prestacion', { 
                    paciente: p._id,
                    estado: 'validada',
                    fecha: diasPrestacion
                }));
        }

        mesIndex = params[0].fechaPrestacion.get('month');

        cy.login('30643636', 'asd')
            .then(t => token = t);
    })

    beforeEach(() => {
        cy.server();
        cy.route('GET', '**/api/core/tm/organizaciones**').as('organizaciones');
        cy.route('GET', '**/api/core/tm/tiposPrestaciones**').as('prestaciones');
        cy.goto('/reportesDiarios', token);
    });

    it('Generar reportes diarios', () => {        
        cy.plexSelectAsync('label="Organización"', 'HOSPITAL PROVINCIAL NEUQUEN', '@organizaciones', 0);
        cy.plexSelect('label="Seleccione reporte"', 0)
            .click();
        cy.plexSelect('label="Mes"', mesIndex)
            .click();
        cy.plexSelect('label="Año"', ultimoAnioIndex - (ahora.year() - params[0].fechaPrestacion.year()))
            .click();
        cy.plexSelectAsync('label="Prestación"', 'consulta con medico general', '@prestaciones', 0);

        cy.plexButton('Generar Reporte').click();
        for (let i=0; i<params.length; i++) {
            cy.get('table>tbody>tr').eq(params[i].fechaPrestacion.date() - 1).within(() => {
                // Validacion de rango etario
                cy.get('td').eq(i * 2 + 1).should('contain', 1);
                cy.get('td').eq(i * 2 + 2).should('contain', 1);
                // Validacion de los totales en el dia
                cy.get('td').eq(params.length * 2 + 1).should('contain', 1);
                cy.get('td').eq(params.length * 2 + 2).should('contain', 1);
                cy.get('td').eq(params.length * 2 + 3).should('contain', 2);
            });

            cy.get('table>tfoot>tr').eq(0).within(() => {
                // Validacion de los totales en el mes por rango etario
                cy.get('td').eq(i * 2 + 1).should('contain', 1);
                cy.get('td').eq(i * 2 + 2).should('contain', 1);
            });

            cy.get('table>tfoot>tr').eq(1).within(() => {
                 // Validacion de los totales en el mes por rango etario
                cy.get('td').eq(i).should('contain', 2);
            });
        }
        // Validamos los totales
        cy.get('table>tfoot>tr').eq(0).within(() => {
            cy.get('td').eq(params.length * 2 + 1).should('contain', params.length);
            cy.get('td').eq(params.length * 2 + 2).should('contain', params.length);
            cy.get('td').eq(params.length * 2 + 3).should('contain', params.length * 2);
        });
    });

    it('Generar reportes diarios divido por turnos', () => {
        cy.plexSelectAsync('label="Organización"', 'HOSPITAL PROVINCIAL NEUQUEN', '@organizaciones', 0);
        cy.plexSelect('label="Seleccione reporte"', 0)
            .click();
        cy.plexSelect('label="Mes"', mesIndex)
            .click();
        cy.plexSelect('label="Año"', ultimoAnioIndex - (ahora.year() - params[0].fechaPrestacion.year()))
            .click();
        cy.plexSelectAsync('label="Prestación"', 'consulta con medico general', '@prestaciones', 0);

        cy.plexBool('label="Dividir por turnos"', true);

        cy.plexButton('Generar Reporte').click();
    });
   
})
