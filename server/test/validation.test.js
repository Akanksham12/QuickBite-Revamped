import test from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema, foodSchema, loginSchema, registerSchema } from "../src/validation.js";

test("registration requires a valid email and a strong-enough password", () => {
  assert.equal(registerSchema.safeParse({
    fullName: "Jamie Example",
    email: "jamie@example.com",
    password: "correct-horse",
  }).success, true);
  assert.equal(registerSchema.safeParse({
    fullName: "J",
    email: "not-an-email",
    password: "123",
  }).success, false);
});

test("login rejects a missing password", () => {
  assert.equal(loginSchema.safeParse({ email: "jamie@example.com", password: "" }).success, false);
});

test("checkout limits quantities and requires delivery details", () => {
  assert.equal(checkoutSchema.safeParse({
    items: [{ foodId: 1, quantity: 2 }],
    phone: "555-0101",
    address: "42 Example Street",
  }).success, true);
  assert.equal(checkoutSchema.safeParse({
    items: [{ foodId: 1, quantity: 51 }],
    phone: "555-0101",
    address: "42 Example Street",
  }).success, false);
});

test("food prices must be positive", () => {
  assert.equal(foodSchema.safeParse({
    title: "Veggie bowl",
    price: 180,
    categoryId: 1,
  }).success, true);
  assert.equal(foodSchema.safeParse({
    title: "Veggie bowl",
    price: 0,
    categoryId: 1,
  }).success, false);
});
