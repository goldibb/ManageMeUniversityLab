describe("Autentykacja", () => {
  const timestamp = Date.now();
  const email = `user${timestamp}@example.com`;
  const password = "haslo123";

  beforeEach(() => {
    cy.visit("/");
  });

  it("powinien zarejestrować nowego użytkownika i przekierować do oczekiwania na zatwierdzenie", () => {
    cy.contains("Zaloguj się lub utwórz konto").should("be.visible");
    cy.get('[role="tab"]').contains("Rejestracja").click();

    cy.get("input[type='email']").last().type(email);
    cy.get("input[type='password']").last().type(password);
    cy.get("input[type='text']").eq(0).type("Jan");
    cy.get("input[type='text']").eq(1).type("Kowalski");
    cy.contains("Zarejestruj się").click();

    cy.contains("Oczekiwanie na zatwierdzenie").should("be.visible");
  });

  it("powinien umożliwić wylogowanie z ekranu oczekiwania na zatwierdzenie", () => {
    cy.get('[role="tab"]').contains("Rejestracja").click();
    cy.get("input[type='email']").last().type(`guest${timestamp}@example.com`);
    cy.get("input[type='password']").last().type(password);
    cy.get("input[type='text']").eq(0).type("Jan");
    cy.get("input[type='text']").eq(1).type("Kowalski");
    cy.contains("Zarejestruj się").click();

    cy.contains("Oczekiwanie na zatwierdzenie").should("be.visible");
    cy.contains("Wyloguj").click();

    cy.contains("Zaloguj się lub utwórz konto").should("be.visible");
  });

  it("powinien zalogować użytkownika z rolą developer", () => {
    cy.loginByApi(`dev${timestamp}@example.com`, password, "Anna", "Nowak", "developer");
    cy.contains("Historyjki projektu").should("be.visible");
  });
});
