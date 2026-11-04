import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import { config } from "./config.js";
import { clearSessionCookie, requireAdmin, requireAuth, setSessionCookie } from "./auth.js";
import { groupOrderRows } from "./order-utils.js";
import {
  categorySchema,
  checkoutSchema,
  foodSchema,
  loginSchema,
  orderStatusSchema,
  registerSchema,
} from "./validation.js";

export const app = express();
const clientDist = fileURLToPath(new URL("../../client/dist", import.meta.url));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    },
  },
}));
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/categories", async (_req, res, next) => {
  try {
    const [categories] = await pool.query(
      "SELECT id, title, description, image_name AS imageName, featured FROM categories WHERE active = 1 ORDER BY featured DESC, title",
    );
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get("/api/foods", async (req, res, next) => {
  try {
    const filters = ["f.active = 1", "c.active = 1"];
    const values = [];
    if (req.query.category) {
      const categoryId = Number(req.query.category);
      if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
        return res.status(400).json({ message: "Choose a valid category." });
      }
      filters.push("f.category_id = ?");
      values.push(categoryId);
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filters.push("(f.title LIKE ? OR f.description LIKE ?)");
      const search = `%${req.query.search.trim().slice(0, 100)}%`;
      values.push(search, search);
    }
    if (req.query.featured === "true") filters.push("f.featured = 1");

    const [foods] = await pool.query(
      `SELECT f.id, f.title, f.description, f.price, f.image_name AS imageName,
              f.category_id AS categoryId, c.title AS categoryTitle, f.featured
       FROM foods f JOIN categories c ON c.id = f.category_id
       WHERE ${filters.join(" AND ")}
       ORDER BY f.featured DESC, f.title`,
      values,
    );
    res.json(foods);
  } catch (error) {
    next(error);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const [result] = await pool.execute(
      "INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'customer')",
      [input.fullName, input.email.toLowerCase(), passwordHash, input.phone],
    );
    const user = { id: result.insertId, fullName: input.fullName, email: input.email.toLowerCase(), role: "customer" };
    setSessionCookie(res, user);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "An account with that email already exists." });
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const [users] = await pool.execute(
      "SELECT id, full_name AS fullName, email, password_hash AS passwordHash, role FROM users WHERE email = ?",
      [input.email.toLowerCase()],
    );
    const user = users[0];
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    delete user.passwordHash;
    setSessionCookie(res, user);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      "SELECT id, full_name AS fullName, email, phone, role FROM users WHERE id = ?",
      [req.user.sub],
    );
    if (!users[0]) {
      clearSessionCookie(res);
      return res.status(401).json({ message: "Account not found. Please sign in again." });
    }
    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", requireAuth, async (req, res, next) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check your delivery details and cart." });

  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    const { items, phone, address } = parsed.data;
    await connection.beginTransaction();
    transactionStarted = true;
    const foodIds = [...new Set(items.map((item) => item.foodId))];
    const placeholders = foodIds.map(() => "?").join(",");
    const [foods] = await connection.query(
      `SELECT id, title, price FROM foods WHERE active = 1 AND id IN (${placeholders}) FOR UPDATE`,
      foodIds,
    );
    const foodById = new Map(foods.map((food) => [food.id, food]));
    if (foodById.size !== foodIds.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ message: "One or more items are no longer available. Refresh your cart and try again." });
    }

    const totalCents = items.reduce(
      (sum, item) => sum + Math.round(foodById.get(item.foodId).price * 100) * item.quantity,
      0,
    );
    const total = (totalCents / 100).toFixed(2);
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (user_id, total, status, phone, address) VALUES (?, ?, 'Confirmed', ?, ?)",
      [req.user.sub, total, phone, address],
    );
    for (const item of items) {
      const food = foodById.get(item.foodId);
      await connection.execute(
        "INSERT INTO order_items (order_id, food_id, food_title, unit_price, quantity) VALUES (?, ?, ?, ?, ?)",
        [orderResult.insertId, food.id, food.title, food.price, item.quantity],
      );
    }
    await connection.commit();
    transactionStarted = false;
    res.status(201).json({ orderId: orderResult.insertId, total });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    next(error);
  } finally {
    connection?.release();
  }
});

