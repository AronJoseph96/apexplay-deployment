const express=require("express");
const router=express.Router();

const multer=require("multer");
const upload=multer({dest:"uploads/"});

const{
addMovie,
getMovieById,
getAllMovies,
uploadMovie
}=require("../controllers/movieController");

router.post("/add",addMovie);
router.get("/",getAllMovies);
router.get("/:id",getMovieById);

router.post("/upload",
upload.fields([
{name:"poster",maxCount:1},
{name:"banner",maxCount:1},
{name:"video",maxCount:1}
]),
uploadMovie
);

module.exports=router;