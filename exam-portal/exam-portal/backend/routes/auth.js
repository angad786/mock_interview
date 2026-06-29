const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const db = require("../db/database");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "2h";

function normalizeMobile(mobile) {
  return String(mobile || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^91/, "")
    .slice(-10);
}

/* -------------------------------------------------------------------------- */
/* Validation rules                                                          */
/* -------------------------------------------------------------------------- */

const registerValidationRules = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required.")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid 10-digit Indian mobile number."),

  // ---- LOCATION FIELDS: all mandatory ----
  body("locationText")
    .trim()
    .notEmpty()
    .withMessage("Location (address/area) is required. Please allow location access or enter it manually."),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required. Please share your location to register.")
    .bail()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid number between -90 and 90."),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required. Please share your location to register.")
    .bail()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid number between -180 and 180."),
];

const loginValidationRules = [
  body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Invalid email."),
  body("password").notEmpty().withMessage("Password is required."),
];

/* -------------------------------------------------------------------------- */
/* POST /api/auth/register                                                  */
/* -------------------------------------------------------------------------- */
router.post("/register", registerValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { fullName, email, mobile, password, locationText, latitude, longitude } = req.body;
  const normalizedMobile = normalizeMobile(mobile);

  try {
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const existingMobileUser = db.findUserByMobile(normalizedMobile);
    if (existingMobileUser) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered.",
      });
    }

    const passwordHash = password;

    const newUser = db.createUser({
      fullName,
      email: email.toLowerCase(),
      mobile: normalizedMobile,
      passwordHash,
      location: {
        text: locationText,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. You can now log in.",
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        mobile: newUser.mobile,
        location: newUser.location,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

/* -------------------------------------------------------------------------- */
/* POST /api/auth/login                                                     */
/* -------------------------------------------------------------------------- */
router.post("/login", loginValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { email, password } = req.body;

  try {
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
});

module.exports = router;
