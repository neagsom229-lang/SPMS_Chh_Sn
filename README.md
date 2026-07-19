# SPMS Dashboard

A web dashboard for the Sale & Product Management System, backed by a real
SQLite database converted from `Sale_Product_management_System_be.accdb`.

```
spms-dashboard/
├── package.json              (root - runs both servers together)
├── backend/                  Express API on http://localhost:5000
│   ├── server.js
│   ├── config/database.js    opens backend/database/spms.db
│   ├── middleware/auth.js    JWT auth check
│   ├── routes/
│   │   ├── auth.js           POST /api/auth/login
│   │   ├── dashboard.js      summary stats + charts data
│   │   ├── products.js       full CRUD
│   │   ├── orders.js         list/create/update status
│   │   └── customers.js      list/create/update
│   └── database/spms.db      the actual data (already built for you)
└── frontend/                 React + Vite + Tailwind, on http://localhost:5173
    └── src/
        ├── components/
        │   ├── Login.jsx
        │   ├── Layout.jsx    sidebar/nav + logout
        │   ├── Dashboard.jsx charts + KPIs
        │   ├── Products.jsx  catalog, inline stock edit, add product
        │   ├── Orders.jsx    order list, change status
        │   └── Customers.jsx directory, add customer
        └── lib/api.js        fetch wrapper, attaches JWT
```

## How this is different from the earlier version

The first dashboard I gave you was a **static HTML snapshot** — data baked
into the file at export time. This one is a **real client-server app**:
Express queries an actual SQLite database file on every request. When you
edit stock, add a customer, or change an order's status in the browser, it's
a real `UPDATE`/`INSERT` hitting `backend/database/spms.db` — the change
persists and shows up next time you load the page.

It still isn't reading your live `.accdb` file directly (Node can't do that
on non-Windows without ODBC), but `spms.db` was converted 1:1 from your real
backend data, with proper types and primary keys, so this is functioning the
way a real deployed system would.

## Setup (Windows, Node.js already installed)

```powershell
cd spms-dashboard
npm run install:all
npm run dev
```

This starts the backend on **http://localhost:5000** and the frontend on
**http://localhost:5173** at the same time. Open the frontend URL in your
browser.

If you'd rather run them separately (two terminal windows):

```powershell
npm run dev:backend
npm run dev:frontend
```

## Logging in

The login screen checks against `Tbl_Users`, which came from your Access
database:

| Username | Password   | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| cashier  | cashier123| Cashier |

**Note:** these passwords are stored in plain text, same as in your Access
`Tbl_Users` table. That's fine for a local coursework project, but flag it in
your documentation as something you'd change (e.g. hash with bcrypt) before
any real deployment.

## Refreshing the data later

If you add more real data in Access and want this dashboard to reflect it,
export your backend `.accdb` again and send it to me — I'll rebuild
`spms.db` from the new export so the same running app picks it up (just
restart the backend, no code changes needed).

## What's actually wired up

- **Dashboard** — total revenue, order count, low-stock count, open service
  tickets, revenue-by-category chart, order-status chart, top products,
  low-stock list. All computed live from SQL queries, not hardcoded.
- **Products** — full catalog, click any stock number to edit it inline,
  "+ Add Product" form that inserts a real row.
- **Orders** — every order, change status via dropdown (writes to the DB
  immediately).
- **Customers** — directory with type/status badges, "+ Add Customer" form.

## Known limits of the current data

A few tables in your Access backend had no rows yet (`TBL_PAYMENT`,
`TBL_PROMOTION`, `Tbl_Stock_Log`, etc.) — the dashboard doesn't show sections
for those since there's nothing to display. As you use the system and those
tables fill up, this would be a good next step to add.
