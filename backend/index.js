// backend/index.js

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Route imports
import translateRouter from "./routes/translate.js";
import speechRouter from "./routes/speech.js";
import summarizeRouter from "./routes/summarize.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting middleware (adjust as needed)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API Routes
app.use("/translate", translateRouter);
app.use("/speech", speechRouter);
app.use("/summarize", summarizeRouter);

// Root test route
app.get("/", (req, res) => {
  res.send("✅ PodcastLingoSync backend is live!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
