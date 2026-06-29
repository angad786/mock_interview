/**
 * Lightweight file-based JSON database.
 *
 * Why not a real DB? This project is meant to be downloaded and run
 * instantly with zero setup (no Postgres/MySQL install, no native
 * module compilation like better-sqlite3 requires). For a real
 * production deployment, swap this module out for Postgres/MySQL/Mongo —
 * the rest of the app only talks to the functions exported below, so
 * the swap is isolated to this one file.
 */

const fs = require("fs");
const path = require("path");
const { getUsersFilePath, ensureDir } = require("./storage");

const USERS_FILE = getUsersFilePath();

// Ensure data directory + file exist
function init() {
  const dataDir = path.dirname(USERS_FILE);
  ensureDir(dataDir);
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [], nextId: 1 }, null, 2));
  }
}

function readData() {
  init();
  const raw = fs.readFileSync(USERS_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Corrupt file fallback — don't crash the server
    return { users: [], nextId: 1 };
  }
}

function writeData(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function findUserByEmail(email) {
  const data = readData();
  return data.users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
}

function normalizeMobile(mobile) {
  return String(mobile || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^91/, "")
    .slice(-10);
}

function findUserByMobile(mobile) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return undefined;
  const data = readData();
  return data.users.find((u) => normalizeMobile(u.mobile) === normalized);
}

function findUserById(id) {
  const data = readData();
  return data.users.find((u) => u.id === id);
}

function createUser(user) {
  const data = readData();
  const newUser = {
    id: data.nextId,
    ...user,
    createdAt: new Date().toISOString(),
  };
  data.users.push(newUser);
  data.nextId += 1;
  writeData(data);
  return newUser;
}

function getAllUsersSafe() {
  // Returns users without password hashes — useful for an admin view
  const data = readData();
  return data.users.map(({ passwordHash, ...rest }) => rest);
}

module.exports = {
  init,
  findUserByEmail,
  findUserByMobile,
  findUserById,
  createUser,
  getAllUsersSafe,
};
