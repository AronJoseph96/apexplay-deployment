const express = require("express");
const Language = require("../models/Language");
const router = express.Router();

router.get("/", async (req, res) => {
  const langs = await Language.find();
  res.json(langs);
});

module.exports = router;