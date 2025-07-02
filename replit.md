# Podcast Transcription & Translation Web App

## Overview

This is a full-stack web application that leverages Azure AI services to transcribe podcast audio files and translate the transcriptions into multiple languages. The system provides a simple web interface for uploading audio files, real-time progress tracking, and easy export of results.

## System Architecture

The application follows a traditional client-server architecture with the following components:

- **Frontend**: Vanilla JavaScript SPA with HTML5/CSS3 for the user interface
- **Backend**: Node.js/Express.js REST API server
- **External Services**: Azure Cognitive Services (Speech-to-Text and Translator APIs)
- **File Storage**: Local filesystem for temporary audio file storage

The architecture is designed for simplicity and ease of deployment, using in-memory storage for job tracking rather than a persistent database for this initial implementation.

## Key Components

### Backend Components

1. **Express Server** (`server.js`)
   - Main application server with middleware configuration
   - Serves static files and API routes
   - Handles CORS and error management
   - Auto-creates uploads directory structure

2. **Route Handlers**
   - `routes/transcription.js`: Handles audio upload and transcription operations
   - `routes/translation.js`: Manages text translation requests

3. **Azure Service Integrations**
   - `services/azureSpeech.js`: Wrapper for Azure Speech-to-Text API
   - `services/azureTranslator.js`: Wrapper for Azure Translator API

4. **File Upload Middleware** (`middleware/upload.js`)
   - Multer configuration for audio file handling
   - File type validation and storage management
   - Supports multiple audio formats (MP3, WAV, OGG, M4A, etc.)

### Frontend Components

1. **Single Page Application** (`public/index.html`)
   - Responsive design with drag-and-drop file uploads
   - Language selection for source and target languages
   - Real-time progress tracking interface
   - Results display with tabbed transcription/translation views

2. **JavaScript Application** (`public/script.js`)
   - `PodcastTranscriber` class manages the entire frontend workflow
   - Handles file uploads, progress polling, and results display
   - Implements retry logic and error handling

3. **Styling** (`public/styles.css`)
   - Modern gradient design with card-based layout
   - Responsive design for mobile and desktop
   - Font Awesome icons for enhanced UX

## Data Flow

1. **File Upload**: User uploads audio file through drag-and-drop or file picker
2. **Job Creation**: Server creates a unique job ID and stores job metadata in memory
3. **Transcription Processing**: Azure Speech-to-Text API processes the audio file asynchronously
4. **Progress Tracking**: Frontend polls server for job status updates
5. **Translation (Optional)**: User can translate transcription to target language using Azure Translator
6. **Results Display**: Final transcription and translation are displayed with copy/download options
7. **Cleanup**: Temporary audio files are cleaned up after processing

## External Dependencies

### Azure Services
- **Azure Speech Services**: Speech-to-Text transcription with support for 15+ languages
- **Azure Translator**: Text translation supporting 50+ language pairs
- **Authentication**: Subscription key-based authentication for both services

### Node.js Dependencies
- **express**: Web framework for API server
- **cors**: Cross-origin resource sharing middleware
- **multer**: File upload handling
- **microsoft-cognitiveservices-speech-sdk**: Azure Speech Services SDK
- **@azure/ai-translation-text**: Azure Translator SDK
- **dotenv**: Environment variable management

### Environment Variables Required
- `AZURE_SPEECH_KEY`: Azure Speech Services subscription key
- `AZURE_SPEECH_REGION`: Azure region for Speech Services
- `AZURE_TRANSLATOR_KEY`: Azure Translator subscription key
- `AZURE_TRANSLATOR_REGION`: Azure region for Translator service
- `PORT`: Server port (defaults to 8000)

## Deployment Strategy

The application is designed for simple deployment with the following characteristics:

1. **Stateless Design**: No persistent database required for basic functionality
2. **Environment Configuration**: All Azure credentials managed through environment variables
3. **Static File Serving**: Frontend served directly from Express server
4. **File Storage**: Local filesystem storage for temporary audio files
5. **Process Management**: In-memory job tracking suitable for single-instance deployment

**Deployment Considerations**:
- Suitable for containerization (Docker)
- Can be deployed to cloud platforms (Azure App Service, AWS, Heroku)
- For production scale, consider adding database for job persistence
- File storage should be moved to cloud storage for multi-instance deployments

## Changelog

```
Changelog:
- July 02, 2025. Production readiness audit completed:
  * ✅ Confirmed monorepo structure (frontend/ + backend/)
  * ✅ All required API endpoints functional (/translate, /transcribe-audio, /generate-summary)
  * ✅ Rate limiting implemented (100 req/day, 5K chars/req, premium bypass)
  * ✅ Environment configuration with .env.example
  * ✅ Backend package.json with start script
  * ✅ CORS middleware for frontend compatibility
  * ✅ Comprehensive error handling and validation
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```