const express = require("express");
const Genre = require("../models/Genre");
const router = express.Router();

router.get("/", async (req, res) => {
  const genres = await Genre.find();
  res.json(genres);
});

module.exports = router;