app.get("/api/orders/mine", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT o.id AS orderId, o.total, o.status, o.created_at AS createdAt,
              oi.food_title AS title, oi.quantity, oi.unit_price AS price
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? ORDER BY o.created_at DESC, oi.id`,
      [req.user.sub],
    );
    res.json(groupOrderRows(rows));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/orders/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) {
      return res.status(400).json({ message: "Invalid order." });
    }
    const [result] = await pool.execute(
      "UPDATE orders SET status = 'Cancelled' WHERE id = ? AND user_id = ? AND status = 'Confirmed'",
      [orderId, req.user.sub],
    );
    if (!result.affectedRows) return res.status(409).json({ message: "This order can no longer be cancelled." });
    res.json({ message: "Order cancelled." });
  } catch (error) {
    next(error);
  }
});

app.use("/api/admin", requireAuth, requireAdmin);

app.get("/api/admin/summary", async (_req, res, next) => {
  try {
    const [[{ foodCount }]] = await pool.query("SELECT COUNT(*) AS foodCount FROM foods");
    const [[{ categoryCount }]] = await pool.query("SELECT COUNT(*) AS categoryCount FROM categories");
    const [[{ orderCount }]] = await pool.query("SELECT COUNT(*) AS orderCount FROM orders");
    const [[{ revenue }]] = await pool.query("SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status = 'Delivered'");
    res.json({ foodCount, categoryCount, orderCount, revenue });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/categories", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, description, image_name AS imageName, featured, active FROM categories ORDER BY title",
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/categories", async (req, res, next) => {
  try {
    const input = categorySchema.parse(req.body);
    const [result] = await pool.execute(
      "INSERT INTO categories (title, description, image_name, featured, active) VALUES (?, ?, ?, ?, ?)",
      [input.title, input.description, input.imageName, input.featured, input.active],
    );
    res.status(201).json({ id: result.insertId, ...input });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/categories/:id", async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return res.status(400).json({ message: "Invalid category." });
    }
    const input = categorySchema.partial().parse(req.body);
    const fields = Object.keys(input);
    if (!fields.length) return res.status(400).json({ message: "Provide at least one field to update." });
    const columns = { title: "title", description: "description", imageName: "image_name", featured: "featured", active: "active" };
    const assignments = fields.map((field) => `${columns[field]} = ?`).join(", ");
    const [result] = await pool.execute(
      `UPDATE categories SET ${assignments} WHERE id = ?`,
      [...fields.map((field) => input[field]), categoryId],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Category not found." });
    res.json({ message: "Category updated." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/foods", async (_req, res, next) => {
  try {
    const [foods] = await pool.query(
      `SELECT f.id, f.title, f.description, f.price, f.image_name AS imageName,
              f.category_id AS categoryId, f.featured, f.active, c.title AS categoryTitle
       FROM foods f JOIN categories c ON c.id = f.category_id ORDER BY f.title`,
    );
    res.json(foods);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/foods", async (req, res, next) => {
  try {
    const input = foodSchema.parse(req.body);
    const [result] = await pool.execute(
      `INSERT INTO foods (title, description, price, image_name, category_id, featured, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.title, input.description, input.price, input.imageName, input.categoryId, input.featured, input.active],
    );
    res.status(201).json({ id: result.insertId, ...input });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/foods/:id", async (req, res, next) => {
  try {
    const foodId = Number(req.params.id);
    if (!Number.isSafeInteger(foodId) || foodId < 1) {
      return res.status(400).json({ message: "Invalid food." });
    }
    const input = foodSchema.partial().parse(req.body);
    const fields = Object.keys(input);
    if (!fields.length) return res.status(400).json({ message: "Provide at least one field to update." });
    const columns = {
      title: "title", description: "description", price: "price", imageName: "image_name",
      categoryId: "category_id", featured: "featured", active: "active",
    };
    const assignments = fields.map((field) => `${columns[field]} = ?`).join(", ");
    const [result] = await pool.execute(
      `UPDATE foods SET ${assignments} WHERE id = ?`,
      [...fields.map((field) => input[field]), foodId],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Food not found." });
    res.json({ message: "Food updated." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/orders", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id AS orderId, o.total, o.status, o.phone, o.address, o.created_at AS createdAt,
              u.full_name AS customerName, u.email AS customerEmail,
              oi.food_title AS title, oi.quantity, oi.unit_price AS price
       FROM orders o JOIN users u ON u.id = o.user_id
       JOIN order_items oi ON oi.order_id = o.id
       ORDER BY o.created_at DESC, oi.id`,
    );
    res.json(groupOrderRows(rows, { includeCustomer: true }));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/orders/:id", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) {
      return res.status(400).json({ message: "Invalid order." });
    }
    const { status } = orderStatusSchema.parse(req.body);
    const [result] = await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order status updated." });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

app.use(express.static(clientDist));
app.get("*", (_req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _req, res, _next) => {
  if (error.name === "ZodError") {
    return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid request." });
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ message: "Select a valid category." });
  }
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "That record already exists." });
  }
  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
});
