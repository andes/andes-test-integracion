
// CONSTANTES
export const permisosUsuario = [
    'turnos:*',
    'mpi:*',
    'internacion:cama:create',
    'internacion:cama:baja',
    'internacion:mapaDeCamas',
    'internacion:ingreso',
    'internacion:egreso',
    'internacion:movimientos',
    'internacion:censo',
    'internacion:inicio',
    'internacion:descargarListado',
    'rup:tipoPrestacion:5951051aa784f4e1a8e2afe1',
    'rup:tipoPrestacion:5a26e113291f463c1b982d98',
    'rup:tipoPrestacion:598ca8375adc68e2a0c121c3',
    'rup:tipoPrestacion:598ca8375adc68e2a0c121ea',
    'rup:tipoPrestacion:598ca8375adc68e2a0c121c5',
    'fa:*',
    'log:*',
    'usuarios:*',
    'reportes:*'
];

// FACTORY
function toPromise(task) {
    return new Cypress.Promise((resolve, reject) => {
        task.then(item => {
            resolve(item);
        })
    })
}

export function factoryInternacion(params = {}) {
    let camas = [];
    const maquinaEstados = { ...params.maquinaEstados } || {};
    cy.task('database:create:maquinaEstados', {...maquinaEstados, capa: 'medica' });
    cy.task('database:create:maquinaEstados', {...maquinaEstados, capa: 'estadistica' });
    cy.task('database:create:maquinaEstados', {...maquinaEstados, capa: 'enfermeria'  });
    params.configCamas.map(elemento => {
        const count = (elemento.pacientes) ? elemento.pacientes.length : (elemento.count || 1);
        for (let i = 0; i < count; i++) {
            const paciente = (elemento.pacientes) ? elemento.pacientes[i] : null;
            const camaCreada = cy.task('database:create:cama', {
                estado: elemento.estado,
                unidadOrganizativa: elemento.unidadOrganizativa,
                sector: elemento.sector,
                tipoCama: elemento.tipoCama,
                esCensable: elemento.esCensable,
                paciente,
                fechaIngreso: elemento.fechaIngreso,
                fechaEgreso: elemento.fechaEgreso,
            });
            camas.push(toPromise(camaCreada));
        }
    })

    return Cypress.Promise.all(camas);
}