const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const ffmpeg = require('ffmpeg-static');

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

                // Convert audio to WAV format if needed
                this.convertToWav(audioFilePath).then(wavFilePath => {
                    this.performTranscription(wavFilePath, language, resolve, reject);
                }).catch(error => {
                    reject(error);
                });

            } catch (error) {
                console.error('Transcription service error:', error);
                reject(error);
            }
        });
    }

    async convertToWav(inputFilePath) {
        const fileExtension = path.extname(inputFilePath).toLowerCase();
        console.log(`Converting audio file: ${inputFilePath} (extension: ${fileExtension})`);
        
        // If already WAV, return the original path
        if (fileExtension === '.wav') {
            console.log('File is already WAV format, skipping conversion');
            return inputFilePath;
        }

        // For other formats, try to convert using ffmpeg if available
        try {
            const outputPath = inputFilePath.replace(fileExtension, '.wav');
            console.log(`Converting to WAV: ${outputPath}`);
            
            // Convert to WAV using ffmpeg-static
            await execAsync(`"${ffmpeg}" -i "${inputFilePath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`);
            
            // Store the converted file path for cleanup
            this.convertedFiles = this.convertedFiles || [];
            this.convertedFiles.push(outputPath);
            
            console.log('Audio conversion completed successfully');
            return outputPath;
        } catch (error) {
            console.warn('Failed to convert audio to WAV:', error.message);
            // Return original file if conversion fails
            return inputFilePath;
        }
    }

    performTranscription(audioFilePath, language, resolve, reject) {
        try {
            console.log(`Starting transcription for file: ${audioFilePath}`);
            
            // Create speech config
            const speechConfig = sdk.SpeechConfig.fromSubscription(this.speechKey, this.speechRegion);
            speechConfig.speechRecognitionLanguage = language;
            speechConfig.outputFormat = sdk.OutputFormat.Detailed;

            // Create audio config from file
            let audioConfig;
            const fileExtension = path.extname(audioFilePath).toLowerCase();
            console.log(`Creating audio config for file with extension: ${fileExtension}`);
            
            try {
                if (fileExtension === '.wav') {
                    console.log('Using WAV file input method');
                    audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));
                } else {
                    console.log('Using stream input method for non-WAV file');
                    // For non-WAV files, try using stream input
                    const audioStream = sdk.AudioInputStream.createPushStream();
                    const fileBuffer = fs.readFileSync(audioFilePath);
                    audioStream.write(fileBuffer);
                    audioStream.close();
                    audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);
                }
                console.log('Audio config created successfully');
            } catch (audioConfigError) {
                console.error('Failed to create audio config:', audioConfigError.message);
                reject(new Error(`Audio format not supported or file is corrupted. Please try uploading a WAV, MP3, or M4A file. Error: ${audioConfigError.message}`));
                return;
            }

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

    // Cleanup converted files
    cleanupConvertedFiles() {
        if (this.convertedFiles) {
            this.convertedFiles.forEach(filePath => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.warn('Failed to cleanup converted file:', error.message);
                }
            });
            this.convertedFiles = [];
        }
    }
}

module.exports = new AzureSpeechService();
