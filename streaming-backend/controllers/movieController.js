const Movie=require("../models/Movie");
const cloudinary=require("../config/cloudinary");

// ADD MOVIE (manual insert)
exports.addMovie=async(req,res)=>{
try{
const movie=await Movie.create(req.body);
res.json(movie);
}catch(err){
res.status(500).json({error:err.message});
}
};

// GET ONE MOVIE
exports.getMovieById=async(req,res)=>{
try{
const movie=await Movie.findById(req.params.id);
res.json(movie);
}catch(err){
res.status(500).json({error:err.message});
}
};

// GET ALL MOVIES + FILTER
exports.getAllMovies=async(req,res)=>{
try{

const{q,genres,lang,yearFrom,yearTo}=req.query;
let filter={};

if(q){
filter.title={$regex:q,$options:"i"};
}

if(genres){
const genreList=genres.split(",");
filter.genres={$in:genreList};
}

if(lang){
filter.language={$regex:new RegExp(lang,"i")};
}

if(yearFrom||yearTo){
filter.releaseYear={};
if(yearFrom)filter.releaseYear.$gte=Number(yearFrom);
if(yearTo)filter.releaseYear.$lte=Number(yearTo);
}

const movies=await Movie.find(filter);
res.json(movies);

}catch(err){
res.status(500).json({error:err.message});
}
};


// UPLOAD MOVIE (Admin panel)
exports.uploadMovie=async(req,res)=>{
try{

if(!req.files||!req.files.poster||!req.files.banner||!req.files.video){
return res.status(400).json({error:"Missing files"});
}

const{
title,
description,
releaseYear,
duration,
rating,
genres,
language,
category
}=req.body;

// Upload poster
const posterUpload=await cloudinary.uploader.upload(
req.files.poster[0].path,
{folder:"posters"}
);

// Upload banner
const bannerUpload=await cloudinary.uploader.upload(
req.files.banner[0].path,
{folder:"banners"}
);

// Upload video
const videoUpload=await cloudinary.uploader.upload(
req.files.video[0].path,
{
resource_type:"video",
folder:"movies"
}
);

const movie=new Movie({
title,
description,
poster:posterUpload.secure_url,
banner:bannerUpload.secure_url,
releaseYear,
duration,
rating,
genres:genres?JSON.parse(genres):[],
language,
trailerUrl:videoUpload.secure_url,
videoUrl:videoUpload.secure_url,
category
});

await movie.save();

res.json({message:"Movie uploaded successfully"});

}catch(err){
console.error(err);
res.status(500).json({error:"Upload failed"});
}
};