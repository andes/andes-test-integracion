Cypress.Commands.add('getCama', (name) => {
    cy.get('plex-layout-main table tr').contains(name);
});

Cypress.Commands.add('getRegistrosMedicos', () => {
    cy.get('plex-layout-sidebar table tbody tr ');
})

Cypress.Commands.add('createUsuarioByCapa', (capa) => {
    return cy.task(
        'database:create:usuario',
        {
            organizacion: '57e9670e52df311059bc8964',
            permisos: [...permisosUsuario, `internacion:rol:${capa}`]
        }
    );
});

Cypress.Commands.add('loginCapa', (capa) => {
    return cy.createUsuarioByCapa(capa).then((user) => {
        return cy.login(user.usuario, user.password, user.organizaciones[0]._id).then((token) => {
            return cy.task('database:seed:paciente').then(pacientes => {
                return [user, token, pacientes];
            });
        })
    })
});

Cypress.Commands.add('factoryInternacion', (params = {}) => {
    const maquinaEstados = { ...params.maquinaEstados } || {};
    cy.task('database:create:maquinaEstados', { ...maquinaEstados, capa: 'medica' });
    cy.task('database:create:maquinaEstados', { ...maquinaEstados, capa: 'estadistica' });
    cy.task('database:create:maquinaEstados', { ...maquinaEstados, capa: 'enfermeria' });
    for (const elemento of params.configCamas) {
        const count = (elemento.pacientes) ? elemento.pacientes.length : (elemento.count || 1);
        for (let i = 0; i < count; i++) {
            const paciente = (elemento.pacientes) ? elemento.pacientes[i] : null;
            cy.task('database:create:cama', {
                estado: elemento.estado,
                unidadOrganizativa: elemento.unidadOrganizativa,
                sector: elemento.sector,
                tipoCama: elemento.tipoCama,
                esCensable: elemento.esCensable,
                paciente,
                fechaIngreso: elemento.fechaIngreso,
                fechaEgreso: elemento.fechaEgreso,
                validada: elemento.validada
            });
        }
    }
});

export const permisosUsuario = [
    'turnos:*',
    'mpi:*',
    'internacion:cama:create',
    'internacion:cama:edit',
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
    'reportes:*',
];
