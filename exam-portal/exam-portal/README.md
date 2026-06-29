# National Mock Exam Test Portal — Starter Project

A login/registration system for a government-style mock exam portal, built
with a plain HTML/CSS/JS frontend and a Node.js + Express backend.

**Key feature: location is mandatory at registration.** A candidate cannot
create an account without sharing their location — both the browser-captured
latitude/longitude *and* a text address are required. This is enforced in
three places: the submit button stays disabled until location is captured,
the form re-checks it on submit, and the server independently rejects any
registration request missing valid location data (the real enforcement
layer, since client-side checks alone can be bypassed).

## Project structure

```
exam-portal/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── routes/
│   │   ├── auth.js            # /api/auth/register, /api/auth/login
│   │   └── user.js            # /api/user/me (protected)
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── db/
│   │   └── database.js        # File-based JSON "database" (no setup needed)
│   ├── .env.example            # Copy to .env and edit before production use
│   └── package.json
└── frontend/
    ├── index.html              # Redirects to pages/login.html
    ├── css/style.css
    ├── js/
    │   ├── api.js               # fetch() helpers
    │   ├── geolocation.js       # Browser geolocation + reverse geocoding
    │   ├── register.js          # Registration form logic + validation
    │   ├── login.js             # Login form logic
    │   └── dashboard.js         # Post-login profile page
    └── pages/
        ├── register.html
        ├── login.html
        └── dashboard.html
```

## How to run it

You need [Node.js](https://nodejs.org) version 18 or later installed.

1. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **(Optional) Configure environment variables.** Copy `.env.example` to
   `.env` and set a real `JWT_SECRET` (a long random string). If you skip
   this, a default development secret is used — fine for testing, **not**
   safe for production.

   ```bash
   cp .env.example .env
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Open the app:** go to `http://localhost:5000` in your browser. It will
   redirect to the login page; click "Create an account" to register.

The backend also serves the frontend directly (via Express static files), so
you only need to run one server — there's no separate frontend dev server
to start.

## How the data is stored

User accounts are stored in `backend/db/data/users.json`, a plain JSON file
created automatically the first time the server runs. This keeps the
project runnable instantly with zero database setup. Passwords are never
stored in plain text — they're hashed with bcrypt before being saved.

**This is fine for learning/demoing, but not for real production use.** For
a real deployment, swap `backend/db/database.js` for a proper database
(PostgreSQL, MySQL, MongoDB, etc.) — every other file in the project only
calls the functions exported from that one file, so the rest of the app
doesn't need to change.

## How the location capture works

1. On the registration page, the candidate clicks **"Use my current
   location"**.
2. The browser's built-in Geolocation API (`navigator.geolocation`) asks
   for permission and returns latitude/longitude.
3. Those coordinates are reverse-geocoded into a readable address using the
   free OpenStreetMap Nominatim API, which pre-fills the address text field
   (the candidate can edit it further).
4. The form will not submit until both the coordinates and the address text
   are present — this is enforced again on the server in
   `backend/routes/auth.js`.

**Note:** Geolocation in the browser only works over `https://` or on
`localhost` — this is a browser security rule, not something this project
controls. Running on `http://localhost:5000` during development works
fine; if you deploy this publicly, you'll need HTTPS for location capture
to work for your users.

## Security notes for going further

This is a learning/demo-grade starter, not a hardened production system.
Before using something like this for a real exam portal, you would want to:

- Move from the JSON file store to a real database with proper indexing
  and backups.
- Add rate limiting on `/api/auth/login` and `/api/auth/register` to slow
  down brute-force attempts.
- Add email verification before allowing login.
- Set a strong, secret `JWT_SECRET` via environment variables (never commit
  it to source control).
- Serve everything over HTTPS in production.
- Consider whether storing precise coordinates requires a privacy notice
  or consent flow appropriate for your jurisdiction, since it is personal
  location data.

## Customizing

- **Add real exam content:** the dashboard currently shows placeholder
  exam tiles with disabled buttons — wire these up to your actual mock
  test content/questions.
- **Admin view:** `db.getAllUsersSafe()` in `database.js` already returns
  all registered users (minus password hashes) if you want to build a
  simple admin listing page.
- **Styling:** all design tokens (colors, fonts) are CSS variables at the
  top of `frontend/css/style.css`.
