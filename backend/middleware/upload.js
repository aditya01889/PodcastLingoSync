const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// File filter for audio files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/wave',
        'audio/ogg',
        'audio/webm',
        'audio/mp4',
        'audio/m4a',
        'audio/aac',
        'audio/flac',
        'audio/x-flac'
    ];

    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.mp4', '.m4a', '.aac', '.flac'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check if file has a valid extension
    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new Error(`Unsupported file format. Supported formats: ${allowedExtensions.join(', ')}`), false);
    }

    // Check if file has a valid MIME type (but be more lenient as MIME types can be unreliable)
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
        console.warn(`File ${file.originalname} has unexpected MIME type: ${file.mimetype}, but allowing based on extension`);
    }

    // Additional validation for file size
    if (file.size === 0) {
        return cb(new Error('File is empty'), false);
    }

    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1
    }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    error: 'File too large',
                    message: 'Audio file must be smaller than 100MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    error: 'Too many files',
                    message: 'Please upload only one audio file at a time'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    error: 'Unexpected file field',
                    message: 'Please use the correct file upload field'
                });
            default:
                return res.status(400).json({
                    error: 'Upload error',
                    message: error.message
                });
        }
    } else if (error) {
        return res.status(400).json({
            error: 'File validation error',
            message: error.message
        });
    }
    next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
