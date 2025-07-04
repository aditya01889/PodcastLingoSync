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

## Audio Transcription Fixes

### Issues Fixed

1. **Invalid WAV Header Error**: Fixed the "Invalid WAV header in file, RIFF was not found" error by:
   - Adding audio format conversion using ffmpeg-static
   - Improving error handling for unsupported audio formats
   - Adding better file validation in upload middleware

2. **Route Registration Issue**: Fixed the incorrect route registration in server.js

3. **File Cleanup**: Added proper cleanup for both uploaded and converted audio files

### Supported Audio Formats

The backend now supports the following audio formats:
- WAV (native support)
- MP3 (converted to WAV)
- M4A (converted to WAV)
- OGG (converted to WAV)
- WebM (converted to WAV)
- AAC (converted to WAV)
- FLAC (converted to WAV)

### Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   AZURE_SPEECH_KEY=your_azure_speech_key
   AZURE_SPEECH_REGION=your_azure_region
   AZURE_TRANSLATOR_KEY=your_azure_translator_key
   AZURE_TRANSLATOR_REGION=your_azure_region
   ```

3. Start the server:
   ```bash
   npm start
   ```

### Testing

1. Upload an audio file through the frontend
2. Check the console logs for debugging information
3. The system will automatically convert non-WAV files to WAV format
4. Transcription results will be displayed in the frontend

### Error Handling

The system now provides more specific error messages:
- File format not supported
- Audio file corrupted
- No speech detected
- Authentication issues

### Dependencies Added

- `ffmpeg-static`: For audio format conversion
- Improved error handling and file validation
- Better debugging and logging