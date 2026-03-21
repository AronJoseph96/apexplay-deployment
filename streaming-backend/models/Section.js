const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name:     { type: String, required: true },       // e.g. "Trending", "Horror Night"
  type:     { type: String, enum: ["hero", "row"], default: "row" },
  movies:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  order:    { type: Number, default: 0 },           // display order on home page
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Section", sectionSchema);