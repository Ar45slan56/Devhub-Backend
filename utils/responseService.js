const { AUTH_ERRORS } = require('../constants/messages/errors');

class ResponseService {
    static success(res, { message, data = null, status = 200 }) {
        return res.status(status).json({
            success: true,
            message,
            ...(data && { data })
        });
    }

    static error(res, { message, status = 400, errors = null }) {
        return res.status(status).json({
            success: false,
            error: message,
            ...(errors && { errors })
        });
    }

    static serverError(res, error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }

    static validationError(res, message) {
        return res.status(400).json({
            success: false,
            ...(Array.isArray(message) ? { errors: message } : { error: message })
        });
    }

    static unauthorized(res, message = AUTH_ERRORS.UNAUTHORIZED) {
        return res.status(401).json({
            success: false,
            error: message
        });
    }

    static forbidden(res, message = AUTH_ERRORS.FORBIDDEN) {
        return res.status(403).json({
            success: false,
            error: message
        });
    }

    static notFound(res, message = AUTH_ERRORS.NOT_FOUND) {
        return res.status(404).json({
            success: false,
            error: message
        });
    }

    static conflict(res, message = AUTH_ERRORS.ALREADY_EXISTS) {
        return res.status(409).json({
            success: false,
            error: message
        });
    }

    static tooManyRequests(res, message = AUTH_ERRORS.TOO_MANY_REQUESTS) {
        return res.status(429).json({
            success: false,
            error: message
        });
    }
}

module.exports = ResponseService; 