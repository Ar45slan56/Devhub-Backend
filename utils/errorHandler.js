const { AUTH_ERRORS } = require('../constants/messages/errors');

const handleError = (res, error) => {
    console.error('Error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: Object.values(error.errors).map(err => err.message)
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: AUTH_ERRORS.TOKEN_INVALID
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: AUTH_ERRORS.TOKEN_EXPIRED
        });
    }

    // Handle custom error messages
    if (error.message in AUTH_ERRORS) {
        return res.status(error.status || 400).json({
            success: false,
            error: AUTH_ERRORS[error.message]
        });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`
        });
    }

    // Default error response
    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};

module.exports = {
    handleError
}; 