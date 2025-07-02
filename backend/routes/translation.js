const express = require('express');
const router = express.Router();
const azureTranslator = require('../services/azureTranslator');

// Direct translate endpoint (required format)
const translate = async (req, res) => {
    try {
        const { transcript, target_language, source_language } = req.body;
        const text = transcript || req.body.text; // Support both formats

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'No text provided',
                message: 'Please provide text or transcript to translate'
            });
        }

        if (!target_language) {
            return res.status(400).json({
                error: 'No target language specified',
                message: 'Please specify a target_language for translation'
            });
        }

        const translationResult = await azureTranslator.translateText(
            text,
            target_language,
            source_language
        );

        res.json({
            originalText: text,
            translatedText: translationResult.translatedText,
            sourceLanguage: translationResult.detectedLanguage || source_language,
            targetLanguage: target_language,
            confidence: translationResult.confidence,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
};

// Translate text
router.post('/translate', async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'No text provided',
                message: 'Please provide text to translate'
            });
        }

        if (!targetLanguage) {
            return res.status(400).json({
                error: 'No target language specified',
                message: 'Please specify a target language for translation'
            });
        }

        const translationResult = await azureTranslator.translateText(
            text,
            targetLanguage,
            sourceLanguage
        );

        res.json({
            originalText: text,
            translatedText: translationResult.translatedText,
            sourceLanguage: translationResult.detectedLanguage || sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: translationResult.confidence,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

// Get supported translation languages
router.get('/languages', async (req, res) => {
    try {
        const languages = await azureTranslator.getSupportedLanguages();
        res.json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error);
        // Fallback to common languages if API fails
        const fallbackLanguages = [
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' },
            { code: 'pt', name: 'Portuguese' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'zh', name: 'Chinese' },
            { code: 'ru', name: 'Russian' },
            { code: 'ar', name: 'Arabic' },
            { code: 'hi', name: 'Hindi' }
        ];
        res.json(fallbackLanguages);
    }
});

// Detect language of text
router.post('/detect', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'No text provided',
                message: 'Please provide text for language detection'
            });
        }

        const detectionResult = await azureTranslator.detectLanguage(text);

        res.json({
            text: text,
            detectedLanguage: detectionResult.language,
            confidence: detectionResult.confidence,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Language detection error:', error);
        res.status(500).json({
            error: 'Language detection failed',
            message: error.message
        });
    }
});

module.exports = {
    translate,
    router
};
