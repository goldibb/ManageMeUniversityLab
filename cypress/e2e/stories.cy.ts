describe("Historyjki", () => {
  const timestamp = Date.now();
  const email = `stories${timestamp}@example.com`;
  const password = "haslo123";
  let projectId: number;

  beforeEach(() => {
    cy.loginByApi(email, password, "Test", "Stories", "developer").then(() => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem("authToken");
        cy.request({
          method: "POST",
          url: "/api/projects",
          headers: { Authorization: `Bearer ${token}` },
          body: { name: "Projekt Historyjek" },
        }).then((projRes) => {
          projectId = projRes.body.id;
          cy.request({
            method: "PATCH",
            url: "/api/users/me/active-project",
            headers: { Authorization: `Bearer ${token}` },
            body: { projectId },
          });
          cy.visit("/");
          cy.contains("Historyjki projektu").should("be.visible");
        });
      });
    });
  });

  it("powinien utworzyć nową historyjkę", () => {
    cy.get('.board-add-task input[placeholder="Nazwa"]').type("Nowa historyjka");
    cy.get('.board-add-task input[placeholder="Opis"]').type("Opis testowej historyjki");
    cy.get('.board-add-task button').contains("Dodaj").click();

    cy.get(".board-column--todo .board-task")
      .should("contain.text", "Nowa historyjka")
      .and("contain.text", "Opis testowej historyjki");
  });

  it("powinien zmienić status historyjki", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/stories",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          projectId,
          name: "Historyjka do przesunięcia",
          description: "",
          priority: "medium",
          state: "todo",
        },
      }).then(() => {
        cy.reload();
        cy.get(".board-column--todo .board-task")
          .contains("Historyjka do przesunięcia")
          .closest(".board-task")
          .find('.board-task__btn--right')
          .click();

        cy.get(".board-column--doing .board-task").should(
          "contain.text",
          "Historyjka do przesunięcia",
        );

        cy.get(".board-column--doing .board-task")
          .contains("Historyjka do przesunięcia")
          .closest(".board-task")
          .find('.board-task__btn--right')
          .click();

        cy.get(".board-column--done .board-task").should(
          "contain.text",
          "Historyjka do przesunięcia",
        );
      });
    });
  });

  it("powinien edytować historyjkę", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/stories",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          projectId,
          name: "Historyjka do edycji",
          description: "Stary opis",
          priority: "low",
          state: "todo",
        },
      }).then(() => {
        cy.reload();
        cy.get(".board-column--todo .board-task")
          .contains("Historyjka do edycji")
          .closest(".board-task")
          .find('.board-task__btn--edit[title="Edytuj"]')
          .click();

        cy.get(".board-task__edit-input").clear().type("Zmieniona historyjka");
        cy.get(".board-task__edit-textarea").clear().type("Nowy opis");
        cy.contains("Zapisz").click();

        cy.get(".board-column--todo .board-task")
          .should("contain.text", "Zmieniona historyjka")
          .and("contain.text", "Nowy opis");
      });
    });
  });

  it("powinien usunąć historyjkę", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/stories",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          projectId,
          name: "Historyjka do usunięcia",
          description: "",
          priority: "medium",
          state: "todo",
        },
      }).then(() => {
        cy.reload();
        cy.get(".board-column--todo .board-task")
          .contains("Historyjka do usunięcia")
          .closest(".board-task")
          .find('.board-task__btn--delete')
          .click();

        cy.get(".board-column--todo").should(
          "not.contain.text",
          "Historyjka do usunięcia",
        );
      });
    });
  });
});
