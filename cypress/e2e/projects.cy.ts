describe("Projekty", () => {
  const timestamp = Date.now();
  const email = `projects${timestamp}@example.com`;
  const password = "haslo123";

  beforeEach(() => {
    cy.loginByApi(email, password, "Test", "Projects", "developer");
  });

  it("powinien utworzyć nowy projekt", () => {
    cy.contains("Wybierz aktywny projekt").should("be.visible");

    cy.window().then((win) => {
      cy.stub(win, "prompt").returns("Projekt Testowy");
    });

    cy.contains("+ Nowy projekt").should("not.be.disabled").click();

    cy.contains(".app-header__project-label select option", "Projekt Testowy").should("exist");
  });

  it("powinien edytować nazwę projektu", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/projects",
        headers: { Authorization: `Bearer ${token}` },
        body: { name: "Projekt do edycji" },
      }).then((res) => {
        cy.visit("/");
        cy.contains("Historyjki projektu").should("be.visible");
        cy.get('.app-header__project-label select').select(String(res.body.id));

        cy.window().then((win) => {
          cy.stub(win, "prompt").returns("Projekt zmieniona nazwa");
        });
        cy.contains("Edytuj").should("not.be.disabled").click();

        cy.get('.app-header__project-label select option:selected').should(
          "have.text",
          "Projekt zmieniona nazwa",
        );
      });
    });
  });

  it("powinien usunąć projekt", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/projects",
        headers: { Authorization: `Bearer ${token}` },
        body: { name: "Projekt do usunięcia" },
      }).then((res) => {
        cy.visit("/");
        cy.contains("Historyjki projektu").should("be.visible");
        cy.get('.app-header__project-label select').select(String(res.body.id));

        cy.window().then((win) => {
          cy.stub(win, "confirm").returns(true);
        });
        cy.contains("Usuń").click();

        cy.contains("Wybierz aktywny projekt").should("be.visible");
      });
    });
  });
});
