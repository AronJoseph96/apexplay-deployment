const express  = require("express");
const router   = express.Router();
const Section  = require("../models/Section");
const Movie    = require("../models/Movie");

// GET /sections — public, returns active sections with movies populated
router.get("/", async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true })
      .sort({ order: 1 })
      .populate("movies");
    res.json(sections);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /sections/all — admin, returns all including inactive
router.get("/all", async (req, res) => {
  try {
    const sections = await Section.find().sort({ order: 1 }).populate("movies");
    res.json(sections);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /sections — create
router.post("/", async (req, res) => {
  try {
    const { name, type, movies, order, isActive } = req.body;
    const section = await Section.create({ name, type: type||"row", movies: movies||[], order: order||0, isActive: isActive !== false });
    res.status(201).json(section);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /sections/:id — update
router.put("/:id", async (req, res) => {
  try {
    const { name, type, movies, order, isActive } = req.body;
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      { name, type, movies, order, isActive },
      { new: true }
    ).populate("movies");
    res.json(section);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /sections/:id
router.delete("/:id", async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;