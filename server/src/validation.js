import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(30).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(190),
  password: z.string().min(1).max(72),
});

export const checkoutSchema = z.object({
  items: z.array(z.object({
    foodId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(50),
  })).min(1).max(50),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().min(8).max(500),
});

export const categorySchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().default(""),
  imageName: z.string().trim().max(255).optional().default(""),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export const foodSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional().default(""),
  price: z.coerce.number().positive().max(100000),
  imageName: z.string().trim().max(255).optional().default(""),
  categoryId: z.coerce.number().int().positive(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export const orderStatusSchema = z.object({
  status: z.enum(["Confirmed", "Preparing", "On the way", "Delivered", "Cancelled"]),
});
