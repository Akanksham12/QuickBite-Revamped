import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";
import { groupOrderRows } from "../src/order-utils.js";

async function withServer(run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health endpoint responds without a database connection", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("customer orders require authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders/mine`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "Please sign in to continue." });
  });
});

test("admin endpoints reject unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/summary`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "Please sign in to continue." });
  });
});

test("groups MariaDB order item rows into the history response shape", () => {
  const createdAt = new Date("2026-11-03T08:00:00Z");
  const orders = groupOrderRows([
    { orderId: 7, total: 350, status: "Confirmed", createdAt, title: "Margherita Pizza", quantity: 1, price: 250 },
    { orderId: 7, total: 350, status: "Confirmed", createdAt, title: "Lassi", quantity: 2, price: 50 },
    { orderId: 6, total: 100, status: "Delivered", createdAt, title: "Samosa", quantity: 5, price: 20 },
  ]);

  assert.deepEqual(orders, [
    {
      id: 7,
      total: 350,
      status: "Confirmed",
      createdAt,
      items: [
        { title: "Margherita Pizza", quantity: 1, price: 250 },
        { title: "Lassi", quantity: 2, price: 50 },
      ],
    },
    {
      id: 6,
      total: 100,
      status: "Delivered",
      createdAt,
      items: [{ title: "Samosa", quantity: 5, price: 20 }],
    },
  ]);
});

test("includes customer details when grouping orders for admins", () => {
  const [order] = groupOrderRows([{
    orderId: 4,
    total: 100,
    status: "Confirmed",
    createdAt: new Date("2026-11-03T08:00:00Z"),
    phone: "555-0100",
    address: "42 Example Street",
    customerName: "Jamie Example",
    customerEmail: "jamie@example.com",
    title: "Samosa",
    quantity: 5,
    price: 20,
  }], { includeCustomer: true });

  assert.equal(order.phone, "555-0100");
  assert.equal(order.address, "42 Example Street");
  assert.equal(order.customerName, "Jamie Example");
  assert.equal(order.customerEmail, "jamie@example.com");
});
