# Backend - Podcast Transcription & Translation API

## Overview
Node.js Express server providing AI-powered transcription and translation services.

## Required Endpoints
✅ `POST /transcribe-audio` - Upload audio file, returns transcript
✅ `POST /translate` - Accepts `{ transcript, target_language }`, returns translation
✅ `POST /generate-summary` - Accepts transcript, returns title + summary + bullet points

## Features
- Azure Speech-to-Text integration
- Azure Translator API integration
- Rate limiting (100 requests/day, 5K chars/request)
- Premium token support for unlimited usage
- File upload handling with validation
- Character limits with premium bypass
- Comprehensive error handling

## Middleware
- CORS support for frontend
- Rate limiting with IP-based tracking
- Character count validation
- File upload processing
- Error handling and logging

## Environment Setup
Copy `.env.example` to `.env` and configure:
```env
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=eastus
AZURE_TRANSLATOR_KEY=your_key_here
AZURE_TRANSLATOR_REGION=eastus
```

## Security
- Premium token authentication for unlimited access
- Rate limiting prevents abuse
- File validation and cleanup
- Secure environment variable handling