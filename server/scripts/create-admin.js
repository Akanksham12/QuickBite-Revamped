import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME?.trim() || "QuickBite Admin";

if (!email || !password || password.length < 12) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before running this script.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = 'admin'`,
      [fullName, email, passwordHash],
    );
    console.log(`Administrator account ready for ${email}.`);
  } catch (error) {
    console.error("Could not create the administrator account:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
