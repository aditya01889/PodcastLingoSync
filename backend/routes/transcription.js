const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const azureSpeech = require('../services/azureSpeech');
const upload = require('../middleware/upload');

// Direct transcribe-audio endpoint (required format)
const transcribeAudio = async (req, res) => {
    upload.single('audioFile')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                error: 'File upload error',
                message: err.message
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No audio file provided',
                    message: 'Please select an audio file to upload'
                });
            }

            const filePath = req.file.path;
            const language = req.body.language || 'en-US';

            // Perform transcription directly (synchronous approach for direct endpoint)
            const transcriptionResult = await azureSpeech.transcribeAudio(filePath, language);

            // Clean up uploaded file and converted files
            try {
                fs.unlinkSync(filePath);
                azureSpeech.cleanupConvertedFiles();
            } catch (cleanupError) {
                console.warn('Failed to cleanup file:', cleanupError.message);
            }

            res.json({
                transcript: transcriptionResult.text,
                confidence: transcriptionResult.confidence,
                duration: transcriptionResult.duration,
                language: language,
                fileName: req.file.originalname,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Transcription error:', error);
            
            // Clean up uploaded file and converted files on error
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    azureSpeech.cleanupConvertedFiles();
                } catch (cleanupError) {
                    console.warn('Failed to cleanup file after error:', cleanupError.message);
                }
            }

            // Provide more specific error messages
            let errorMessage = error.message;
            if (errorMessage.includes('Invalid WAV header') || errorMessage.includes('RIFF was not found')) {
                errorMessage = 'The audio file format is not supported or the file is corrupted. Please try uploading a different audio file (MP3, WAV, M4A, etc.).';
            } else if (errorMessage.includes('No speech detected')) {
                errorMessage = 'No speech was detected in the audio file. Please ensure the file contains clear speech.';
            } else if (errorMessage.includes('Authentication')) {
                errorMessage = 'Speech recognition service authentication failed. Please contact support.';
            }

            res.status(500).json({
                error: 'Transcription failed',
                message: errorMessage
            });
        }
    });
};

// Store transcription jobs in memory (in production, use a database)
const transcriptionJobs = new Map();

// Upload and start transcription
router.post('/upload', upload.single('audioFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                message: 'Please select an audio file to upload'
            });
        }

        const jobId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        const filePath = req.file.path;
        const language = req.body.language || 'en-US';

        // Initialize job status
        transcriptionJobs.set(jobId, {
            status: 'processing',
            fileName: req.file.originalname,
            filePath: filePath,
            language: language,
            startTime: new Date(),
            progress: 0
        });

        // Start transcription asynchronously
        processTranscription(jobId, filePath, language);

        res.json({
            jobId: jobId,
            status: 'processing',
            message: 'Transcription started successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
});

// Get transcription status
router.get('/status/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const job = transcriptionJobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            error: 'Job not found',
            message: 'The specified transcription job does not exist'
        });
    }

    res.json(job);
});

// Get supported languages
router.get('/languages', (req, res) => {
    const supportedLanguages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'es-ES', name: 'Spanish (Spain)' },
        { code: 'es-MX', name: 'Spanish (Mexico)' },
        { code: 'fr-FR', name: 'French (France)' },
        { code: 'de-DE', name: 'German (Germany)' },
        { code: 'it-IT', name: 'Italian (Italy)' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)' },
        { code: 'ja-JP', name: 'Japanese (Japan)' },
        { code: 'ko-KR', name: 'Korean (South Korea)' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' },
        { code: 'zh-TW', name: 'Chinese (Traditional)' }
    ];

    res.json(supportedLanguages);
});

// Process transcription asynchronously
async function processTranscription(jobId, filePath, language) {
    try {
        const job = transcriptionJobs.get(jobId);
        if (!job) return;

        // Update progress
        job.progress = 25;
        transcriptionJobs.set(jobId, job);

        // Perform transcription
        const transcriptionResult = await azureSpeech.transcribeAudio(filePath, language);

        // Update job with results
        job.status = 'completed';
        job.progress = 100;
        job.transcription = transcriptionResult.text;
        job.confidence = transcriptionResult.confidence;
        job.duration = transcriptionResult.duration;
        job.completedTime = new Date();
        transcriptionJobs.set(jobId, job);

        // Clean up uploaded file and converted files
        try {
            fs.unlinkSync(filePath);
            azureSpeech.cleanupConvertedFiles();
        } catch (cleanupError) {
            console.warn('Failed to cleanup file:', cleanupError.message);
        }

    } catch (error) {
        console.error('Transcription error:', error);
        const job = transcriptionJobs.get(jobId);
        if (job) {
            job.status = 'failed';
            job.error = error.message;
            job.completedTime = new Date();
            transcriptionJobs.set(jobId, job);
        }

        // Clean up uploaded file and converted files on error
        try {
            fs.unlinkSync(filePath);
            azureSpeech.cleanupConvertedFiles();
        } catch (cleanupError) {
            console.warn('Failed to cleanup file after error:', cleanupError.message);
        }
    }
}

// Export the routes
router.post('/transcribe-audio', transcribeAudio);

// Export the router as the main export and transcribeAudio as a property
module.exports = router;
module.exports.transcribeAudio = transcribeAudio;
