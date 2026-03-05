const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ApexPlay API Running...");
});

// Auto-create admin
const createAdmin = require("./config/createAdmin");
connectDB().then(() => {
  createAdmin();
});

app.use("/users",require("./routes/userRoutes"));
app.use("/languages", require("./routes/languageRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/movies", require("./routes/movieRoutes"));
app.use("/genres", require("./routes/genreRoutes"));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
