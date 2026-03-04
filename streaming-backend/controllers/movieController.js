const Movie = require("../models/Movie");

// Add movie
exports.addMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one movie
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMovies = async (req, res) => {
  try {
    const { q, genres, lang, yearFrom, yearTo } = req.query;

    let filter = {};

    // Title search
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    // Genre filter
    if (genres) {
      const genreList = genres.split(",");
      filter.genres = { $in: genreList };
    }

    // Language filter
    if (lang) {
      filter.language = { $regex: new RegExp(lang, "i") };
    }

    // Year range
    if (yearFrom || yearTo) {
      filter.releaseYear = {};
      if (yearFrom) filter.releaseYear.$gte = Number(yearFrom);
      if (yearTo) filter.releaseYear.$lte = Number(yearTo);
    }

    const movies = await Movie.find(filter);
    res.json(movies);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};