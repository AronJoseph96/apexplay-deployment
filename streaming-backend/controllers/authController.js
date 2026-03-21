const User       = require("../models/User");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ── Email transporter ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── SIGNUP ────────────────────────────────────────────────
const ageToRating = (age) => {
  const n = parseInt(age) || 18;
  if (n < 7)  return "U";
  if (n < 13) return "U/A 7+";
  if (n < 16) return "U/A 13+";
  if (n < 18) return "U/A 16+";
  return "A";
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, age } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });
    const hashed    = await bcrypt.hash(password, 10);
    const ageRating = ageToRating(age);
    const isKids    = parseInt(age) < 13;
    const newUser   = await User.create({
      name, email, password: hashed, role: "USER",
      profiles: [{
        name,
        avatar: "/avatars/1.jpg",
        ageRating,
        isKids,
        screenTimeLimit: isKids ? 120 : null,
        collections: []
      }]
    });
    // Send welcome email (non-blocking — don't fail signup if email fails)
    transporter.sendMail({
      from:    `"ApexPlay" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: "Welcome to ApexPlay! 🎬",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#e50914;padding:28px;text-align:center">
            <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:-1px">ApexPlay</h1>
            <p style="margin:6px 0 0;font-size:14px;opacity:0.85">Your streaming journey begins</p>
          </div>
          <div style="padding:36px">
            <h2 style="margin:0 0 10px">Welcome, ${name}! 👋</h2>
            <p style="color:#aaa;margin:0 0 24px;line-height:1.7">
              Your account has been created successfully. You now have access to thousands of movies and TV shows on ApexPlay.
            </p>
            <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 8px;font-weight:700;font-size:15px">Your profile details:</p>
              <p style="margin:0;color:#aaa;font-size:14px">👤 Username: <strong style="color:#fff">${name}</strong></p>
              <p style="margin:4px 0 0;color:#aaa;font-size:14px">🎭 Profile rating: <strong style="color:#e50914">${ageRating}</strong></p>
            </div>
            <p style="color:#aaa;font-size:13px;margin:0 0 20px;line-height:1.6">
              You can add more profiles (for family members) from the profile selector after logging in.
            </p>
            <div style="text-align:center">
              <a href="http://localhost:3000/login"
                style="background:#e50914;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block">
                Start Watching →
              </a>
            </div>
          </div>
          <div style="padding:20px;text-align:center;border-top:1px solid #222">
            <p style="color:#555;font-size:12px;margin:0">© 2025 ApexPlay. All rights reserved.</p>
          </div>
        </div>
      `
    }).catch(err => console.error("Welcome email failed:", err.message));

    res.status(201).json({ message: "Signup successful", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "7d" }
    );
    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── FORGOT PASSWORD — send OTP ────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If that email exists, an OTP has been sent." });

    // Generate 6-digit OTP
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save();

    // Send via Gmail
    await transporter.sendMail({
      from:    `"ApexPlay" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: "ApexPlay — Password Reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#fff;border-radius:12px;overflow:hidden">
          <div style="background:#e50914;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:28px;letter-spacing:-1px">ApexPlay</h1>
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 8px">Password Reset</h2>
            <p style="color:#aaa;margin:0 0 24px">
              Use the OTP below to reset your password.
              It expires in <strong style="color:#fff">15 minutes</strong>.
            </p>
            <div style="background:#1a1a1a;border-radius:12px;padding:24px;text-align:center;
              letter-spacing:12px;font-size:36px;font-weight:900;color:#e50914;margin-bottom:24px">
              ${otp}
            </div>
            <p style="color:#666;font-size:13px;margin:0">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: "If that email exists, an OTP has been sent." });
  } catch (err) {
    console.error("Mail error:", err.message);
    res.status(500).json({ error: "Failed to send email. Please try again." });
  }
};

// ── RESET PASSWORD ────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.resetOTP)
      return res.status(400).json({ error: "Invalid or expired OTP." });
    if (user.resetOTP !== otp)
      return res.status(400).json({ error: "Incorrect OTP." });
    if (new Date() > user.resetOTPExpiry)
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });

    user.password       = await bcrypt.hash(newPassword, 10);
    user.resetOTP       = null;
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── VERIFY PROFILE PIN ────────────────────────────────────
exports.verifyPin = async (req, res) => {
  try {
    const { userId, profileId, pin, type } = req.body;
    // type: "entry" (default) = check profile.pin
    //       "edit"            = check profile.editPin
    const user    = await User.findById(userId);
    if (!user) return res.status(404).json({ valid: false });
    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ valid: false });

    const pinToCheck = type === "edit" ? profile.editPin : profile.pin;
    if (!pinToCheck) return res.json({ valid: true }); // no PIN set = open
    const ok = await bcrypt.compare(pin, pinToCheck);
    res.json({ valid: ok });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
};