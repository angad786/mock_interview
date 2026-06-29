const fs = require("fs");
const path = require("path");

function getDataDir() {
  const configuredDir = process.env.EXAM_PORTAL_DATA_DIR || process.env.DATA_DIR;
  if (configuredDir) {
    return path.resolve(configuredDir);
  }
  return path.join(__dirname, "data");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getUsersFilePath() {
  return path.join(getDataDir(), "users.json");
}

function getImagesDirPath() {
  return path.join(getDataDir(), "images");
}

module.exports = {
  getDataDir,
  ensureDir,
  getUsersFilePath,
  getImagesDirPath,
};
