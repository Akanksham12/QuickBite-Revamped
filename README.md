# QuickBite Revamped

A modern food ordering app built with React, Express, and MySQL. The original PHP app remains separate; this project reuses its food and category imagery.

## Features

- Responsive storefront with search, category filters, and a cart
- Customer registration, sign-in, checkout, order history, and cancellation
- Admin dashboard for catalog and order management
- MySQL schema and sample catalog data
- Password hashing, role checks, validation, and server-side price calculation

## Requirements

- Node.js 20+
- MySQL 8+ or MariaDB 10.4+

## Setup

1. Create a database and load the schema and sample data:

   ```sql
   CREATE DATABASE quickbite_revamped CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   Then import `database/schema.sql` and `database/seed.sql` using MySQL Workbench or phpMyAdmin.

   If you already imported the earlier preview menu, run the one-time correction script
   `database/migrations/20261103_align_original_food_order_catalog.sql` instead of rerunning
   `seed.sql`. It replaces unreferenced preview dishes, preserves users and orders, and aligns
   categories, descriptions, prices, and image assignments with the original `food_order` app.

2. Copy `.env.example` to `server/.env` and set your database credentials and a unique `JWT_SECRET`.
   In PowerShell, run `Copy-Item .env.example server\.env` from the project root.

3. Install dependencies and start both development servers:

   ```powershell
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. The API runs at `http://localhost:4000`.

4. Create an administrator account:

   ```powershell
   $env:ADMIN_EMAIL="admin@example.com"
   $env:ADMIN_PASSWORD="choose-a-strong-password"
   $env:ADMIN_NAME="QuickBite Admin"
   npm run create-admin --workspace server
   ```

   Sign in with that account, then use the **Admin** link in the navigation.

For a production-style local preview, build the client and start the API server. Express serves the built client on port 4000:

```powershell
npm run build
npm start
```

## Commands

```powershell
npm run dev
npm run build
npm test
```

The app intentionally does not reuse the original app's database or credentials. Create the new database separately.

## Hosting

The Express server binds to `0.0.0.0` and uses the `PORT` environment variable, as required by most hosting providers. For a hosted MySQL-compatible database that requires TLS, set `DB_SSL=true`; it defaults to `false` so local MariaDB can run without TLS. Set database credentials and `JWT_SECRET` as environment variables in the hosting provider rather than committing them.
