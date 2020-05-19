/// <reference types="Cypress" />

context("RUP - Epicrisis", () => {
  let token;
  const paciente = "3399661";
  before(() => {
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
    cy.server();
    cy.goto("/internacion/inicio", token);
    cy.route("GET", "**api/core/mpi/pacientes?**").as("busquedaPaciente");
    cy.route("GET", "**api/core/log/paciente?idPaciente=**").as(
      "seleccionPaciente"
    );
    cy.route("POST", "**/api/modules/rup/prestaciones**").as("prestaciones");
    cy.route("GET", "**/api/modules/rup/prestaciones?idPaciente=**").as(
      "prestacionesPaciente"
    );
    cy.route("GET", "**/api/modules/rup/prestaciones/**").as("getPrestacion");
    cy.route("GET", "**/api/modules/rup/internaciones/ultima/**").as(
      "ultimaInternacion"
    );
    cy.route("GET", "/api/modules/rup/prestaciones/huds/**", []).as("huds");
  });

  it("Iniciar EPICRISIS", () => {
    cy.plexText("name=buscador", paciente);
    cy.wait("@busquedaPaciente").then(xhr => {
      expect(xhr.status).to.be.eq(200);
    });
    cy.get(".table-striped")
      .find("td")
      .contains(paciente)
      .click();

    cy.wait("@prestacionesPaciente").then(xhr => {
      expect(xhr.status).to.be.eq(200);
    });

    cy.plexDropdown('label="NUEVO REGISTRO"', "EPICRISIS");

    cy.wait("@prestaciones").then(xhr => {
      expect(xhr.status).to.be.eq(200);
    });

    cy.wait("@getPrestacion").then(xhr => {
      expect(xhr.status).to.be.eq(200);
    });

    let monthAgo = Cypress.moment()
      .add(-30, "days")
      .format("DD/MM/YYYY");

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
      `plex-text[label="Observaciones"] quill-editor div[class="ql-container ql-snow"] div p`
    ).type(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      { force: true }
    );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(1)
      .click();
    cy.get("textarea")
      .eq(1)
      .type(
        "Tratamiento Recibido Durante La Internación: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(2)
      .click();
    cy.get("textarea")
      .eq(2)
      .type(
        "Resumen De Laboratorios: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(3)
      .click();
    cy.get("textarea")
      .eq(3)
      .type(
        "Resumen De Procedimientos: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(4)
      .click();
    cy.get("textarea")
      .eq(4)
      .type(
        "Situaciones Pendientes: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(5)
      .click();
    cy.get("textarea")
      .eq(5)
      .type(
        "Tratamiento A Seguir Post Internación: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(6)
      .click();
    cy.get("textarea")
      .eq(6)
      .type(
        "Dieta A Seguir Post Internación: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButtonIcon("chevron-left").click();
    cy.plexButtonIcon("chevron-down")
      .eq(7)
      .click();
    cy.get("textarea")
      .eq(7)
      .type(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        { force: true }
      );

    cy.plexButton("Guardar epicrisis médica").click();
  });
});
