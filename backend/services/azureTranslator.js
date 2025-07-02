// Using REST API instead of SDK for Azure Translator
const https = require('https');
const querystring = require('querystring');

class AzureTranslatorService {
    constructor() {
        this.translatorKey = process.env.AZURE_TRANSLATOR_KEY || '';
        this.translatorRegion = process.env.AZURE_TRANSLATOR_REGION || 'eastus';
        this.endpoint = 'https://api.cognitive.microsofttranslator.com';
        
        if (!this.translatorKey) {
            console.warn('AZURE_TRANSLATOR_KEY not configured');
        }
    }

    makeRequest(path, data) {
        return new Promise((resolve, reject) => {
            const requestData = JSON.stringify(data);
            
            const options = {
                hostname: 'api.cognitive.microsofttranslator.com',
                port: 443,
                path: path,
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.translatorKey,
                    'Ocp-Apim-Subscription-Region': this.translatorRegion,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestData)
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error?.message || `HTTP ${res.statusCode}: ${body}`));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(requestData);
            req.end();
        });
    }

    async translateText(text, targetLanguage, sourceLanguage = null) {
        try {
            if (!this.translatorKey) {
                throw new Error('Azure Translator API key not configured. Please set AZURE_TRANSLATOR_KEY environment variable.');
            }

            const inputText = [{
                text: text
            }];

            const params = new URLSearchParams({
                'api-version': '3.0',
                'to': targetLanguage
            });

            if (sourceLanguage) {
                params.append('from', sourceLanguage);
            }

            const path = `/translate?${params.toString()}`;
            const translateResponse = await this.makeRequest(path, inputText);

            if (!translateResponse || !translateResponse[0] || !translateResponse[0].translations) {
                throw new Error('No translation result received from Azure Translator');
            }

            const translation = translateResponse[0].translations[0];
            const detectedLanguage = translateResponse[0].detectedLanguage;

            return {
                translatedText: translation.text,
                detectedLanguage: detectedLanguage ? detectedLanguage.language : null,
                confidence: detectedLanguage ? detectedLanguage.score : null,
                targetLanguage: targetLanguage
            };

        } catch (error) {
            console.error('Translation error:', error);
            
            // Provide more specific error messages
            if (error.message.includes('401')) {
                throw new Error('Azure Translator API authentication failed. Please check your API key.');
            } else if (error.message.includes('400')) {
                throw new Error('Invalid translation request. Please check the text and language codes.');
            } else if (error.message.includes('429')) {
                throw new Error('Translation rate limit exceeded. Please try again later.');
            } else if (error.message.includes('500')) {
                throw new Error('Azure Translator service is temporarily unavailable. Please try again later.');
            }
            
            throw error;
        }
    }

    async detectLanguage(text) {
        try {
            if (!this.translatorKey) {
                throw new Error('Azure Translator API key not configured. Please set AZURE_TRANSLATOR_KEY environment variable.');
            }

            const inputText = [{
                text: text
            }];

            const params = new URLSearchParams({
                'api-version': '3.0',
                'to': 'en'
            });

            const path = `/translate?${params.toString()}`;
            const translateResponse = await this.makeRequest(path, inputText);

            if (!translateResponse || !translateResponse[0] || !translateResponse[0].detectedLanguage) {
                throw new Error('No language detection result received from Azure Translator');
            }

            const detected = translateResponse[0].detectedLanguage;

            return {
                language: detected.language,
                confidence: detected.score
            };

        } catch (error) {
            console.error('Language detection error:', error);
            throw error;
        }
    }

    async getSupportedLanguages() {
        try {
            // Return a static list of common languages for now
            // In production, you could fetch from /languages endpoint
            const languages = [
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
                { code: 'hi', name: 'Hindi' },
                { code: 'nl', name: 'Dutch' },
                { code: 'sv', name: 'Swedish' },
                { code: 'no', name: 'Norwegian' },
                { code: 'da', name: 'Danish' },
                { code: 'fi', name: 'Finnish' },
                { code: 'pl', name: 'Polish' },
                { code: 'tr', name: 'Turkish' },
                { code: 'th', name: 'Thai' }
            ];

            return languages;

        } catch (error) {
            console.error('Error getting supported languages:', error);
            throw error;
        }
    }
}

module.exports = new AzureTranslatorService();
