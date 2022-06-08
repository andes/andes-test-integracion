Cypress.Commands.add('getCama', (name) => {
    if (name) {
        return cy.get('plex-layout-main table tbody tr').contains(name);
    } else {
        return cy.get('plex-layout-main table tbody tr');
    }
});

Cypress.Commands.add('getRegistrosMedicos', () => {
    cy.get('plex-layout-sidebar table tbody tr ');
})

Cypress.Commands.add('createUsuarioByCapa', (capa) => {
    let arrayPermisos = [...permisosUsuario];
    if(typeof capa === 'string') {
        arrayPermisos.push(`internacion:rol:${capa}`);
    } else {
        // array de capas
        capa.map(c => arrayPermisos.push(`internacion:rol:${c}`));
    }
    return cy.task(
        'database:create:usuario',
        {
            organizacion: '57e9670e52df311059bc8964',
            permisos: arrayPermisos
        }
    );
});

Cypress.Commands.add('deshacerInternacion', (completa = false) => {
    const opcionDeshacer = completa ? 'Toda la internación' : 'Último movimiento';
    cy.get('plex-layout-sidebar plex-title').eq(1).plexDropdown('tooltip="Deshacer Internacion"').click();
    cy.contains(opcionDeshacer).click();
    cy.swal('confirm', '¿Quiere deshacer esta internación?');
})

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
    cy.task('database:create:maquinaEstados', { ...maquinaEstados, capa: 'estadistica-v2' });

    if (params.sala) {
        return crearSalas(params);
    } else {
        return crearCamas(params);
    }
});

function crearCamas(params) {
    const camas = [];
    for (const elemento of params.configCamas) {
        const count = (elemento.pacientes) ? elemento.pacientes.length : (elemento.count || 1);
        for (let i = 0; i < count; i++) {
            const paciente = (elemento.pacientes) ? elemento.pacientes[i] : null;

            camas.push({
                estado: elemento.estado,
                unidadOrganizativa: elemento.unidadOrganizativa,
                sector: elemento.sector,
                tipoCama: elemento.tipoCama,
                esCensable: elemento.esCensable,
                paciente,
                fechaIngreso: elemento.fechaIngreso,
                fechaEgreso: elemento.fechaEgreso,
                validada: elemento.validada,
                extras: elemento.extras,
                usaEstadisticaV2: params.usaEstadisticaV2,
                vincularInformePrestacion: params.vincularInformePrestacion
            });
        }
    }
    return cy.taskN('database:create:cama', camas);
}

function crearSalas(params) {
    const salas = [];
    for (const elemento of params.config) {
        const count = (elemento.pacientes) ? elemento.pacientes.length : (elemento.count || 1);
        for (let i = 0; i < count; i++) {
            const paciente = (elemento.pacientes) ? elemento.pacientes[i] : null;

            salas.push({
                estado: elemento.estado,
                unidadesOrganizativas: elemento.unidadesOrganizativas,
                sectores: elemento.sectores,
                paciente,
                fechaIngreso: elemento.fechaIngreso,
                fechaEgreso: elemento.fechaEgreso,
            });
        }
    }
    return cy.taskN('database:create:sala', salas);
}

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
    'internacion:registros',
    'internacion:inicio',
    'internacion:descargarListado',
    'internacion:sala:create',
    'internacion:sala:edit',
    'internacion:sala:delete',
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

