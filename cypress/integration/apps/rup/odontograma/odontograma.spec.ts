

describe('RUP - Odontograma', () => {
    let token;
    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
        cy.task('database:seed:paciente');
    })

    beforeEach(() => {
        cy.server();
        cy.snomedSearchStub('odontograma', rupBuscador, 'rup-buscador');
        cy.snomedFrecuentesStub(frecuentes);
        cy.expressionStub('^721145008', 'odontograma-piezas-dentales.json');
        cy.route('GET', '/api/modules/rup/prestaciones/huds/**', []).as('huds');

        cy.task(
            'database:seed:prestacion',
            { paciente: '586e6e8627d3107fde116cdb', tipoPrestacion: '598ca8375adc68e2a0c121cd' }
        ).then((prestacion) => {
            const idPrestacion = prestacion._id;
            cy.goto('/rup/ejecucion/' + idPrestacion, token);
        });
    })

    it('Seleccion simple de caras de diente', () => {
        cy.RupBuscarConceptos('odontograma');
        cy.seleccionarConcepto(0);
        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.plexButton('Limpiar selección').click();
    })

    it('Seleccion multiple de caras de diente', () => {
        cy.RupBuscarConceptos('odontograma');
        cy.seleccionarConcepto(0);

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });
        cy.plexButton('Limpiar selección').click();
    })

    it('Guardar odontograma', () => {
        cy.RupBuscarConceptos('odontograma');
        cy.seleccionarConcepto(0);

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });
        cy.plexButton('Guardar consulta de odontología').click({ force: true });
    })

    it('Registrar Tratamiento de conducto', () => {
        cy.RupBuscarConceptos('odontograma');
        cy.seleccionarConcepto(0);

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);

        cy.get('snomed-buscar').plexText('name="searchTerm"', '{selectall}{backspace}');
        cy.get('rup-buscador button').contains('FRECUENTES POR PRESTACION').click();
        cy.get('rup-buscador').plexText('name="search"', '{selectall}{backspace}');

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });


        cy.plexButtonIcon('plus').click();

        cy.get('.badge').contains('diente 18');
        cy.get('.badge').contains('diente 14');
        cy.get('.badge').contains('diente 11');
        cy.get('.badge').contains('diente 26');


        cy.plexButton('Guardar consulta de odontología').click({ force: true });
    })


    it('Desvincular Caras', () => {
        cy.RupBuscarConceptos('odontograma');
        cy.seleccionarConcepto(0);

        cy.plexBool('label="Seleccionar piezas/caras múltiples"', true);

        cy.get('path[class="diente vestibular diente-null"]').first().click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(3).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(5).click({ force: true });
        cy.get('path[class="diente vestibular diente-null"]').eq(10).click({ force: true });

        cy.get('snomed-buscar').plexText('name="searchTerm"', '{selectall}{backspace}');
        cy.get('rup-buscador button').contains('FRECUENTES POR PRESTACION').click();
        cy.get('rup-buscador').plexText('name="search"', '{selectall}{backspace}');
        cy.plexButtonIcon('plus').click();

        cy.get('button[title="Desvincular"]').eq(1).click({ force: true });
        cy.plexButton('Quitar relación').click();
        cy.get('.badge').contains('diente 18').should('not.exist');
    });
});

function formatDocumento(documentoPac) {
    // armamos un documento con puntos como se muestra en la lista de pacientes
    if (documentoPac) {
        return documentoPac.substr(0, documentoPac.length - 6) + '.' + documentoPac.substr(-6, 3) + '.' + documentoPac.substr(-3);
    }
    return documentoPac;
}

const frecuentes = [
    {
        frecuencia: 1,
        esSolicitud: false,
        concepto: {
            "conceptId": "3561000013109",
            "fsn": "odontograma (elemento de registro)",
            "semanticTag": "elemento de registro",
            "term": "odontograma",
            "refsetIds": []
        }
    },
    {
        frecuencia: 2,
        esSolicitud: false,
        concepto: {
            "conceptId": "48787009",
            "fsn": "tratamiento de conducto en un premolar, sin arreglo final (procedimiento)",
            "semanticTag": "procedimiento",
            "term": "tratamiento de conducto en un premolar, sin arreglo final",
            "refsetIds": []
        }
    }
];

const rupBuscador = [
    {
        "conceptId": "3561000013109",
        "fsn": "odontograma (elemento de registro)",
        "semanticTag": "elemento de registro",
        "term": "odontograma",
        "refsetIds": []
    }
];