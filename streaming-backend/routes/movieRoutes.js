const express = require("express");
const router  = express.Router();
const multer  = require("multer");

const upload  = multer({ dest: "uploads/" });

const {
  getAllMovies,
  getMovieById,
  uploadMovie,
  uploadSeries,
  addSeason,
  addEpisode,
  deleteEpisode,
  deleteSeason,
  deleteMovie,
  updateMovie,
} = require("../controllers/movieController");


/* ─────────────────────────────────────
   GENERAL — GET ALL
───────────────────────────────────── */
router.get("/", getAllMovies);


/* ─────────────────────────────────────
   UPLOAD ROUTES — must come BEFORE /:id
   otherwise Express matches "upload" as an id
───────────────────────────────────── */
router.post(
  "/upload/movie",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "video",  maxCount: 1 },
  ]),
  uploadMovie
);

router.post(
  "/upload/series",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  uploadSeries
);


/* ─────────────────────────────────────
   SEASONS & EPISODES — before /:id
───────────────────────────────────── */
router.post("/:id/seasons", addSeason);
router.delete("/:id/seasons/:seasonNumber", deleteSeason);

router.post(
  "/:id/seasons/:seasonNumber/episodes",
  upload.fields([
    { name: "video",     maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  addEpisode
);

router.delete(
  "/:id/seasons/:seasonNumber/episodes/:episodeNumber",
  deleteEpisode
);


/* ─────────────────────────────────────
   SINGLE ITEM — MUST be last
───────────────────────────────────── */
router.patch(
  "/:id",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateMovie
);
router.get("/:id", getMovieById);
router.delete("/:id", deleteMovie);


module.exports = router;