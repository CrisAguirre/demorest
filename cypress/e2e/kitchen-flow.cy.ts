/// <reference types="cypress" />

describe('Flujo Crítico: POS → Cocina', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { _id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin', isActive: true },
        accessToken: 'fake-token-admin'
      }
    }).as('login');

    cy.intercept('GET', '/api/products/all', { fixture: 'products.json' }).as('products');
    cy.intercept('GET', '/api/kitchen-orders', { fixture: 'kitchen-orders.json' }).as('kitchenOrders');
    cy.intercept('PATCH', '/api/kitchen-orders/*/accept', { statusCode: 200, body: { status: 'en_preparacion' } }).as('acceptOrder');
    cy.intercept('PATCH', '/api/kitchen-orders/*/deliver', { statusCode: 200, body: { status: 'entregado' } }).as('deliverOrder');
    cy.intercept('GET', '/api/settings', { statusCode: 200, body: { name: 'Test Restaurant' } }).as('settings');
  });

  it('1. Login como admin', () => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').first().type('admin@test.com');
    cy.get('input[type="password"]').first().type('123456');
    cy.get('button[type="submit"], .btn-primary').first().click();
    cy.wait('@login');
    cy.url().should('include', '/dashboard');
  });

  it('2. POS crea una venta con mesa', () => {
    cy.intercept('POST', '/api/sales', {
      statusCode: 201,
      body: { _id: 'sale1', total: 25000, items: [{ productName: 'Burger', quantity: 2 }] }
    }).as('createSale');

    cy.visit('/pos');
    cy.wait('@products');
    cy.get('.product-card, .menu-item').first().click();
    cy.get('input[placeholder*="mesa"], input[type="number"]').first().type('5');
    cy.get('button').contains(/pagar|cobrar|finalizar|completar/i).click();
    cy.wait('@createSale');
    cy.contains(/venta|éxito|completada|creada/i).should('be.visible');
  });

  it('3. Cocina ve el pedido nuevo', () => {
    cy.visit('/kitchen');
    cy.wait('@kitchenOrders');
    cy.get('.new-order').should('have.length.at.least', 1);
  });

  it('4. Cocinero acepta pedido', () => {
    cy.visit('/kitchen');
    cy.wait('@kitchenOrders');
    cy.get('.new-order').first().click();
    cy.get('.swal2-confirm, button:contains("Aceptar")').click();
    cy.wait('@acceptOrder');
    cy.get('.cooking-order').should('have.length.at.least', 1);
  });

  it('5. Cocinero entrega pedido', () => {
    cy.visit('/kitchen');
    cy.wait('@kitchenOrders');
    cy.get('.cooking-order').first().click();
    cy.get('.swal2-confirm, button:contains("Entregado")').click();
    cy.wait('@deliverOrder');
    cy.get('.delivered-order').should('have.length.at.least', 1);
  });
});
