describe("Zadania", () => {
  const timestamp = Date.now();
  const email = `tasks${timestamp}@example.com`;
  const password = "haslo123";
  let projectId: number;
  let storyId: number;

  beforeEach(() => {
    cy.loginByApi(email, password, "Test", "Tasks", "developer").then(() => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem("authToken");
        cy.request({
          method: "POST",
          url: "/api/projects",
          headers: { Authorization: `Bearer ${token}` },
          body: { name: "Projekt Zadań" },
        }).then((projRes) => {
          projectId = projRes.body.id;
          cy.request({
            method: "POST",
            url: "/api/stories",
            headers: { Authorization: `Bearer ${token}` },
            body: {
              projectId,
              name: "Historyjka z zadaniami",
              description: "",
              priority: "medium",
              state: "todo",
            },
          }).then((storyRes) => {
            storyId = storyRes.body.id;
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
  });

  it("powinien utworzyć nowe zadanie", () => {
    cy.get(".board-task").contains("Zadania").click();
    cy.contains("Zadania historyjki:").should("be.visible");

    cy.get('.task-modal__add input[type="text"]').type("Nowe zadanie");
    cy.get('.task-modal__add textarea').type("Opis zadania");
    cy.get('.task-modal__add select[aria-label="Priorytet"]').select("Wysoki");
    cy.get('.task-modal__add input[type="number"]').clear().type("5");
    cy.contains("Dodaj zadanie").click();

    cy.get(".task-column--todo .task-card").should(
      "contain.text",
      "Nowe zadanie",
    );

    cy.get(".task-modal__close").click();
  });

  it("powinien zmienić status zadania", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/tasks",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          storyId,
          name: "Zadanie do przesunięcia",
          description: "",
          priority: "medium",
          estimatedTime: 3,
          state: "todo",
          assignedUserId: null,
        },
      }).then(() => {
        cy.get(".board-task").contains("Zadania").click();
        cy.get(".task-column--todo .task-card")
          .contains("Zadanie do przesunięcia")
          .closest(".task-card")
          .find('.task-card__btn--move[title="Przenieś w prawo"]')
          .click();

        cy.get(".task-column--doing .task-card").should(
          "contain.text",
          "Zadanie do przesunięcia",
        );

        cy.get(".task-modal__close").click();
      });
    });
  });

  it("powinien edytować zadanie w panelu szczegółów", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/tasks",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          storyId,
          name: "Zadanie do edycji",
          description: "Stary opis",
          priority: "low",
          estimatedTime: 2,
          state: "todo",
          assignedUserId: null,
        },
      }).then(() => {
        cy.get(".board-task").contains("Zadania").click();
        cy.get(".task-column--todo .task-card")
          .contains("Zadanie do edycji")
          .closest(".task-card")
          .contains("Szczegóły")
          .click();

        cy.get(".task-detail").should("exist").scrollIntoView();
        cy.get(".task-detail__field")
          .contains("Nazwa")
          .next("input")
          .clear()
          .type("Zmienione zadanie", { force: true });
        cy.get(".task-detail__field")
          .contains("Opis")
          .next("textarea")
          .clear()
          .type("Nowy opis zadania", { force: true });
        cy.get(".task-detail__field")
          .contains("Priorytet")
          .next("select")
          .select("Wysoki", { force: true });
        cy.contains("Zapisz zmiany").click({ force: true });

        cy.get(".task-column--todo .task-card").should(
          "contain.text",
          "Zmienione zadanie",
        );

        cy.get(".task-modal__close").click();
      });
    });
  });

  it("powinien usunąć zadanie", () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem("authToken");
      cy.request({
        method: "POST",
        url: "/api/tasks",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          storyId,
          name: "Zadanie do usunięcia",
          description: "",
          priority: "medium",
          estimatedTime: 1,
          state: "todo",
          assignedUserId: null,
        },
      }).then(() => {
        cy.get(".board-task").contains("Zadania").click();
        cy.get(".task-column--todo .task-card")
          .contains("Zadanie do usunięcia")
          .closest(".task-card")
          .contains("Szczegóły")
          .click();

        cy.get(".task-detail").should("exist").scrollIntoView();
        cy.on("window:confirm", () => true);
        cy.contains("Usuń zadanie").click({ force: true });

        cy.get(".task-column--todo").should(
          "not.contain.text",
          "Zadanie do usunięcia",
        );

        cy.get(".task-modal__close").click();
      });
    });
  });
});
