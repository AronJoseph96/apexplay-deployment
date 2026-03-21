const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }]
});

const profileSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  avatar:        { type: String, default: "/avatars/1.jpg" },
  pin:           { type: String, default: null },      // 4-digit PIN to ENTER profile (hashed)
  editPin:       { type: String, default: null },      // 4-digit PIN to EDIT/DELETE profile (hashed)
  ageRating:     { type: String, default: "A",
                   enum: ["U", "U/A 7+", "U/A 13+", "U/A 16+", "R", "A"] },
  isKids:        { type: Boolean, default: false },
  screenTimeLimit: { type: Number, default: null },    // daily minutes, null = no limit
  screenTimeUsed:  { type: Number, default: 0 },       // minutes used today
  screenTimeDate:  { type: String, default: null },    // "YYYY-MM-DD" of last reset
  collections:   [collectionSchema],
});

const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  avatar:   { type: String, default: null },

  role: {
    type: String,
    enum: ["USER", "EMPLOYEE", "ADMIN", "user", "employee", "admin"],
    default: "USER"
  },

  language:   { type: String, default: null },

  // Subscription
  subscription: {
    plan:      { type: String, enum: ["none","basic","standard","premium"], default: "none" },
    status:    { type: String, enum: ["active","expired","none"], default: "none" },
    startDate: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  profiles:   { type: [profileSchema], default: [] },

  // Password reset
  resetOTP:       { type: String, default: null },
  resetOTPExpiry: { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);