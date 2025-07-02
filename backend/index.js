// Use CommonJS
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Route imports (require instead of import)
const translationRouter = require("./routes/translation.js");
const transcriptionRouter = require("./routes/transcription.js");
const summaryRouter = require("./routes/summary.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(limiter);

// Mount routes
app.use("/translate", translationRouter);
app.use("/transcribe", transcriptionRouter);
app.use("/summary", summaryRouter);

app.get("/", (req, res) => {
  res.send("✅ PodcastLingoSync backend is live!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
