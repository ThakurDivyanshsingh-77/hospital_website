const express = require("express");
const User = require("../models/User");
const { signAuthToken } = require("../utils/token");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  return res.status(403).json({ message: "Self-service signup is disabled. Please contact the administrator." });
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAuthToken(user);
    return res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login", error: error.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  return res.json({
    user: req.user.toSafeObject(),
  });
});

router.post("/bootstrap-admin", async (req, res) => {
  try {
    const adminCount = await User.count({ where: { role: "admin" } });
    if (adminCount > 0) {
      return res.status(403).json({ message: "Admin already exists" });
    }

    const fullName = String(req.body.fullName || "CareConnect Admin").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (!email || password.length < 6) {
      return res.status(400).json({ message: "Invalid admin data" });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: "admin",
    });

    const token = signAuthToken(user);
    return res.status(201).json({
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to bootstrap admin", error: error.message });
  }
});

module.exports = router;
