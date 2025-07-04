// Backend API configuration
const BACKEND_URL = "https://podcastlingosync.onrender.com";

class PodcastTranscriber {
    constructor() {
        this.currentJobId = null;
        this.polling = false;
        this.supportedLanguages = [];
        this.translationLanguages = [];
        this.currentTranscript = '';
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSupportedLanguages();
    }

    initializeElements() {
        // Text input elements
        this.inputTranscript = document.getElementById('inputTranscript');
        this.targetLanguageText = document.getElementById('targetLanguageText');
        this.translateBtn = document.getElementById('translateBtn');
        this.summaryBtn = document.getElementById('summaryBtn');
        this.charCount = document.querySelector('.char-count');

        // Form elements
        this.uploadForm = document.getElementById('uploadForm');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.audioFileInput = document.getElementById('audioFile');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.sourceLanguageSelect = document.getElementById('sourceLanguage');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.processingSteps = {
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3')
        };

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.transcriptionText = document.getElementById('transcriptionText');
        this.translationText = document.getElementById('translationText');
        this.translationTab = document.getElementById('translationTab');
        this.summaryTab = document.getElementById('summaryTab');
        this.sourceLanguageBadge = document.getElementById('sourceLanguageBadge');
        this.targetLanguageBadge = document.getElementById('targetLanguageBadge');
        this.confidenceBadge = document.getElementById('confidenceBadge');

        // Summary elements
        this.summaryTitleText = document.getElementById('summaryTitleText');
        this.summaryMainText = document.getElementById('summaryMainText');
        this.summaryBulletsList = document.getElementById('summaryBulletsList');

        // Error elements
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');

        // File info elements
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
    }

    setupEventListeners() {
        // Text input events
        this.inputTranscript.addEventListener('input', (e) => this.handleTextInput(e));
        this.translateBtn.addEventListener('click', () => this.handleTranslateText());
        this.summaryBtn.addEventListener('click', () => this.handleGenerateSummary());

        // File upload events
        this.uploadForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.fileUploadArea.addEventListener('click', () => this.audioFileInput.click());
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Action buttons
        document.getElementById('copyTranscriptionBtn').addEventListener('click', () => {
            this.copyToClipboard(this.transcriptionText.textContent);
        });
        document.getElementById('copyTranslationBtn').addEventListener('click', () => {
            this.copyToClipboard(this.translationText.textContent);
        });
        document.getElementById('downloadTranscriptionBtn').addEventListener('click', () => {
            this.downloadText(this.transcriptionText.textContent, 'transcription.txt');
        });
        document.getElementById('downloadTranslationBtn').addEventListener('click', () => {
            this.downloadText(this.translationText.textContent, 'translation.txt');
        });
        document.getElementById('copySummaryBtn').addEventListener('click', () => {
            this.copyToClipboard(this.getSummaryText());
        });
        document.getElementById('downloadSummaryBtn').addEventListener('click', () => {
            this.downloadText(this.getSummaryText(), 'summary.txt');
        });

        // Try again button
        this.tryAgainBtn.addEventListener('click', () => this.resetForm());

        // Add event listener for target language dropdown to update Translate Text button state
        this.targetLanguageText.addEventListener('change', () => {
            const hasText = this.inputTranscript.value.trim().length > 0;
            this.translateBtn.disabled = !hasText || !this.targetLanguageText.value;
        });
    }

    async loadSupportedLanguages() {
        try {
            // Load transcription languages
            const transcriptionResponse = await fetch(`${BACKEND_URL}/transcribe/languages`);
            if (transcriptionResponse.ok) {
                this.supportedLanguages = await transcriptionResponse.json();
                this.populateLanguageSelect(this.sourceLanguageSelect, this.supportedLanguages);
            }

            // Load translation languages
            const translationResponse = await fetch(`${BACKEND_URL}/translate/languages`);
            if (translationResponse.ok) {
                this.translationLanguages = await translationResponse.json();
                this.populateLanguageSelect(this.targetLanguageText, this.translationLanguages, true);
            }
        } catch (error) {
            console.warn('Failed to load supported languages:', error);
        }
    }

    handleTextInput(e) {
        const text = e.target.value;
        const charLimit = 5000;
        const remaining = charLimit - text.length;
        
        this.charCount.textContent = `${text.length} / ${charLimit} characters (free tier)`;
        this.charCount.style.color = remaining < 0 ? '#e53e3e' : '#666';
        
        // Enable/disable buttons based on text content
        const hasText = text.trim().length > 0;
        this.summaryBtn.disabled = !hasText;
        this.translateBtn.disabled = !hasText || !this.targetLanguageText.value;
        
        // Update current transcript
        this.currentTranscript = text;
        
        // Show character limit warning
        if (remaining < 0) {
            this.showToast('Character limit exceeded. Upgrade to premium for unlimited usage.', 'error');
        }
    }

