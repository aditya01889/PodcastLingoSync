// backend/index.js

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// ✅ Correct route imports
import translationRouter from "./routes/translation.js";
import transcriptionRouter from "./routes/transcription.js";
import summaryRouter from "./routes/summary.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(limiter);

// ✅ Mount routes with correct endpoints
app.use("/translate", translationRouter);
app.use("/transcribe", transcriptionRouter);
app.use("/summary", summaryRouter);

// Health check route
app.get("/", (req, res) => {
  res.send("✅ PodcastLingoSync backend is live!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
