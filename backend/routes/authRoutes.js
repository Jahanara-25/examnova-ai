const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedRollNumber = typeof rollNumber === "string" ? rollNumber.trim() : "";
    const normalizedDepartment = typeof department === "string" ? department.trim() : "";

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid registration role" });
    }

    if (role === "student" && (!normalizedRollNumber || !normalizedDepartment)) {
      return res.status(400).json({ message: "Roll number and department are required for student registration" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ...(role === "student" ? { rollNumber: normalizedRollNumber, department: normalizedDepartment } : {}),
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isHashedPassword = user.password.startsWith("$2");
    const passwordMatches = isHashedPassword ? await bcrypt.compare(password, user.password) : password === user.password;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Preserve access for any existing legacy accounts while upgrading their password securely.
    if (!isHashedPassword) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_KEY || 'examnova-local-development-secret-change-before-production';
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn: '8h' });
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber, department: user.department },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['name', 'department', 'rollNumber'];
  allowed.forEach((key) => { if (typeof req.body[key] === 'string') req.user[key] = req.body[key].trim(); });
  await req.user.save();
  res.json({ user: req.user.toObject() });
});

router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Provide your current password and a new password of at least 8 characters' });
  }
  const matches = req.user.password.startsWith('$2')
    ? await bcrypt.compare(currentPassword, req.user.password)
    : currentPassword === req.user.password;
  if (!matches) return res.status(400).json({ message: 'Current password is incorrect' });
  req.user.password = await bcrypt.hash(newPassword, 12);
  await req.user.save();
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
