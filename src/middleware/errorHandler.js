const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.errors.map(e => e.message),
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            error: 'Unique Constraint Error',
            message: err.errors.map(e => e.message),
        });
    }

    // Multer-specific error handling
    if (err instanceof multer.MulterError) {
        let message = 'File upload error';
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size exceeds the allowed limit of 30 mb';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file type or field';
                break;
        }
        return res.status(400).json({
            error: 'File Upload Error',
            message: message,
        });
    }

    // General Multer errors (non-specific)
    if (err.message === 'Only images and videos are allowed') {
        return res.status(400).json({
            success: false,
            error: 'File Upload Error',
            message: err.message,
        });
    }

    if (err.message === 'Each image file must not exceed 5MB' || err.message === 'Each video file must not exceed 20MB') {
        return res.status(400).json({
            success: false,
            error: 'File Upload Error',
            message: err.message,
        });
    }

    // Handle network-related errors
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            error: 'Network Error',
            message: 'Connection refused by the server',
        });
    }

    if (err.code === 'ETIMEDOUT') {
        return res.status(504).json({
            success: false,
            error: 'Network Error',
            message: 'Request timed out',
        });
    }

    if (err.code === 'ENOTFOUND') {
        return res.status(503).json({
            success: false,
            error: 'Network Error',
            message: 'Server not found',
        });
    }

    if (err.code === 'EHOSTUNREACH') {
        return res.status(503).json({
            error: 'Network Error',
            message: 'Host is unreachable',
        });
    }

    if (err.code === 'ECONNRESET') {
        return res.status(503).json({
            error: 'Network Error',
            details: 'Connection was reset by the server',
        });
    }

    // Handle Flutterwave API errors
    if (err.response && err.response.config && err.response.config.url.includes('flutterwave')) {
        return res.status(502).json({
            success: false,
            error: 'Flutterwave API Error',
            message: err.response.data?.message || 'An error occurred while communicating with Flutterwave.',
        });
    }

    // Handle Paystack API errors
    if (err.response && err.response.config && err.response.config.url.includes('paystack')) {
        return res.status(502).json({
            success: false,
            error: 'Paystack API Error',
            message: err.response.data?.message || 'An error occurred while communicating with Paystack.',
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: err.message,
    });


};

module.exports = errorHandler;
