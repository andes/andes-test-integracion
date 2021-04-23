/// <reference types="Cypress" />
let formResources = require('../../../../../data/formResources/formResources.json');
formResources = JSON.parse(JSON.stringify(formResources));

context('Ficha Epidemiológica', () => {
    let token;
    let form;

    before(() => {
        cy.seed();
        cy.login('30643636', 'asd').then(t => {
            token = t;
        });
    })

    beforeEach(() => {
        cy.fixture('/form/form-example.json').then(json => {
            form = json;
        });
        cy.server();
        cy.route('POST', 'api/modules/forms/formulario').as('post');
        cy.goto('/forms', token);
    })

    const tiposList = [
        { id: 'string', nombre: 'Texto' },
        { id: 'int', nombre: 'Numerico' },
        { id: 'select', nombre: 'Selección' },
        { id: 'date', nombre: 'Fecha' },
        { id: 'boolean', nombre: 'Booleano' },
        { id: 'phone', nombre: 'Teléfono' },
        { id: 'dependencia', nombre: 'Dependencia' },
        { id: 'snomed', nombre: 'Snomed' },
        { id: 'table', nombre: 'Tabla' }
    ];


    it('crear nuevo formulario', () => {
        
        cy.plexButton('Nuevo formulario').click();
        cy.plexText('name="nombre"', form.name);
        cy.plexText('name="tipo"', form.type);

        let i = 0;

        for (let s of form.sections) {
            for (let e of s.fields) {
                cy.plexButton('AGREGAR CAMPO').click();
                let lastRow = () => cy.get('div[class="form-item border-blue"]').last();
                lastRow().plexText('label="Clave"', e.key);
                lastRow().plexText('label="Nombre"', e.label);
                lastRow().plexSelectType('label="Tipo de campo"', tiposList.find(t => t.id === e.type).nombre);
                lastRow().plexText('label="Descripción"', e.description);
                lastRow().plexSelectType('label=Sección', formResources.find(t => t.id === s.id).name);

                if(e.type === 'select') {
                    lastRow().plexSelectType('label="Tipo de recurso"', formResources.find(t => t.id === e.resources).name);
                } else if(e.type === 'int') {
                    lastRow().plexInt('label="Mínimo"', parseInt(e.min));
                    lastRow().plexInt('label="Máximo"', parseInt(e.max));
                } else if(e.type === 'snomed') {
                    lastRow().plexText('label="Snomed Code / Query"', e.snomedCodeOrQuery);
                }

                lastRow().plexBool('label="Requerido"', e.required);

                i++;
            }
        }
        cy.plexButton('Guardar').click();
        cy.wait('@post').then((xhr) => {
            expect(xhr.status).to.be.eq(200);
            const compare = (o1, o2) => {
                Object.keys(o1).forEach(k => {
                    if (o1[k] === Object(o1[k])) {
                        compare(o1[k],o2[k])
                    } else {
                        expect(o1[k]).to.be.eq(o2[k]) 
                    }
                })
            }
            compare(form, xhr.response.body);
        });
    });
})