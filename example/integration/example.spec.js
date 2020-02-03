context("Example Cypress Test", () => {
  context("Check Cypress page", () => {
    context("Check content Cypress example page", () => {
      beforeEach("Visit Cypress page 1", function visitCypressHook1() {
        cy.visit("https://example.cypress.io");
        throw Error ("ohhh!")
      });
      it("should contain Cypress", function() {
        cy.contains("Cypress");
      });

      it("should contain Commands", function() {
        cy.contains("Commands");
      });

      it("should contain gfkjdgkjdfgl (failed)", function() {
        cy.contains("gfkjdgkjdfgl").screenshot();
      });
    });
    context("Check url Cypress example page", () => {
      beforeEach("Visit Cypress page 2", function visitCypressHook2() {
        cy.visit("https://example.cypress.io");
      });
      it("should contain cypress", function() {
        cy.url().should("include", "cypress");
      });
      it("should contain example", function() {
        cy.url()
          .should("include", "example");
      });
      it('skipped test');
    });
  });
  context("Check content of Google", () => {
    beforeEach("Visit Google page", () => {
      cy.visit("https://www.google.com/");
    });
    it("url should contain google", function() {
      cy.url().should("include", "google")
    });
    it("check contain of google page (failed)", () => {
      cy.contains("example").screenshot();
    });
  });
});
