const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db/database");
const { getImagesDirPath } = require("../db/storage");

const router = express.Router();
const IMAGES_DIR = getImagesDirPath();

router.get("/users", (req, res) => {
  try {
    const users = db.getAllUsersSafe();
    return res.json({ success: true, users });
  } catch (err) {
    console.error("Debug users read failed:", err);
    return res.status(500).json({ success: false, message: "Unable to read users." });
  }
});

router.get("/images", (req, res) => {
  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      return res.json({ success: true, images: [] });
    }

    const files = fs.readdirSync(IMAGES_DIR).filter((name) => {
      const fullPath = path.join(IMAGES_DIR, name);
      return fs.statSync(fullPath).isFile();
    });

    return res.json({ success: true, images: files });
  } catch (err) {
    console.error("Debug images read failed:", err);
    return res.status(500).json({ success: false, message: "Unable to read images." });
  }
});

// GET /api/debug/images/download - streams a ZIP of all images
router.get('/images/download', (req, res) => {
  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      return res.status(200).json({ success: true, message: 'No images to download', images: [] });
    }

    const files = fs.readdirSync(IMAGES_DIR).filter((name) => {
      const fullPath = path.join(IMAGES_DIR, name);
      return fs.statSync(fullPath).isFile();
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).end();
    });
    archive.pipe(res);

    files.forEach((file) => {
      const filePath = path.join(IMAGES_DIR, file);
      archive.file(filePath, { name: file });
    });

    archive.finalize();
  } catch (err) {
    console.error('Debug images download failed:', err);
    return res.status(500).json({ success: false, message: 'Unable to create ZIP.' });
  }
});

module.exports = router;
