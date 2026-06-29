require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const imageRoutes = require("./routes/images");
const debugRoutes = require("./routes/debug");
const db = require("./db/database");
const { getDataDir } = require("./db/storage");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize the file-based database (creates data/users.json if missing)
db.init();

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Serve the frontend (static files) ----
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/debug", debugRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running." });
});

// Fallback: any unknown non-API route serves index.html (simple SPA-style routing)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  Government Mock Exam Portal server running`);
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  data directory: ${getDataDir()}\n`);
});
