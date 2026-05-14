/// <reference types="cypress" />

const ADMIN_EMAIL = "igornejman13@gmail.com";
const ADMIN_PASSWORD = "admin12345";

function ensureAdmin() {
  return cy.request({
    method: "POST",
    url: "/api/auth/register",
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: "Admin",
      lastName: "Admin",
    },
    failOnStatusCode: false,
  });
}

Cypress.Commands.add(
  "loginByApi",
  (
    email: string,
    password: string,
    firstName = "Test",
    lastName = "User",
    targetRole: "guest" | "developer" | "devops" | "admin" = "developer",
  ) => {
    ensureAdmin().then(() => {
      cy.request({
        method: "POST",
        url: "/api/auth/register",
        body: { email, password, firstName, lastName },
        failOnStatusCode: false,
      }).then(() => {
        cy.request("POST", "/api/auth/login", {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }).then((adminRes) => {
          const adminToken = adminRes.body.token;

          cy.request("POST", "/api/auth/login", { email, password }).then(
            (userRes) => {
              const userToken = userRes.body.token;
              const userId = userRes.body.user.id;
              const currentRole = userRes.body.user.role;

              if (currentRole !== targetRole) {
                cy.request({
                  method: "PATCH",
                  url: `/api/users/${userId}/role`,
                  headers: { Authorization: `Bearer ${adminToken}` },
                  body: { role: targetRole },
                });
              }

              window.localStorage.setItem("authToken", userToken);
              cy.intercept("GET", "/api/notifications", {
                body: { notifications: [] },
              }).as("notifications");
              cy.intercept("GET", "/api/notifications/unread-count", {
                body: { count: 0 },
              }).as("unreadCount");
              cy.visit("/");
              cy.wait(["@notifications", "@unreadCount"], { timeout: 10000 });
              cy.contains("Historyjki projektu").should("be.visible");
            },
          );
        });
      });
    });
  },
);

declare global {
  namespace Cypress {
    interface Chainable {
      loginByApi(
        email: string,
        password: string,
        firstName?: string,
        lastName?: string,
        targetRole?: "guest" | "developer" | "devops" | "admin",
      ): Chainable<void>;
    }
  }
}