    async handleTranslateText() {
        const text = this.inputTranscript.value.trim();
        const targetLanguage = this.targetLanguageText.value;
        
        if (!text || !targetLanguage) {
            this.showToast('Please enter text and select a target language', 'error');
            return;
        }

        try {
            this.translateBtn.disabled = true;
            this.translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
            
            const response = await fetch(`${BACKEND_URL}/translate/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    targetLanguage: targetLanguage
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Translation failed');
            }

            this.displayTranslation(result);
            this.showResults();
            this.showToast('Translation completed successfully!');

        } catch (error) {
            console.error('Translation error:', error);
            this.showError(error.message);
        } finally {
            this.translateBtn.disabled = false;
            this.translateBtn.innerHTML = '<i class="fas fa-language"></i> Translate Text';
        }
    }

    async handleGenerateSummary() {
        const text = this.inputTranscript.value.trim() || this.currentTranscript;
        
        if (!text) {
            this.showToast('Please enter text to generate summary', 'error');
            return;
        }

        try {
            this.summaryBtn.disabled = true;
            this.summaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            const response = await fetch(`${BACKEND_URL}/summary/generate-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transcript: text
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Summary generation failed');
            }

            this.displaySummary(result);
            this.showResults();
            this.showToast('Summary generated successfully!');

        } catch (error) {
            console.error('Summary error:', error);
            this.showError(error.message);
        } finally {
            this.summaryBtn.disabled = false;
            this.summaryBtn.innerHTML = '<i class="fas fa-list"></i> Generate Summary';
        }
    }

