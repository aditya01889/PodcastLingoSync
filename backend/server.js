const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import route handlers
const transcriptionRouter = require('./routes/transcription');
const transcribeAudio = transcriptionRouter.transcribeAudio;
const translationRoutes = require('./routes/translation');
const summaryRoutes = require('./routes/summary');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configuration
const rateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000, // 24 hours
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per day
    message: {
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        resetTime: new Date(Date.now() + (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000))
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        // Skip rate limiting for premium tokens
        const token = req.headers.authorization || req.body.premium_token || req.query.premium_token;
        return token && token === process.env.PREMIUM_TOKEN_SECRET;
    }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/transcribe-audio', rateLimit(rateLimitConfig));
app.use('/translate', rateLimit(rateLimitConfig));
app.use('/generate-summary', rateLimit(rateLimitConfig));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Character limit middleware
const checkCharacterLimit = (req, res, next) => {
    const maxChars = parseInt(process.env.RATE_LIMIT_MAX_CHARS) || 5000;
    const token = req.headers.authorization || req.body.premium_token || req.query.premium_token;
    const isPremium = token === process.env.PREMIUM_TOKEN_SECRET;
    
    if (!isPremium) {
        const textContent = req.body.transcript || req.body.text || '';
        if (textContent.length > maxChars) {
            return res.status(400).json({
                error: 'Character limit exceeded',
                message: `Text exceeds the maximum limit of ${maxChars} characters. Upgrade to premium for unlimited usage.`,
                limit: maxChars,
                current: textContent.length
            });
        }
    }
    next();
};

// API Routes with required endpoints
app.post('/transcribe-audio', transcribeAudio);
app.post('/translate', checkCharacterLimit, translationRoutes.translate);
app.post('/generate-summary', checkCharacterLimit, summaryRoutes.generateSummary);

// Additional API routes for compatibility
app.use('/api/transcription', transcriptionRouter);
app.use('/api/translation', translationRoutes.router);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        rateLimit: {
            windowMs: rateLimitConfig.windowMs,
            max: rateLimitConfig.max,
            maxChars: parseInt(process.env.RATE_LIMIT_MAX_CHARS) || 5000
        }
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
    console.log('Environment variables required:');
    console.log('- AZURE_SPEECH_KEY');
    console.log('- AZURE_SPEECH_REGION');
    console.log('- AZURE_TRANSLATOR_KEY');
    console.log('- AZURE_TRANSLATOR_REGION');
    console.log(`Rate limiting: ${rateLimitConfig.max} requests per ${rateLimitConfig.windowMs / 1000 / 60 / 60} hours`);
});

module.exports = app;