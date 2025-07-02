const express = require('express');
const router = express.Router();

// Generate summary from transcript
const generateSummary = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || !transcript.trim()) {
            return res.status(400).json({
                error: 'No transcript provided',
                message: 'Please provide transcript text to generate summary'
            });
        }

        // For now, generate a basic summary using text processing
        // In production, you would use Azure Text Analytics or OpenAI
        const summary = await generateTextSummary(transcript);

        res.json({
            title: summary.title,
            summary: summary.summary,
            bulletPoints: summary.bulletPoints,
            originalLength: transcript.length,
            summaryLength: summary.summary.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Summary generation error:', error);
        res.status(500).json({
            error: 'Summary generation failed',
            message: error.message
        });
    }
};

// Basic text summarization function
async function generateTextSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.toLowerCase().split(/\s+/);
    
    // Extract key topics (simplified approach)
    const wordFreq = {};
    words.forEach(word => {
        if (word.length > 4 && !isStopWord(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });
    
    const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

    // Generate title based on key topics
    const title = generateTitle(topWords, text);
    
    // Create summary (first 2-3 most relevant sentences)
    const summary = sentences.slice(0, 3).join('. ').trim() + '.';
    
    // Generate bullet points
    const bulletPoints = generateBulletPoints(sentences, topWords);

    return {
        title,
        summary,
        bulletPoints
    };
}

function generateTitle(keywords, text) {
    if (keywords.length === 0) return 'Audio Transcript Summary';
    
    // Simple title generation based on key terms
    const firstKeyword = keywords[0];
    const capitalizedKeyword = firstKeyword.charAt(0).toUpperCase() + firstKeyword.slice(1);
    
    if (text.toLowerCase().includes('podcast')) {
        return `Podcast: ${capitalizedKeyword} Discussion`;
    } else if (text.toLowerCase().includes('meeting')) {
        return `Meeting: ${capitalizedKeyword} Topics`;
    } else if (text.toLowerCase().includes('interview')) {
        return `Interview: ${capitalizedKeyword} Insights`;
    } else {
        return `${capitalizedKeyword} Summary`;
    }
}

function generateBulletPoints(sentences, keywords) {
    const points = [];
    
    // Find sentences that contain keywords
    const relevantSentences = sentences.filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return keywords.some(keyword => lowerSentence.includes(keyword));
    }).slice(0, 3);
    
    if (relevantSentences.length >= 3) {
        return relevantSentences.map(sentence => sentence.trim());
    }
    
    // Fallback: use first 3 substantial sentences
    const substantialSentences = sentences.filter(s => s.trim().length > 20).slice(0, 3);
    return substantialSentences.map(sentence => sentence.trim());
}

function isStopWord(word) {
    const stopWords = new Set([
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'can', 'must', 'shall', 'not', 'no', 'yes', 'all', 'any',
        'some', 'each', 'every', 'many', 'much', 'more', 'most', 'other', 'another',
        'such', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'very', 'too',
        'so', 'just', 'now', 'then', 'than', 'only', 'also', 'well', 'back', 'still'
    ]);
    return stopWords.has(word);
}

module.exports = router;