    populateLanguageSelect(selectElement, languages, includeEmpty = false) {
        // Clear existing options except the first one if includeEmpty is true
        if (includeEmpty) {
            selectElement.innerHTML = '<option value="">Select target language (optional)</option>';
        } else {
            selectElement.innerHTML = '';
        }

        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            selectElement.appendChild(option);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('drag-over');
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.audioFileInput.files = files;
            this.handleFileSelect({ target: { files } });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.displayFileInfo(file);
            this.uploadBtn.disabled = false;
        } else {
            this.hideFileInfo();
            this.uploadBtn.disabled = true;
        }
    }

    displayFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileInfo.style.display = 'flex';
        this.fileUploadArea.querySelector('p').style.display = 'none';
        this.fileUploadArea.querySelector('.upload-icon').style.display = 'none';
    }

    hideFileInfo() {
        this.fileInfo.style.display = 'none';
        this.fileUploadArea.querySelector('p').style.display = 'block';
        this.fileUploadArea.querySelector('.upload-icon').style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const audioFile = this.audioFileInput.files[0];
        const sourceLanguage = this.sourceLanguageSelect.value;

        if (!audioFile) {
            this.showError('Please select an audio file');
            return;
        }

        formData.append('audioFile', audioFile);
        formData.append('language', sourceLanguage);

        try {
            this.showProgress();
            this.updateProgressStep('step1', 'active');
            this.updateProgress(25, 'Uploading audio file...');

            const response = await fetch(`${BACKEND_URL}/transcribe/transcribe-audio`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Transcription failed');
            }

            // Direct response from transcribe-audio endpoint
            this.updateProgressStep('step1', 'completed');
            this.updateProgressStep('step2', 'completed');
            this.updateProgress(100, 'Transcription completed!');

            // Display transcription results
            this.displayTranscriptionDirect(result);
            this.currentTranscript = result.transcript;
            
            // Populate the text input with the transcription
            this.inputTranscript.value = result.transcript;
            this.handleTextInput({ target: { value: result.transcript } });

            setTimeout(() => this.showResults(), 1000);

        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message);
        }
    }

    async startPolling(targetLanguage) {
        this.polling = true;
        
        const pollInterval = setInterval(async () => {
            if (!this.polling || !this.currentJobId) {
                clearInterval(pollInterval);
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/transcribe/status/${this.currentJobId}`);
                const status = await response.json();

                if (!response.ok) {
                    throw new Error(status.message || 'Failed to get transcription status');
                }

                if (status.status === 'completed') {
                    clearInterval(pollInterval);
                    this.polling = false;
                    
                    this.updateProgressStep('step2', 'completed');
                    this.updateProgress(75, 'Transcription completed!');

                    // Show transcription results
                    this.displayTranscription(status);

                    // Start translation if target language is selected
                    if (targetLanguage) {
                        this.updateProgressStep('step3', 'active');
                        this.updateProgress(85, 'Translating text...');
                        await this.translateText(status.transcription, targetLanguage);
                    } else {
                        this.updateProgress(100, 'Processing completed!');
                        setTimeout(() => this.showResults(), 1000);
                    }

                } else if (status.status === 'failed') {
                    clearInterval(pollInterval);
                    this.polling = false;
                    throw new Error(status.error || 'Transcription failed');
                }

                // Update progress for processing status
                if (status.progress) {
                    this.updateProgress(Math.min(50 + status.progress / 2, 75), 'Transcribing audio...');
                }

            } catch (error) {
                clearInterval(pollInterval);
                this.polling = false;
                console.error('Polling error:', error);
                this.showError(error.message);
            }
        }, 2000);
    }

    async translateText(text, targetLanguage) {
        try {
            const response = await fetch(`${BACKEND_URL}/translate/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    targetLanguage: targetLanguage
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Translation failed');
            }

            this.displayTranslation(result);
            this.updateProgressStep('step3', 'completed');
            this.updateProgress(100, 'Translation completed!');
            
            setTimeout(() => this.showResults(), 1000);

        } catch (error) {
            console.error('Translation error:', error);
            // Show transcription even if translation fails
            this.updateProgress(100, 'Transcription completed (translation failed)');
            setTimeout(() => this.showResults(), 1000);
        }
    }

    displayTranscription(transcriptionData) {
        this.transcriptionText.innerHTML = `<p>${transcriptionData.transcription}</p>`;
        
        // Update language badge
        const sourceLang = this.supportedLanguages.find(lang => lang.code === transcriptionData.language);
        this.sourceLanguageBadge.textContent = sourceLang ? sourceLang.name : transcriptionData.language;
        
        // Update confidence badge
        if (transcriptionData.confidence) {
            const confidencePercent = Math.round(transcriptionData.confidence * 100);
            this.confidenceBadge.textContent = `${confidencePercent}% confidence`;
        } else {
            this.confidenceBadge.style.display = 'none';
        }
    }

    displayTranscriptionDirect(transcriptionData) {
        this.transcriptionText.innerHTML = `<p>${transcriptionData.transcript}</p>`;
        
        // Update language badge
        const sourceLang = this.supportedLanguages.find(lang => lang.code === transcriptionData.language);
        this.sourceLanguageBadge.textContent = sourceLang ? sourceLang.name : transcriptionData.language;
        
        // Update confidence badge
        if (transcriptionData.confidence) {
            const confidencePercent = Math.round(transcriptionData.confidence * 100);
            this.confidenceBadge.textContent = `${confidencePercent}% confidence`;
        } else {
            this.confidenceBadge.style.display = 'none';
        }
    }

    displayTranslation(translationData) {
        this.translationText.innerHTML = `<p>${translationData.translatedText}</p>`;
        
        // Update target language badge
        const targetLang = this.translationLanguages.find(lang => lang.code === translationData.targetLanguage);
        this.targetLanguageBadge.textContent = targetLang ? targetLang.name : translationData.targetLanguage;
        
        // Show translation tab
        this.translationTab.style.display = 'block';
        this.switchTab('translation');
    }

    displaySummary(summaryData) {
        this.summaryTitleText.textContent = summaryData.title;
        this.summaryMainText.innerHTML = `<p>${summaryData.summary}</p>`;
        
        // Clear and populate bullet points
        this.summaryBulletsList.innerHTML = '';
        summaryData.bulletPoints.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            this.summaryBulletsList.appendChild(li);
        });
        
        // Show summary tab
        this.summaryTab.style.display = 'block';
        this.switchTab('summary');
    }

    getSummaryText() {
        const title = this.summaryTitleText.textContent;
        const summary = this.summaryMainText.textContent;
        const bullets = Array.from(this.summaryBulletsList.children).map(li => `• ${li.textContent}`).join('\n');
        
        return `${title}\n\n${summary}\n\nKey Points:\n${bullets}`;
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    updateProgressStep(stepId, status) {
        const step = this.processingSteps[stepId];
        if (step) {
            step.className = `step ${status}`;
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        const activeTab = document.getElementById(tabName);
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
    }

    showProgress() {
        this.hideAllSections();
        this.progressSection.style.display = 'block';
        this.resetProgressSteps();
    }

    showResults() {
        this.hideAllSections();
        this.resultsSection.style.display = 'block';
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
    }

    hideAllSections() {
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
    }

    resetProgressSteps() {
        Object.values(this.processingSteps).forEach(step => {
            step.className = 'step';
        });
        this.updateProgress(0, 'Preparing...');
    }

    resetForm() {
        this.uploadForm.reset();
        this.hideFileInfo();
        this.uploadBtn.disabled = true;
        this.hideAllSections();
        this.currentJobId = null;
        this.polling = false;
        this.translationTab.style.display = 'none';
        this.confidenceBadge.style.display = 'block';
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Text copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy text:', error);
            this.showToast('Failed to copy text', 'error');
        }
    }

    downloadText(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('File downloaded!');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PodcastTranscriber();
});

// Add CSS for toast animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
