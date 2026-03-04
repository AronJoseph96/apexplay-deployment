const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema({
  title: String,
  episodeNumber: Number,
  duration: String,
  videoUrl: String
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String,
  banner: String,
  releaseYear: Number,
  duration: String,
  rating: Number,
  genres: [String],
  trailerUrl: String,
  category: { type: String, enum: ["Movie", "Series"], required: true },

  // only for series:
  episodes: [episodeSchema]
});

module.exports = mongoose.model("Movie", movieSchema);