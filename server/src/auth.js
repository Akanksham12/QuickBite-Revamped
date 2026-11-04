import jwt from "jsonwebtoken";
import { config } from "./config.js";

const cookieName = "quickbite_session";
const sevenDays = 7 * 24 * 60 * 60 * 1000;

export function setSessionCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sevenDays,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });
    req.user = jwt.verify(token, config.JWT_SECRET);
    return next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  return next();
}
