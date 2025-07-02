const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');

class AzureSpeechService {
    constructor() {
        this.speechKey = process.env.AZURE_SPEECH_KEY || '';
        this.speechRegion = process.env.AZURE_SPEECH_REGION || 'eastus';
        
        if (!this.speechKey) {
            console.warn('AZURE_SPEECH_KEY not configured');
        }
    }

    async transcribeAudio(audioFilePath, language = 'en-US') {
        return new Promise((resolve, reject) => {
            try {
                // Validate API key
                if (!this.speechKey) {
                    throw new Error('Azure Speech API key not configured. Please set AZURE_SPEECH_KEY environment variable.');
                }

                // Check if file exists
                if (!fs.existsSync(audioFilePath)) {
                    throw new Error('Audio file not found');
                }

                // Create speech config
                const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
                speechConfig.speechRecognitionLanguage = language;
                speechConfig.outputFormat = sdk.OutputFormat.Detailed;

                // Create audio config from file
                const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));

                // Create speech recognizer
                const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

                let transcriptionText = '';
                let confidence = 0;
                let duration = 0;

                // Handle recognition results
                recognizer.recognized = (s, e) => {
                    if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                        transcriptionText += e.result.text + ' ';
                        
                        // Extract confidence from detailed results
                        if (e.result.json) {
                            try {
                                const detailedResult = JSON.parse(e.result.json);
                                if (detailedResult.NBest && detailedResult.NBest.length > 0) {
                                    confidence = Math.max(confidence, detailedResult.NBest[0].Confidence || 0);
                                }
                                duration += detailedResult.Duration || 0;
                            } catch (parseError) {
                                console.warn('Failed to parse detailed results:', parseError.message);
                            }
                        }
                    }
                };

                // Handle session stopped
                recognizer.sessionStopped = (s, e) => {
                    recognizer.stopContinuousRecognitionAsync();
                    
                    if (transcriptionText.trim()) {
                        resolve({
                            text: transcriptionText.trim(),
                            confidence: confidence,
                            duration: duration,
                            language: language
                        });
                    } else {
                        reject(new Error('No speech detected in the audio file'));
                    }
                };

                // Handle errors
                recognizer.canceled = (s, e) => {
                    let errorMessage = 'Speech recognition was canceled';
                    
                    if (e.reason === sdk.CancellationReason.Error) {
                        errorMessage = e.errorDetails || 'Unknown speech recognition error';
                        
                        // Provide more specific error messages
                        if (errorMessage.includes('1006')) {
                            errorMessage = 'No speech detected in the audio file';
                        } else if (errorMessage.includes('Authentication')) {
                            errorMessage = 'Azure Speech API authentication failed. Please check your API key and region.';
                        } else if (errorMessage.includes('BadRequest')) {
                            errorMessage = 'Invalid audio format or corrupted audio file';
                        }
                    }
                    
                    recognizer.stopContinuousRecognitionAsync();
                    reject(new Error(errorMessage));
                };

                // Start continuous recognition
                recognizer.startContinuousRecognitionAsync(
                    () => {
                        console.log('Speech recognition started');
                    },
                    (error) => {
                        console.error('Failed to start recognition:', error);
                        reject(new Error(`Failed to start speech recognition: ${error}`));
                    }
                );

            } catch (error) {
                console.error('Transcription service error:', error);
                reject(error);
            }
        });
    }

    // Get supported languages for speech recognition
    getSupportedLanguages() {
        return [
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
            { code: 'zh-TW', name: 'Chinese (Traditional)' },
            { code: 'ru-RU', name: 'Russian (Russia)' },
            { code: 'ar-EG', name: 'Arabic (Egypt)' },
            { code: 'hi-IN', name: 'Hindi (India)' }
        ];
    }
}

module.exports = new AzureSpeechService();
