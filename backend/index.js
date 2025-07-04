// Add global error handlers at the top
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (err && err.stack) {
    console.error('Stack Trace:', err.stack);
  }
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  if (reason && reason.stack) {
    console.error('Stack Trace:', reason.stack);
  }
});

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

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use("/translate", translationRouter);
app.use("/transcribe", transcriptionRouter);
app.use("/summary", summaryRouter);

app.get("/", (req, res) => {
  res.send("✅ PodcastLingoSync backend is live!");
});

// Add Express error-handling middleware at the end
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  if (err && err.stack) {
    console.error('Stack Trace:', err.stack);
  }
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
