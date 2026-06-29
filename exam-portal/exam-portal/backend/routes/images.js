const express = require("express");
const fs = require("fs");
const path = require("path");
const { getImagesDirPath, ensureDir } = require("../db/storage");

const router = express.Router();

const STORAGE_DIR = getImagesDirPath();

function ensureStorageDir() {
  ensureDir(STORAGE_DIR);
}

router.post("/save-camera-image", async (req, res) => {
  try {
    ensureStorageDir();

    const imageBase64 = req.body?.imageBase64;
    const requestedFileName = req.body?.fileName || `camera-${Date.now()}.jpg`;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ success: false, message: "No camera image was provided." });
    }

    const matches = imageBase64.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Image data format was invalid." });
    }

    const extension = matches[1].toLowerCase() === "png" ? "png" : "jpg";
    const fileName = requestedFileName.endsWith(`.${extension}`) ? requestedFileName : `${requestedFileName}.${extension}`;
    const destination = path.join(STORAGE_DIR, fileName.replace(/[^a-zA-Z0-9._-]/g, "_"));
    const buffer = Buffer.from(matches[2], "base64");

    fs.writeFileSync(destination, buffer);

    return res.json({
      success: true,
      fileName: path.basename(destination),
      folder: path.relative(path.join(__dirname, ".."), STORAGE_DIR).replace(/\\/g, "/"),
    });
  } catch (error) {
    console.error("Camera image save failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save the camera image to the server.",
    });
  }
});

module.exports = router;
