const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "exam-portal-"));
process.env.EXAM_PORTAL_DATA_DIR = tempDir;

for (const modulePath of ["../db/database", "../db/storage"]) {
  delete require.cache[require.resolve(modulePath)];
}

const db = require("../db/database");
const storage = require("../db/storage");

db.init();

const user = db.createUser({
  fullName: "Persistence Test",
  email: "persistence@example.com",
  mobile: "9999999999",
  passwordHash: "hashed-password",
  location: { text: "Test City", latitude: 12.34, longitude: 56.78 },
});

assert.ok(user.id, "A user should be created");
assert.ok(fs.existsSync(path.join(tempDir, "users.json")), "users.json should be created in the configured data directory");
assert.strictEqual(storage.getImagesDirPath(), path.join(tempDir, "images"), "Images should use the configured data directory");

console.log("Persistence test passed");
