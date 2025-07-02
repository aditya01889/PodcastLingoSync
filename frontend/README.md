# Frontend - Podcast Transcription & Translation

## Overview
Modern responsive web interface for podcast transcription and translation services.

## Features
- Textarea for manual transcript input with character count
- Language selection dropdown for translation
- Audio file upload with drag-and-drop support
- Real-time progress tracking
- Tabbed results display (Transcription, Translation, Summary)
- Copy and download functionality for all outputs
- Loading indicators and error handling

## Files
- `index.html` - Main application interface
- `script.js` - Application logic and API calls
- `styles.css` - Responsive styling and animations

## Configuration
The `BACKEND_URL` constant in `script.js` points to the backend API server.

## API Integration
Makes calls to backend endpoints:
- `POST /transcribe-audio` - Audio file transcription
- `POST /translate` - Text translation
- `POST /generate-summary` - Summary generation