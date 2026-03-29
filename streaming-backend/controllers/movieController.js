const Movie      = require("../models/Movie");
const cloudinary = require("../config/cloudinary");
const fs         = require("fs");


// Sanitize title for Cloudinary folder name
const slugify = (str) => (str || "unknown").replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "_") || "unknown";

const uploadToCloudinary = async (filePath, options = {}) => {
  const result = await cloudinary.uploader.upload(filePath, options);
  try { fs.unlinkSync(filePath); } catch (_) {}
  return result;
};

exports.getAllMovies = async (req, res) => {
  try {
    const { q, genres, lang, yearFrom, yearTo, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      // Substring match: "dea" only matches titles containing "dea" together
      // e.g. "Deadpool", "Evil Dead", "High School of the Dead"
      // NOT "Devil May Cry" (d...e...a scattered across words)
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }
    if (genres)   filter.genres = { $in: genres.split(",") };
    if (lang)     filter.language = { $regex: new RegExp(lang, "i") };
    if (yearFrom || yearTo) {
      filter.releaseYear = {};
      if (yearFrom) filter.releaseYear.$gte = Number(yearFrom);
      if (yearTo)   filter.releaseYear.$lte = Number(yearTo);
    }
    const movies = await Movie.find(filter);
    res.json(movies);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    res.json(movie);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadMovie = async (req, res) => {
  try {
    // Parse all body fields first (handle arrays from multipart)
    let { title, description, releaseYear, duration, rating, ageRating, genres, language, category, trailerUrl, videoUrl: videoUrlBody } = req.body;
    if (Array.isArray(trailerUrl))    trailerUrl    = trailerUrl[0];
    if (Array.isArray(videoUrlBody))  videoUrlBody  = videoUrlBody[0];
    if (Array.isArray(title))         title         = title[0];
    if (Array.isArray(language))      language      = language[0];
    if (Array.isArray(category))      category      = category[0];

    console.log("uploadMovie — videoUrlBody:", videoUrlBody, "| hasVideoFile:", !!req.files?.video);

    if (!req.files?.poster || !req.files?.banner)
      return res.status(400).json({ error: "Poster and banner images are required" });

    // Must have either a video file or a URL
    if (!req.files?.video && !videoUrlBody?.trim())
      return res.status(400).json({ error: "Please upload a video file OR paste a Cloudinary video URL" });

    const lang   = slugify(language || "Unknown");
    const name   = slugify(title);
    const folder = `Movies/${lang}/${name}`;

    const [posterUp, bannerUp] = await Promise.all([
      uploadToCloudinary(req.files.poster[0].path, { folder }),
      uploadToCloudinary(req.files.banner[0].path, { folder }),
    ]);

    let finalVideoUrl = videoUrlBody?.trim() || "";
    if (req.files?.video) {
      const videoUp = await uploadToCloudinary(req.files.video[0].path, { resource_type: "video", folder });
      finalVideoUrl = videoUp.secure_url;
    }

    const movie = await Movie.create({
      title, description,
      poster: posterUp.secure_url, banner: bannerUp.secure_url,
      videoUrl: finalVideoUrl,
      trailerUrl: trailerUrl || "",
      releaseYear: Number(releaseYear), duration, rating: Number(rating),
      ageRating: ageRating || "U",
      genres: genres ? JSON.parse(genres) : [],
      language, category: category || "Movie", seasons: [],
    });
    res.status(201).json({ message: "Movie uploaded successfully", movie });
  } catch (err) { console.error(err); res.status(500).json({ error: "Upload failed: " + err.message }); }
};

exports.uploadSeries = async (req, res) => {
  try {
    if (!req.files?.poster || !req.files?.banner)
      return res.status(400).json({ error: "poster and banner are required" });

    const { title, description, releaseYear, rating, ageRating, genres, language, trailerUrl } = req.body;
    const lang   = slugify(language || "Unknown");
    const name   = slugify(title);
    const folder = `Series/${lang}/${name}`;
    const [posterUp, bannerUp] = await Promise.all([
      uploadToCloudinary(req.files.poster[0].path, { folder: `${folder}` }),
      uploadToCloudinary(req.files.banner[0].path, { folder: `${folder}` }),
    ]);

    const series = await Movie.create({
      title, description,
      poster: posterUp.secure_url, banner: bannerUp.secure_url,
      trailerUrl: trailerUrl || "",
      releaseYear: Number(releaseYear), rating: Number(rating),
      ageRating: ageRating || "U",
      genres: genres ? JSON.parse(genres) : [],
      language, category: "Series", seasons: [],
    });
    res.status(201).json({ message: "Series created successfully", series });
  } catch (err) { console.error(err); res.status(500).json({ error: "Failed: " + err.message }); }
};

exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });

    let { title, description, releaseYear, duration, rating, ageRating, genres, language, trailerUrl } = req.body;

    // Handle arrays from multipart
    if (Array.isArray(trailerUrl))  trailerUrl  = trailerUrl[0];
    if (Array.isArray(title))       title       = title[0];
    if (Array.isArray(description)) description = description[0];
    if (Array.isArray(releaseYear)) releaseYear = releaseYear[0];
    if (Array.isArray(duration))    duration    = duration[0];
    if (Array.isArray(rating))      rating      = rating[0];
    if (Array.isArray(ageRating))   ageRating   = ageRating[0];
    if (Array.isArray(language))    language    = language[0];

    if (title)                     movie.title       = title;
    if (description !== undefined) movie.description = description;
    if (releaseYear)               movie.releaseYear = Number(releaseYear);
    if (duration)                  movie.duration    = duration;
    if (rating)                    movie.rating      = Number(rating);
    if (language)                  movie.language    = language;
    if (trailerUrl !== undefined)  movie.trailerUrl  = trailerUrl;
    if (ageRating)                 movie.ageRating   = ageRating;

    // Parse genres safely — handle string, array, or undefined
    if (genres) {
      try {
        movie.genres = Array.isArray(genres) ? genres : JSON.parse(genres);
      } catch {
        movie.genres = typeof genres === "string" ? [genres] : [];
      }
    }

    // Handle file uploads — use updated language/title for folder path
    if (req.files?.poster || req.files?.banner || req.files?.video) {
      const cat    = movie.category === "Series" ? "Series" : "Movies";
      const lang   = slugify(movie.language || "Unknown");
      const name   = slugify(movie.title);
      const folder = `${cat}/${lang}/${name}`;

      if (req.files?.poster) {
        console.log("Uploading poster for:", movie.title);
        const up     = await uploadToCloudinary(req.files.poster[0].path, { folder });
        movie.poster = up.secure_url;
      }
      if (req.files?.banner) {
        console.log("Uploading banner for:", movie.title);
        const up     = await uploadToCloudinary(req.files.banner[0].path, { folder });
        movie.banner = up.secure_url;
      }
      if (req.files?.video) {
        console.log("Uploading video for:", movie.title);
        const up       = await uploadToCloudinary(req.files.video[0].path, { resource_type: "video", folder });
        movie.videoUrl = up.secure_url;
      }
    }

    await movie.save();
    res.json({ message: "Updated successfully", movie });
  } catch (err) {
    console.error("updateMovie error:", err);
    res.status(500).json({ error: "Update failed: " + err.message });
  }
};

exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addSeason = async (req, res) => {
  try {
    const { seasonNumber, title } = req.body;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    const exists = movie.seasons.find(s => s.seasonNumber === Number(seasonNumber));
    if (exists) return res.status(400).json({ error: "Season already exists" });
    movie.seasons.push({ seasonNumber: Number(seasonNumber), title: title || `Season ${seasonNumber}`, episodes: [] });
    await movie.save();
    res.json(movie);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteSeason = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    movie.seasons = movie.seasons.filter(s => s.seasonNumber !== Number(req.params.seasonNumber));
    await movie.save();
    res.json(movie);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addEpisode = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    const season = movie.seasons.find(s => s.seasonNumber === Number(req.params.seasonNumber));
    if (!season) return res.status(404).json({ error: "Season not found" });
    let { episodeNumber, title: epTitle, description: epDesc, duration: epDur, videoUrl: epVideoUrlBody } = req.body;
    if (Array.isArray(epVideoUrlBody)) epVideoUrlBody = epVideoUrlBody[0];
    if (Array.isArray(episodeNumber))  episodeNumber  = episodeNumber[0];
    const title       = epTitle;
    const description = epDesc;
    const duration    = epDur;
    console.log("addEpisode — epVideoUrlBody:", epVideoUrlBody, "| hasVideoFile:", !!req.files?.video);
    if (!req.files?.video && !epVideoUrlBody?.trim())
      return res.status(400).json({ error: "Please upload a video file OR paste a Cloudinary video URL" });

    const lang          = slugify(movie.language || "Unknown");
    const seriesName    = slugify(movie.title);
    const seasonFolder  = `Series/${lang}/${seriesName}/Season_${req.params.seasonNumber}`;

    let finalEpVideoUrl = epVideoUrlBody?.trim() || "";
    if (req.files?.video) {
      const videoUp = await uploadToCloudinary(req.files.video[0].path, { resource_type: "video", folder: seasonFolder });
      finalEpVideoUrl = videoUp.secure_url;
    }

    let thumbnailUrl = "";
    if (req.files?.thumbnail) {
      const thumbUp = await uploadToCloudinary(req.files.thumbnail[0].path, { folder: seasonFolder });
      thumbnailUrl = thumbUp.secure_url;
    }
    season.episodes.push({ episodeNumber: Number(episodeNumber), title, description, duration, videoUrl: finalEpVideoUrl, thumbnail: thumbnailUrl });
    await movie.save();
    res.json(movie);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
};


exports.updateEpisode = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    const season = movie.seasons.find(s => s.seasonNumber === Number(req.params.seasonNumber));
    if (!season) return res.status(404).json({ error: "Season not found" });
    const episode = season.episodes.find(e => e.episodeNumber === Number(req.params.episodeNumber));
    if (!episode) return res.status(404).json({ error: "Episode not found" });

    let { title, description, duration, videoUrl: videoUrlBody } = req.body;
    if (Array.isArray(videoUrlBody)) videoUrlBody = videoUrlBody[0];

    if (title)       episode.title       = title;
    if (description !== undefined) episode.description = description;
    if (duration)    episode.duration    = duration;

    // Update video — file takes priority over URL
    if (req.files?.video) {
      const lang         = slugify(movie.language || "Unknown");
      const seriesName   = slugify(movie.title);
      const seasonFolder = `Series/${lang}/${seriesName}/Season_${req.params.seasonNumber}`;
      const videoUp      = await uploadToCloudinary(req.files.video[0].path, { resource_type: "video", folder: seasonFolder });
      episode.videoUrl   = videoUp.secure_url;
    } else if (videoUrlBody?.trim()) {
      episode.videoUrl = videoUrlBody.trim();
    }

    // Update thumbnail
    if (req.files?.thumbnail) {
      const lang         = slugify(movie.language || "Unknown");
      const seriesName   = slugify(movie.title);
      const seasonFolder = `Series/${lang}/${seriesName}/Season_${req.params.seasonNumber}`;
      const thumbUp      = await uploadToCloudinary(req.files.thumbnail[0].path, { folder: seasonFolder });
      episode.thumbnail  = thumbUp.secure_url;
    }

    await movie.save();
    res.json(movie);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
};
exports.deleteEpisode = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Not found" });
    const season = movie.seasons.find(s => s.seasonNumber === Number(req.params.seasonNumber));
    if (!season) return res.status(404).json({ error: "Season not found" });
    season.episodes = season.episodes.filter(e => e.episodeNumber !== Number(req.params.episodeNumber));
    await movie.save();
    res.json(movie);
  } catch (err) { res.status(500).json({ error: err.message }); }
};