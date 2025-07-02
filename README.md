# Podcast Transcription & Translation Web App

A full-stack web application that uses Azure AI services to transcribe podcast audio files and translate the transcriptions into multiple languages.

## Features

- **Audio File Upload**: Support for multiple audio formats (MP3, WAV, OGG, M4A, etc.)
- **Speech-to-Text**: Transcribe audio using Azure Speech-to-Text API
- **Translation**: Translate transcriptions using Azure Translator API
- **Multiple Languages**: Support for 15+ languages for transcription and 50+ for translation
- **Real-time Progress**: Live progress tracking for transcription jobs
- **Responsive Design**: Works on desktop and mobile devices
- **Download & Copy**: Easy export of transcriptions and translations

## Technology Stack

### Backend
- Node.js
- Express.js
- Azure Cognitive Services SDK
- Multer for file uploads
- dotenv for environment variables

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

### Azure Services
- Azure Speech-to-Text API
- Azure Translator API

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Azure Cognitive Services Account**
   - Speech Services resource
   - Translator Text resource

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd podcast-transcription-app
