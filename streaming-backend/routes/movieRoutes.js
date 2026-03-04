const express = require("express");
const router = express.Router();
const {
  addMovie,
  getMovieById,
  getAllMovies
} = require("../controllers/movieController");

router.post("/add", addMovie);
router.get("/", getAllMovies);           // ⭐ NEW
router.get("/:id", getMovieById);

module.exports = router;