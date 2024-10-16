/// <reference types="Cypress" />

context("RUP - Epicrisis", () => {
  let token;
  const paciente = "3399661";
  before(() => {
    cy.intercept('GET', '/api/modules/huds/motivosHuds/motivosHuds**', { fixture: 'huds/modalHuds.json' }).as('motivosHuds');
    cy.seed();
    cy.login("38906735", "asd").then(t => {
      token = t;
      cy.createPaciente("paciente-rup", token);
      cy.createPaciente("paciente-turno", token);
      cy.createPaciente("paciente-sobreturno", token);
      cy.createAgenda("agenda-rup", 0, 0, 1, token);
    });
  });

  beforeEach(() => {
    cy.goto("/internacion/inicio", token);
    cy.intercept("GET", "**api/core-v2/mpi/pacientes?**").as("busquedaPaciente");
    cy.intercept("GET", "**api/core/log/paciente?idPaciente=**").as(
      "seleccionPaciente"
    );
    cy.intercept("POST", "**/api/modules/rup/prestaciones**").as("prestaciones");
    cy.intercept("GET", "**/api/modules/rup/prestaciones?idPaciente=**").as(
      "prestacionesPaciente"
    );
    cy.intercept("GET", "**/api/modules/rup/prestaciones/**").as("getPrestacion");
    cy.intercept("GET", "**/api/modules/rup/internaciones/ultima/**").as(
      "ultimaInternacion"
    );
    cy.intercept("GET", "/api/modules/rup/prestaciones/huds/**", []).as("huds");
  });

  it("Iniciar EPICRISIS", () => {
    cy.plexText("name=buscador", paciente);
    cy.wait("@busquedaPaciente").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
    });
    cy.get('paciente-listado').contains(format(paciente)).click();

    cy.wait("@prestacionesPaciente").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
    });

    cy.plexDropdown('label="NUEVO REGISTRO"', "EPICRISIS");

    cy.wait("@prestaciones").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
    });

    cy.wait("@getPrestacion").then(({ response }) => {
      expect(response.statusCode).to.eq(200);
    });

    let monthAgo = Cypress.moment()
      .add(-30, "days")
      .format("DD/MM/YYYY");

    cy.get('plex-tabs').contains('Registros de esta consulta').click({ force: true });
    cy.plexDatetime('label="Ingreso"', {
      text: monthAgo,
      clear: true,
      skipEnter: true
    });
    cy.plexDatetime('label="Egreso"', {
      text: Cypress.moment().format("DD/MM/YYYY"),
      clear: true,
      skipEnter: true
    });

    cy.get(
      `plex-text[name="observaciones"] quill-editor div[class="ql-container ql-snow"] div p`
    ).type(
      "ALGO",
      { force: true, delay: 0 }
    );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(1)
      .click();
    cy.get("textarea")
      .eq(1)
      .type(
        "Tratamiento Recibido Durante La Internación",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(2)
      .click();
    cy.get("textarea")
      .eq(2)
      .type(
        "Resumen De Laboratorios",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(3)
      .click();
    cy.get("textarea")
      .eq(3)
      .type(
        "Resumen De Procedimientos",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(4)
      .click();
    cy.get("textarea")
      .eq(4)
      .type(
        "Situaciones Pendientes",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(5)
      .click();
    cy.get("textarea")
      .eq(5)
      .type(
        "Tratamiento A Seguir Post Internación",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(6)
      .click();
    cy.get("textarea")
      .eq(6)
      .type(
        "Dieta A Seguir Post Internación",
        { force: true, delay: 0 }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(7)
      .click();
    cy.get("textarea")
      .eq(7)
      .type(
        "lorem",
        { force: true, delay: 0 }
      );

    cy.plexButton("Guardar epicrisis médica").click();
  });
});


function format(s) {
  return s.substr(0, s.length - 6) + '.' + s.substr(-6, 3) + '.' + s.substr(-3);
}